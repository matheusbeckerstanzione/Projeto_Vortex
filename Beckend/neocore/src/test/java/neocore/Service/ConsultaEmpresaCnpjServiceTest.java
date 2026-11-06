package neocore.Service;

import jakarta.validation.Validation;

import neocore.Client.BrasilApiClient;
import neocore.Client.ViaCepClient;

import neocore.DTO.empresa.ConsultaEmpresaCnpjRequest;
import neocore.DTO.integracao.BrasilApiCnpjResponse;
import neocore.DTO.integracao.ViaCepResponse;

import neocore.Exception.AcessoNegadoException;
import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RegraNegocioException;

import neocore.Model.Empresa;
import neocore.Model.Usuario;
import neocore.Model.Enum.PerfilUsuario;

import neocore.Repository.EmpresaRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ConsultaEmpresaCnpjServiceTest {

    private static final String CNPJ = "00000000000191";

    private final BrasilApiClient brasil =
            mock(BrasilApiClient.class);

    private final ViaCepClient via =
            mock(ViaCepClient.class);

    private final ServiceSupport suporte =
            mock(ServiceSupport.class);

    private final EmpresaRepository empresas =
            mock(EmpresaRepository.class);

    private final PlatformTransactionManager transacoes =
            mock(PlatformTransactionManager.class);

    private ConsultaEmpresaCnpjService service;

    @BeforeEach
    void preparar() {
        when(transacoes.getTransaction(any()))
                .thenAnswer(invocacao ->
                        new SimpleTransactionStatus()
                );

        var usuario = new Usuario();

        usuario.setId(UUID.randomUUID());
        usuario.setPerfil(PerfilUsuario.ANALISTA);

        when(suporte.atual()).thenReturn(usuario);

        when(empresas.findByCnpj(CNPJ))
                .thenReturn(Optional.empty());

        when(brasil.consultarCnpj(CNPJ))
                .thenReturn(
                        brasil(
                                "70040912",
                                "Quadra",
                                "Bairro"
                        )
                );

        when(via.consultarCep("70040912"))
                .thenReturn(
                        via(
                                "70040-912",
                                "Brasília",
                                "DF",
                                "5300108"
                        )
                );

        service = new ConsultaEmpresaCnpjService(
                brasil,
                via,
                suporte,
                empresas,
                transacoes
        );
    }

    @Test
    void consultaOsDoisFornecedoresEMapeiaSomenteCamposPrevistos() {
        var resultado = service.consultar(
                new ConsultaEmpresaCnpjRequest(CNPJ)
        );

        assertEquals(CNPJ, resultado.cnpj());

        assertEquals(
                "Empresa de teste",
                resultado.razaoSocial()
        );

        assertEquals(
                "6422100",
                resultado.cnaePrincipal()
        );

        assertEquals("DEMAIS", resultado.porte());

        assertEquals(
                LocalDate.of(2000, 1, 1),
                resultado.dataAbertura()
        );

        assertEquals(
                "Brasilia",
                resultado.endereco().cidade()
        );

        assertEquals(
                "70040912",
                resultado.endereco().cep()
        );

        assertEquals(
                "BrasilAPI",
                resultado.origemPorCampo().get("logradouro")
        );

        assertTrue(resultado.avisos().isEmpty());
        assertNull(resultado.empresaIdExistente());

        verify(via).consultarCep("70040912");

        assertThrows(
                UnsupportedOperationException.class,
                () -> resultado.origemPorCampo()
                        .put("email", "outro")
        );
    }

    @Test
    void normalizaMascaraAntesDeConsultar() {
        service.consultar(
                new ConsultaEmpresaCnpjRequest(
                        "00.000.000/0001-91"
                )
        );

        verify(brasil).consultarCnpj(CNPJ);
    }

    @Test
    void rejeitaEntradaInvalidaSemConsultarFornecedores() {
        assertThrows(
                RegraNegocioException.class,
                () -> service.consultar(
                        new ConsultaEmpresaCnpjRequest(
                                "../qualquer"
                        )
                )
        );

        verifyNoInteractions(brasil, via);
    }

    @Test
    void exigeUsuarioAutenticadoAntesDeConsultarFornecedores() {
        when(suporte.atual())
                .thenThrow(
                        new AcessoNegadoException(
                                "Autenticação necessária."
                        )
                );

        assertThrows(
                AcessoNegadoException.class,
                () -> service.consultar(
                        new ConsultaEmpresaCnpjRequest(CNPJ)
                )
        );

        verifyNoInteractions(brasil, via, empresas);
    }

    @Test
    void rejeitaUsuarioSemPerfilPermitido() {
        when(suporte.atual())
                .thenReturn(new Usuario());

        assertThrows(
                AcessoNegadoException.class,
                () -> service.consultar(
                        new ConsultaEmpresaCnpjRequest(CNPJ)
                )
        );

        verifyNoInteractions(brasil, via, empresas);
    }

    @Test
    void falhaPostalDevolveResultadoParcialComAviso() {
        when(via.consultarCep("70040912"))
                .thenThrow(
                        new IntegracaoExternaException(
                                HttpStatus.GATEWAY_TIMEOUT,
                                "Timeout"
                        )
                );

        var resultado = service.consultar(
                new ConsultaEmpresaCnpjRequest(CNPJ)
        );

        assertEquals(
                "Empresa de teste",
                resultado.razaoSocial()
        );

        assertEquals(
                "Quadra",
                resultado.endereco().logradouro()
        );

        assertTrue(
                resultado.avisos().stream()
                        .anyMatch(aviso ->
                                aviso.contains("parcial")
                        )
        );
    }

    @Test
    void naoMisturaMunicipiosDivergentes() {
        when(brasil.consultarCnpj(CNPJ))
                .thenReturn(
                        brasil("70040912", null, null)
                );

        when(via.consultarCep("70040912"))
                .thenReturn(
                        via(
                                "70040-912",
                                "São Paulo",
                                "SP",
                                "3550308"
                        )
                );

        var resultado = service.consultar(
                new ConsultaEmpresaCnpjRequest(CNPJ)
        );

        assertNull(resultado.endereco().logradouro());
        assertNull(resultado.endereco().bairro());

        assertEquals(
                "DF",
                resultado.endereco().uf()
        );

        assertTrue(
                resultado.avisos().stream()
                        .anyMatch(aviso ->
                                aviso.contains("divergentes")
                        )
        );
    }

    @Test
    void complementaAusenciasSemUsarComplementoPostalComoComplementoDaEmpresa() {
        when(brasil.consultarCnpj(CNPJ))
                .thenReturn(
                        brasil("70040912", null, null)
                );

        var resultado = service.consultar(
                new ConsultaEmpresaCnpjRequest(CNPJ)
        );

        assertEquals(
                "Rua postal",
                resultado.endereco().logradouro()
        );

        assertEquals(
                "Asa Norte",
                resultado.endereco().bairro()
        );

        assertNull(
                resultado.endereco().complemento()
        );

        assertEquals(
                "ViaCEP",
                resultado.origemPorCampo().get("logradouro")
        );
    }

    @Test
    void avisaSobreCadastroExistenteSemSalvarOuSobrescrever() {
        var empresa = new Empresa();

        empresa.setId(UUID.randomUUID());
        empresa.setNome("Nome revisado manualmente");

        when(empresas.findByCnpj(CNPJ))
                .thenReturn(Optional.of(empresa));

        var resultado = service.consultar(
                new ConsultaEmpresaCnpjRequest(CNPJ)
        );

        assertEquals(
                empresa.getId(),
                resultado.empresaIdExistente()
        );

        assertEquals(
                "Nome revisado manualmente",
                empresa.getNome()
        );

        assertFalse(resultado.avisos().isEmpty());

        verify(empresas).findByCnpj(CNPJ);

        verifyNoMoreInteractions(empresas);
    }

    @Test
    void falhaBrasilApiNaoConsultaViaCepNemGrava() {
        when(brasil.consultarCnpj(CNPJ))
                .thenThrow(
                        new IntegracaoExternaException(
                                HttpStatus.BAD_GATEWAY,
                                "Falha"
                        )
                );

        assertThrows(
                IntegracaoExternaException.class,
                () -> service.consultar(
                        new ConsultaEmpresaCnpjRequest(CNPJ)
                )
        );

        verifyNoInteractions(via);

        verify(empresas).findByCnpj(CNPJ);

        verifyNoMoreInteractions(empresas);
    }

    @Test
    void respostaNulaDoFornecedorERecusada() {
        when(brasil.consultarCnpj(CNPJ))
                .thenReturn(null);

        assertThrows(
                IntegracaoExternaException.class,
                () -> service.consultar(
                        new ConsultaEmpresaCnpjRequest(CNPJ)
                )
        );

        verifyNoInteractions(via);
    }

    @Test
    void cepAusenteNaoDisparaConsultaPostal() {
        when(brasil.consultarCnpj(CNPJ))
                .thenReturn(
                        brasil(null, "Quadra", "Bairro")
                );

        var resultado = service.consultar(
                new ConsultaEmpresaCnpjRequest(CNPJ)
        );

        assertNull(resultado.endereco().cep());

        verifyNoInteractions(via);

        assertTrue(
                resultado.avisos().stream()
                        .anyMatch(aviso ->
                                aviso.contains("CEP válido")
                        )
        );
    }

    @Test
    void transacoesDeLeituraTerminamAntesDasChamadasHttp() {
        service.consultar(
                new ConsultaEmpresaCnpjRequest(CNPJ)
        );

        var ordem = inOrder(
                transacoes,
                suporte,
                empresas,
                brasil,
                via
        );

        ordem.verify(transacoes)
                .getTransaction(any());

        ordem.verify(suporte).atual();

        ordem.verify(transacoes).commit(any());

        ordem.verify(suporte).validar(any());

        ordem.verify(transacoes)
                .getTransaction(any());

        ordem.verify(empresas)
                .findByCnpj(CNPJ);

        ordem.verify(transacoes).commit(any());

        ordem.verify(brasil).consultarCnpj(CNPJ);

        ordem.verify(via).consultarCep("70040912");
    }

    @Test
    void dtoRejeitaCnpjVazioOuForaDoFormato() {
        try (
                var factory =
                        Validation.buildDefaultValidatorFactory()
        ) {
            var validator = factory.getValidator();

            assertFalse(
                    validator.validate(
                            new ConsultaEmpresaCnpjRequest("")
                    ).isEmpty()
            );

            assertFalse(
                    validator.validate(
                            new ConsultaEmpresaCnpjRequest("123")
                    ).isEmpty()
            );

            assertTrue(
                    validator.validate(
                            new ConsultaEmpresaCnpjRequest(CNPJ)
                    ).isEmpty()
            );

            assertTrue(
                    validator.validate(
                            new ConsultaEmpresaCnpjRequest(
                                    "00.000.000/0001-91"
                            )
                    ).isEmpty()
            );
        }
    }

    private static BrasilApiCnpjResponse brasil(
            String cep,
            String rua,
            String bairro
    ) {
        return new BrasilApiCnpjResponse(
                CNPJ,
                "Empresa de teste",
                "Fantasia",
                "DEMAIS",
                5,
                6422100,
                "Setor de teste",
                "Sociedade",
                2,
                "ATIVA",
                LocalDate.of(2000, 1, 1),
                cep,
                null,
                rua,
                "10",
                null,
                bairro,
                "Brasilia",
                "DF",
                5300108
        );
    }

    private static ViaCepResponse via(
            String cep,
            String cidade,
            String uf,
            String ibge
    ) {
        return new ViaCepResponse(
                cep,
                "Rua postal",
                "Complemento postal genérico",
                "Unidade postal",
                "Asa Norte",
                cidade,
                uf,
                "Distrito Federal",
                "Centro-Oeste",
                ibge,
                "",
                "61",
                "9701",
                false
        );
    }
}