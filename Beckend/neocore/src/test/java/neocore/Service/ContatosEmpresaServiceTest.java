package neocore.Service;

import neocore.Client.BrasilApiClient;
import neocore.Client.ViaCepClient;
import neocore.DTO.empresa.ConsultaEmpresaCnpjRequest;
import neocore.DTO.enriquecimento.*;
import neocore.DTO.integracao.BrasilApiCnpjResponse;
import neocore.Exception.ConflitoException;
import neocore.Exception.RegraNegocioException;
import neocore.Mapper.EmpresaMapper;
import neocore.Model.*;
import neocore.Model.Enum.PerfilUsuario;
import neocore.Repository.EmpresaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import tools.jackson.databind.json.JsonMapper;

import java.time.OffsetDateTime;
import java.util.*;

import static neocore.DTO.enriquecimento.CampoEnriquecimentoEmpresa.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ContatosEmpresaServiceTest {
    private final BrasilApiClient brasil = mock(BrasilApiClient.class);
    private final ViaCepClient via = mock(ViaCepClient.class);
    private final ServiceSupport suporte = mock(ServiceSupport.class);
    private final AuditoriaService auditoria = mock(AuditoriaService.class);
    private final EmpresaRepository repository = mock(EmpresaRepository.class);
    private final PlatformTransactionManager transacoes = mock(PlatformTransactionManager.class);
    private EnriquecimentoEmpresaService service;
    private Empresa empresa;
    private EnriquecimentoPreviaRequest parametros;

    @BeforeEach void preparar() {
        when(transacoes.getTransaction(any())).thenAnswer(i -> new SimpleTransactionStatus());
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setPerfil(PerfilUsuario.ANALISTA);
        when(suporte.atual()).thenReturn(usuario);
        empresa = new Empresa();
        empresa.setId(UUID.randomUUID());
        empresa.setCnpj("00000000000191");
        empresa.setNome("Empresa cadastrada");
        empresa.setSetor("Tecnologia");
        empresa.setCidade("Brasília");
        empresa.setUf("DF");
        empresa.setVersao(0L);
        when(suporte.obter(Empresa.class, empresa.getId())).thenReturn(empresa);
        when(suporte.bloquear(Empresa.class, empresa.getId())).thenReturn(empresa);
        parametros = new EnriquecimentoPreviaRequest(UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), OffsetDateTime.now().plusDays(1));
        when(suporte.finalidade(parametros.finalidadeId())).thenReturn(new FinalidadeTratamento());
        fonte(parametros.fonteBrasilApiId(), "https://brasilapi.com.br");
        fonte(parametros.fonteViaCepId(), "https://viacep.com.br");
        when(brasil.consultarCnpj(anyString())).thenReturn(dados(
                "comercial@example.org", "(11) 3234-5678", "(11) 99876-5432"));
        service = new EnriquecimentoEmpresaService(brasil, via, suporte, auditoria,
                new PreviasEmpresaStore(), repository, transacoes);
    }

    private void fonte(UUID id, String url) {
        var fonte = new FonteDados(); fonte.setId(id); fonte.setEnderecoOrigem(url);
        when(suporte.fonte(id)).thenReturn(fonte);
    }

    private static BrasilApiCnpjResponse dados(String email, String primeiro, String segundo) {
        return new BrasilApiCnpjResponse("00000000000191", "Empresa consultada", null,
                "DEMAIS", 5, 6201501, "Tecnologia", null, 2, "ATIVA", null,
                null, null, null, null, null, null, "Brasília", "DF", 5300108,
                email, primeiro, segundo);
    }

    private EnriquecimentoConfirmacaoRequest confirmar(EnriquecimentoPreviaResponse previa,
                                                       Set<CampoEnriquecimentoEmpresa> campos,
                                                       Set<CampoEnriquecimentoEmpresa> sobrescrever) {
        return new EnriquecimentoConfirmacaoRequest(previa.previaId(), campos, sobrescrever);
    }

    @Test void jacksonLeContatosEIgnoraCamposNaoSelecionados() {
        var resultado = JsonMapper.builder().build().readValue("""
                {"cnpj":"00000000000191","email":"contato@example.org",
                 "ddd_telefone_1":"1132345678","ddd_telefone_2":null,"qsa":[]}
                """, BrasilApiCnpjResponse.class);
        assertEquals("contato@example.org", resultado.email());
        assertEquals("1132345678", resultado.dddTelefone1());
        assertNull(resultado.dddTelefone2());
    }

    @Test void normalizaFormatoSemInventarContatos() {
        assertEquals("Comercial@example.org", ContatosEmpresaSupport.email(" Comercial@EXAMPLE.ORG "));
        assertEquals("+551132345678", ContatosEmpresaSupport.telefone("(11) 3234-5678"));
        assertEquals("+5511998765432", ContatosEmpresaSupport.telefone(" +55 (11) 99876-5432 "));
        assertNull(ContatosEmpresaSupport.email(null));
        assertNull(ContatosEmpresaSupport.telefone(""));
    }

    @Test void rejeitaEmailInvalidoSemTruncarOuRemoverInjecao() {
        for (String entrada : List.of("sem-arroba", "a..b@example.org", "a@example..org",
                "a@example.org\r\nBcc: outra@example.org", "x".repeat(65) + "@example.org")) {
            assertNull(ContatosEmpresaSupport.email(entrada));
        }
    }

    @Test void rejeitaTelefoneSemDddComRamalOuPaisIncompativel() {
        for (String entrada : List.of("998765432", "00998765432", "+1 212 555-0100",
                "1132345678 ramal 10", "00000000000", "1132345678/11998765432")) {
            assertNull(ContatosEmpresaSupport.telefone(entrada));
        }
    }

    @Test void previaOfereceContatosSemSalvar() {
        var previa = service.previa(empresa.getId(), parametros);
        assertTrue(previa.campos().stream().anyMatch(c -> c.campo() == EMAIL_CONTATO));
        assertTrue(previa.campos().stream().anyMatch(c -> c.campo() == TELEFONE_SECUNDARIO));
        assertNull(empresa.getEmailContato());
        verifyNoInteractions(auditoria);
        verify(repository, never()).flush();
    }

    @Test void confirmacaoSelecionaContatosERegistraProveniencia() {
        var previa = service.previa(empresa.getId(), parametros);
        var resultado = service.confirmar(empresa.getId(), confirmar(previa,
                Set.of(EMAIL_CONTATO, TELEFONE_PRINCIPAL), Set.of()));
        assertEquals("comercial@example.org", empresa.getEmailContato());
        assertEquals("+551132345678", empresa.getTelefonePrincipal());
        assertNull(empresa.getTelefoneSecundario());
        assertEquals("BrasilAPI", resultado.origens().get("EMAIL_CONTATO").get("fornecedor"));
        assertEquals(parametros.finalidadeId().toString(), resultado.origens().get("EMAIL_CONTATO").get("finalidadeId"));
        assertNotNull(resultado.origens().get("EMAIL_CONTATO").get("confirmadoPor"));
        verify(repository).flush();
    }

    @Test void naoSobrescreveContatoSemEscolhaExplicita() {
        empresa.setEmailContato("revisado@example.org");
        var previa = service.previa(empresa.getId(), parametros);
        assertThrows(RegraNegocioException.class, () -> service.confirmar(empresa.getId(),
                confirmar(previa, Set.of(EMAIL_CONTATO), Set.of())));
        assertEquals("revisado@example.org", empresa.getEmailContato());
        service.confirmar(empresa.getId(), confirmar(previa, Set.of(EMAIL_CONTATO), Set.of(EMAIL_CONTATO)));
        assertEquals("comercial@example.org", empresa.getEmailContato());
    }

    @Test void contatoAusenteNaoApagaCadastro() {
        empresa.setEmailContato("revisado@example.org");
        when(brasil.consultarCnpj(anyString())).thenReturn(dados(null, null, null));
        var previa = service.previa(empresa.getId(), parametros);
        assertTrue(previa.campos().stream().noneMatch(c -> c.campo() == EMAIL_CONTATO));
        assertThrows(RegraNegocioException.class, () -> service.confirmar(empresa.getId(),
                confirmar(previa, Set.of(EMAIL_CONTATO), Set.of(EMAIL_CONTATO))));
        assertEquals("revisado@example.org", empresa.getEmailContato());
    }

    @Test void contatosInvalidosGeramAvisoSemVazarConteudo() {
        when(brasil.consultarCnpj(anyString())).thenReturn(dados("email-invalido", "0000000000", null));
        var previa = service.previa(empresa.getId(), parametros);
        assertTrue(previa.campos().stream().noneMatch(c -> c.campo() == EMAIL_CONTATO || c.campo() == TELEFONE_PRINCIPAL));
        assertTrue(previa.avisos().stream().anyMatch(a -> a.contains("EMAIL_CONTATO")));
        assertTrue(previa.avisos().stream().noneMatch(a -> a.contains("email-invalido")));
    }

    @Test void telefoneRepetidoNaoCriaSegundoContato() {
        when(brasil.consultarCnpj(anyString())).thenReturn(dados(null, "1132345678", "+55 (11) 3234-5678"));
        var previa = service.previa(empresa.getId(), parametros);
        assertTrue(previa.campos().stream().anyMatch(c -> c.campo() == TELEFONE_PRINCIPAL));
        assertTrue(previa.campos().stream().noneMatch(c -> c.campo() == TELEFONE_SECUNDARIO));
    }

    @Test void mudancaDeContatoDesdePreviaImpedeConfirmacaoMesmoSemMudarVersao() {
        var previa = service.previa(empresa.getId(), parametros);
        empresa.setTelefonePrincipal("+551133334444");
        assertThrows(ConflitoException.class, () -> service.confirmar(empresa.getId(),
                confirmar(previa, Set.of(TELEFONE_PRINCIPAL), Set.of(TELEFONE_PRINCIPAL))));
    }

    @Test void consultaCnpjDevolveContatosSemGravar() {
        when(repository.findByCnpj("00000000000191")).thenReturn(Optional.empty());
        var consulta = new ConsultaEmpresaCnpjService(brasil, via, suporte, repository, transacoes);
        var resultado = consulta.consultar(new ConsultaEmpresaCnpjRequest("00000000000191"));
        assertEquals("comercial@example.org", resultado.emailContato());
        assertEquals("+551132345678", resultado.telefonePrincipal());
        assertEquals("BrasilAPI", resultado.origemPorCampo().get("emailContato"));
        verify(repository, never()).flush();
    }

    @Test void mapperExpoeContatosSalvosNaRespostaDaEmpresa() {
        empresa.setEmailContato("revisado@example.org");
        empresa.setTelefonePrincipal("+551132345678");
        var resposta = new EmpresaMapper().toResponse(empresa);
        assertEquals(empresa.getEmailContato(), resposta.emailContato());
        assertEquals(empresa.getTelefonePrincipal(), resposta.telefonePrincipal());
        assertNull(resposta.telefoneSecundario());
    }
}
