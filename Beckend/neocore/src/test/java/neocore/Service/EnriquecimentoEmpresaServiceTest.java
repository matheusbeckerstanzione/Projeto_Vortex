package neocore.Service;

import neocore.Client.*;
import neocore.DTO.enriquecimento.*;
import neocore.DTO.integracao.*;
import neocore.Exception.*;
import neocore.Model.*;
import neocore.Repository.EmpresaRepository;
import org.junit.jupiter.api.*;
import org.springframework.transaction.*;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

import static neocore.DTO.enriquecimento.CampoEnriquecimentoEmpresa.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EnriquecimentoEmpresaServiceTest {
    BrasilApiClient brasil;
    ViaCepClient via;
    ServiceSupport suporte;
    AuditoriaService auditoria;
    EmpresaRepository repository;
    EnriquecimentoEmpresaService service;
    Empresa empresa;
    Usuario usuario;
    EnriquecimentoPreviaRequest request;
    AtomicInteger transacoes;

    @BeforeEach void preparar() {
        brasil = mock(BrasilApiClient.class); via = mock(ViaCepClient.class);
        suporte = mock(ServiceSupport.class); auditoria = mock(AuditoriaService.class);
        repository = mock(EmpresaRepository.class);
        PlatformTransactionManager manager = mock(PlatformTransactionManager.class);
        transacoes = new AtomicInteger();
        when(manager.getTransaction(any())).thenAnswer(i -> {
            transacoes.incrementAndGet(); return new SimpleTransactionStatus();
        });
        doAnswer(i -> { transacoes.decrementAndGet(); return null; }).when(manager).commit(any());
        doAnswer(i -> { transacoes.decrementAndGet(); return null; }).when(manager).rollback(any());

        usuario = new Usuario(); usuario.setId(UUID.randomUUID());
        empresa = new Empresa(); empresa.setId(UUID.randomUUID()); empresa.setVersao(0L);
        empresa.setCnpj("00000000000191"); empresa.setNome("Nome atual");
        empresa.setSetor("Setor atual"); empresa.setCidade("São Paulo"); empresa.setUf("SP");
        request = new EnriquecimentoPreviaRequest(UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), OffsetDateTime.now().plusDays(1));
        when(suporte.atual()).thenReturn(usuario);
        when(suporte.obter(Empresa.class, empresa.getId())).thenReturn(empresa);
        when(suporte.bloquear(Empresa.class, empresa.getId())).thenReturn(empresa);
        var finalidade = new FinalidadeTratamento(); finalidade.setId(request.finalidadeId());
        when(suporte.finalidade(request.finalidadeId())).thenReturn(finalidade);
        fonte(request.fonteBrasilApiId(), "https://brasilapi.com.br");
        fonte(request.fonteViaCepId(), "https://viacep.com.br");
        when(brasil.consultarCnpj(anyString())).thenAnswer(i -> {
            assertEquals(0, transacoes.get(), "HTTP não deve manter transação de banco");
            return dadosBrasil("São Paulo", "Desenvolvimento de programas");
        });
        when(via.consultarCep(anyString())).thenReturn(dadosVia("São Paulo", "SP", "3550308"));
        service = new EnriquecimentoEmpresaService(brasil, via, suporte, auditoria,
                new PreviasEmpresaStore(), repository, manager);
    }

    private void fonte(UUID id, String url) {
        var fonte = new FonteDados(); fonte.setId(id); fonte.setEnderecoOrigem(url);
        when(suporte.fonte(id)).thenReturn(fonte);
    }

    private static BrasilApiCnpjResponse dadosBrasil(String cidade, String setor) {
        return new BrasilApiCnpjResponse("00000000000191", "Razão consultada", null,
                "PEQUENO PORTE", 1, 6201501, setor, null, 2, "ATIVA", null,
                "01001-000", null, null, "100", "Sala 2", null, cidade, "SP", 3550308);
    }

    private static ViaCepResponse dadosVia(String cidade, String uf, String ibge) {
        return new ViaCepResponse("01001-000", "Praça da Sé", "lado ímpar", "", "Sé",
                cidade, uf, "São Paulo", "Sudeste", ibge, "", "11", "", false);
    }

    @Test void previaNaoAlteraCadastroENaoMantemTransacaoDuranteHttp() {
        var previa = service.previa(empresa.getId(), request);
        assertFalse(previa.campos().isEmpty());
        assertEquals("Nome atual", empresa.getNome()); assertNull(empresa.getCep());
        verify(repository, never()).flush(); verifyNoInteractions(auditoria);
        assertEquals(0, transacoes.get());
    }

    @Test void confirmaSomenteCampoSelecionadoEPreservaOrigem() {
        var previa = service.previa(empresa.getId(), request);
        var resposta = service.confirmar(empresa.getId(), new EnriquecimentoConfirmacaoRequest(
                previa.previaId(), Set.of(PORTE), Set.of()));
        assertEquals("PEQUENO PORTE", empresa.getPorte());
        assertNull(empresa.getCep()); assertEquals("Nome atual", empresa.getNome());
        assertEquals("BrasilAPI", resposta.origens().get("PORTE").get("fornecedor"));
        assertEquals(request.finalidadeId().toString(), resposta.origens().get("PORTE").get("finalidadeId"));
        verify(repository).flush(); verify(auditoria).registrar(eq(usuario), anyString(), eq("Empresa"), eq(empresa.getId()), any());
    }

    @Test void exigeSobrescritaEPermiteCorrigirConfirmacao() {
        var previa = service.previa(empresa.getId(), request);
        assertThrows(RegraNegocioException.class, () -> service.confirmar(empresa.getId(),
                new EnriquecimentoConfirmacaoRequest(previa.previaId(), Set.of(NOME), Set.of())));
        assertEquals("Nome atual", empresa.getNome());
        service.confirmar(empresa.getId(), new EnriquecimentoConfirmacaoRequest(
                previa.previaId(), Set.of(NOME), Set.of(NOME)));
        assertEquals("Razão consultada", empresa.getNome());
    }

    @Test void cadastroAlteradoInvalidaPrevia() {
        var previa = service.previa(empresa.getId(), request);
        empresa.setVersao(1L);
        assertThrows(ConflitoException.class, () -> service.confirmar(empresa.getId(),
                new EnriquecimentoConfirmacaoRequest(previa.previaId(), Set.of(CEP), Set.of())));
        verify(repository, never()).flush();
    }

    @Test void outroUsuarioNaoPodeConfirmar() {
        var previa = service.previa(empresa.getId(), request);
        var outro = new Usuario(); outro.setId(UUID.randomUUID()); when(suporte.atual()).thenReturn(outro);
        assertThrows(RecursoNaoEncontradoException.class, () -> service.confirmar(empresa.getId(),
                new EnriquecimentoConfirmacaoRequest(previa.previaId(), Set.of(CEP), Set.of())));
    }

    @Test void confirmacaoNaoPodeSerRepetida() {
        var previa = service.previa(empresa.getId(), request);
        var confirmacao = new EnriquecimentoConfirmacaoRequest(previa.previaId(), Set.of(PORTE), Set.of());
        service.confirmar(empresa.getId(), confirmacao);
        assertThrows(RecursoNaoEncontradoException.class, () -> service.confirmar(empresa.getId(), confirmacao));
    }

    @Test void campoNaoOferecidoNaoPodeSerConfirmado() {
        var previa = service.previa(empresa.getId(), request);
        assertThrows(RegraNegocioException.class, () -> service.confirmar(empresa.getId(),
                new EnriquecimentoConfirmacaoRequest(previa.previaId(), Set.of(UF), Set.of(UF))));
    }

    @Test void fonteReavaliadaNaConfirmacao() {
        var previa = service.previa(empresa.getId(), request);
        when(suporte.fonte(request.fonteBrasilApiId())).thenThrow(new RegraNegocioException("Fonte desabilitada"));
        assertThrows(RegraNegocioException.class, () -> service.confirmar(empresa.getId(),
                new EnriquecimentoConfirmacaoRequest(previa.previaId(), Set.of(CEP), Set.of())));
        verify(repository, never()).flush();
    }

    @Test void viaCepComplementaAusenciasSemInventarNumeroOuComplemento() {
        var previa = service.previa(empresa.getId(), request);
        var logradouro = previa.campos().stream().filter(c -> c.campo() == LOGRADOURO).findFirst().orElseThrow();
        assertEquals("ViaCEP", logradouro.fornecedor());
        var complemento = previa.campos().stream().filter(c -> c.campo() == COMPLEMENTO).findFirst().orElseThrow();
        assertEquals("Sala 2", complemento.sugerido()); assertEquals("BrasilAPI", complemento.fornecedor());
    }

    @Test void divergenciaMunicipalNaoMisturaEnderecos() {
        when(via.consultarCep(anyString())).thenReturn(dadosVia("Campinas", "SP", "3509502"));
        var previa = service.previa(empresa.getId(), request);
        assertFalse(previa.avisos().isEmpty());
        assertTrue(previa.campos().stream().noneMatch(c -> c.fornecedor().equals("ViaCEP")));
    }

    @Test void falhaViaCepPermitePreviaParcialIdentificada() {
        when(via.consultarCep(anyString())).thenThrow(new RecursoNaoEncontradoException("CEP não encontrado"));
        var previa = service.previa(empresa.getId(), request);
        assertFalse(previa.avisos().isEmpty());
        assertTrue(previa.campos().stream().anyMatch(c -> c.campo() == CEP));
    }

    @Test void valorAcimaDoLimiteNaoETruncado() {
        when(brasil.consultarCnpj(anyString())).thenReturn(dadosBrasil("São Paulo", "x".repeat(81)));
        var previa = service.previa(empresa.getId(), request);
        assertTrue(previa.campos().stream().noneMatch(c -> c.campo() == SETOR));
        assertTrue(previa.avisos().stream().anyMatch(a -> a.contains("SETOR")));
    }

    @Test void cacheImpedeReservaConcorrenteEExpira() {
        Clock inicio = Clock.fixed(Instant.parse("2026-10-30T12:00:00Z"), ZoneOffset.UTC);
        class Relogio extends Clock {
            Instant agora = inicio.instant();
            public ZoneId getZone() { return ZoneOffset.UTC; }
            public Clock withZone(ZoneId z) { return this; }
            public Instant instant() { return agora; }
        }
        var relogio = new Relogio(); var store = new PreviasEmpresaStore(relogio);
        var contexto = new PreviasEmpresaStore.Contexto(usuario.getId(), empresa.getId(), 0L,
                empresa.getCnpj(), Map.of(), request);
        var previa = store.guardar(contexto, List.of(), List.of());
        store.reservar(previa.previaId(), usuario.getId(), empresa.getId());
        assertThrows(ConflitoException.class, () -> store.reservar(previa.previaId(), usuario.getId(), empresa.getId()));
        store.liberar(previa.previaId()); relogio.agora = inicio.instant().plusSeconds(301);
        assertThrows(ConflitoException.class, () -> store.reservar(previa.previaId(), usuario.getId(), empresa.getId()));
    }

    private EnriquecimentoConfirmacaoRequest enderecoCompleto(
            EnriquecimentoPreviaResponse previa) {
        var grupo = EnumSet.of(CEP, CIDADE, UF, MUNICIPIO_IBGE,
                LOGRADOURO, NUMERO, COMPLEMENTO, BAIRRO);
        var campos = EnumSet.noneOf(CampoEnriquecimentoEmpresa.class);
        var sobrescrever = EnumSet.noneOf(CampoEnriquecimentoEmpresa.class);
        for (var campo : previa.campos()) {
            if (grupo.contains(campo.campo())) {
                campos.add(campo.campo());
                if (campo.exigeSobrescrita()) sobrescrever.add(campo.campo());
            }
        }
        return new EnriquecimentoConfirmacaoRequest(previa.previaId(), campos, sobrescrever);
    }

    @Test void cepIsoladoNaoPodeMisturarEnderecoAntigoComNovo() {
        empresa.setCidade("Campinas"); empresa.setMunicipioIbge("3509502");
        empresa.setCep("13010000");
        var previa = service.previa(empresa.getId(), request);
        assertThrows(RegraNegocioException.class, () -> service.confirmar(empresa.getId(),
                new EnriquecimentoConfirmacaoRequest(previa.previaId(), Set.of(CEP), Set.of(CEP))));
        assertEquals("Campinas", empresa.getCidade()); assertEquals("13010000", empresa.getCep());
        verify(repository, never()).flush(); verifyNoInteractions(auditoria);
    }

    @Test void enderecoCompletoPodeSerConfirmadoComSobrescritaExplicita() {
        empresa.setCidade("Campinas"); empresa.setMunicipioIbge("3509502");
        empresa.setCep("13010000");
        var previa = service.previa(empresa.getId(), request);
        var resposta = service.confirmar(empresa.getId(), enderecoCompleto(previa));
        assertEquals("São Paulo", empresa.getCidade()); assertEquals("01001000", empresa.getCep());
        assertEquals("3550308", empresa.getMunicipioIbge());
        assertEquals("Praça da Sé", empresa.getLogradouro());
        assertEquals("ViaCEP", resposta.origens().get("LOGRADOURO").get("fornecedor"));
    }

    @Test void grupoCompletoAindaExigeAutorizacaoParaSobrescrever() {
        empresa.setCidade("Campinas");
        var previa = service.previa(empresa.getId(), request);
        var completo = enderecoCompleto(previa);
        assertThrows(RegraNegocioException.class, () -> service.confirmar(empresa.getId(),
                new EnriquecimentoConfirmacaoRequest(previa.previaId(), completo.campos(), Set.of())));
        assertEquals("Campinas", empresa.getCidade());
    }

    @Test void campoAntigoNaoInformadoPelaApiImpedeMisturaSemApagaLo() {
        empresa.setCidade("Campinas"); empresa.setBairro("Bairro antigo");
        when(via.consultarCep(anyString())).thenThrow(new RecursoNaoEncontradoException("Indisponível"));
        var previa = service.previa(empresa.getId(), request);
        assertThrows(RegraNegocioException.class,
                () -> service.confirmar(empresa.getId(), enderecoCompleto(previa)));
        assertEquals("Campinas", empresa.getCidade()); assertEquals("Bairro antigo", empresa.getBairro());
    }

    @Test void semCepNaoConfirmaEnderecoParcial() {
        when(brasil.consultarCnpj(anyString())).thenReturn(new BrasilApiCnpjResponse(
                "00000000000191", "Razão consultada", null, "PEQUENO PORTE", 1,
                6201501, "Tecnologia", null, 2, "ATIVA", null, null,
                null, null, null, null, null, "Campinas", "SP", 3509502));
        var previa = service.previa(empresa.getId(), request);
        assertThrows(RegraNegocioException.class,
                () -> service.confirmar(empresa.getId(), enderecoCompleto(previa)));
    }

    @Test void camposIguaisContinuamForaDaListaDeAlteracoes() {
        var previa = service.previa(empresa.getId(), request);
        assertTrue(previa.campos().stream().noneMatch(c -> c.campo() == CIDADE || c.campo() == UF));
        service.confirmar(empresa.getId(), enderecoCompleto(previa));
        assertEquals("São Paulo", empresa.getCidade()); assertEquals("SP", empresa.getUf());
    }
}
