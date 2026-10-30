package neocore.Client;

import neocore.Config.IntegracoesHttpConfig;
import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RecursoNaoEncontradoException;
import neocore.Exception.RegraNegocioException;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class ClientsTest {

    private static final String CNPJ = "19131243000197";

    private static final String URL_CNPJ =
            "https://brasilapi.com.br/api/cnpj/v1/" + CNPJ;

    private static final String CEP = "01001000";

    private static final String URL_CEP =
            "https://viacep.com.br/ws/" + CEP + "/json/";

    private record Brasil(
            BrasilApiClient client,
            MockRestServiceServer server
    ) {}

    private record Cep(
            ViaCepClient client,
            MockRestServiceServer server
    ) {}

    private Brasil brasil() {
        var builder = RestClient.builder()
                .baseUrl("https://brasilapi.com.br");

        var server = MockRestServiceServer
                .bindTo(builder)
                .build();

        return new Brasil(
                new BrasilApiClient(builder.build()),
                server
        );
    }

    private Cep cep() {
        var builder = RestClient.builder()
                .baseUrl("https://viacep.com.br");

        var server = MockRestServiceServer
                .bindTo(builder)
                .build();

        return new Cep(
                new ViaCepClient(builder.build()),
                server
        );
    }

    @Test
    void configuraOsDoisBeansSemPrecisarDeBuilderDoBoot() {
        try (var context = new AnnotationConfigApplicationContext(
                IntegracoesHttpConfig.class,
                BrasilApiClient.class,
                ViaCepClient.class
        )) {
            assertNotNull(context.getBean(BrasilApiClient.class));
            assertNotNull(context.getBean(ViaCepClient.class));

            assertTrue(context.containsBean("brasilApiRestClient"));
            assertTrue(context.containsBean("viaCepRestClient"));
        }
    }

    @Test
    void cnpjComMascaraUsaEndpointCorretoEConverteDto() {
        var fixture = brasil();

        fixture.server()
                .expect(requestTo(URL_CNPJ))
                .andRespond(
                        withSuccess(
                                """
                                {
                                  "cnpj": "19131243000197",
                                  "razao_social": "Empresa de teste",
                                  "cnae_fiscal": 6201501,
                                  "codigo_municipio_ibge": 3550308,
                                  "data_inicio_atividade": "2013-10-03",
                                  "campo_adicional": true
                                }
                                """,
                                MediaType.APPLICATION_JSON
                        )
                );

        var resposta = fixture.client()
                .consultarCnpj(" 19.131.243/0001-97 ");

        assertEquals("Empresa de teste", resposta.razaoSocial());
        assertEquals(6201501, resposta.cnaeFiscal());

        assertEquals(
                LocalDate.of(2013, 10, 3),
                resposta.dataInicioAtividade()
        );

        fixture.server().verify();
    }

    @Test
    void cnpjAlfanumericoPreservaLetrasEUsaMaiusculas() {
        var fixture = brasil();

        fixture.server()
                .expect(
                        requestTo(
                                "https://brasilapi.com.br/api/cnpj/v1/"
                                        + "12ABC34501DE35"
                        )
                )
                .andRespond(
                        withSuccess(
                                """
                                {"cnpj": "12ABC34501DE35"}
                                """,
                                MediaType.APPLICATION_JSON
                        )
                );

        var resposta = fixture.client()
                .consultarCnpj("12.abc.345/01de-35");

        assertEquals("12ABC34501DE35", resposta.cnpj());

        fixture.server().verify();
    }

    @Test
    void formatoCnpjInvalidoNaoFazRequisicao() {
        var fixture = brasil();

        String[] valores = {
                null,
                "",
                "123",
                "19X1312430001-97",
                "https://localhost/"
        };

        for (String valor : valores) {
            assertThrows(
                    RegraNegocioException.class,
                    () -> fixture.client().consultarCnpj(valor)
            );
        }

        // Nenhuma requisição HTTP era esperada.
        fixture.server().verify();
    }

    @Test
    void respostaCnpjVaziaMalformadaOuDivergenteVira502() {
        String[] corpos = {
                "",
                "{",
                "{}",
                "{\"cnpj\":\"12345678000195\"}"
        };

        for (String corpo : corpos) {
            var fixture = brasil();

            fixture.server()
                    .expect(requestTo(URL_CNPJ))
                    .andRespond(
                            withSuccess(
                                    corpo,
                                    MediaType.APPLICATION_JSON
                            )
                    );

            var erro = assertThrows(
                    IntegracaoExternaException.class,
                    () -> fixture.client().consultarCnpj(CNPJ)
            );

            assertEquals(HttpStatus.BAD_GATEWAY, erro.getStatus());

            fixture.server().verify();
        }
    }

    @Test
    void brasilApi400E404MantemErrosDeDominio() {
        var invalido = brasil();

        invalido.server()
                .expect(requestTo(URL_CNPJ))
                .andRespond(withStatus(HttpStatus.BAD_REQUEST));

        assertThrows(
                RegraNegocioException.class,
                () -> invalido.client().consultarCnpj(CNPJ)
        );

        invalido.server().verify();

        var inexistente = brasil();

        inexistente.server()
                .expect(requestTo(URL_CNPJ))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThrows(
                RecursoNaoEncontradoException.class,
                () -> inexistente.client().consultarCnpj(CNPJ)
        );

        inexistente.server().verify();
    }

    @Test
    void demaisStatusNaoSaoTratadosComoRespostaValida() {
        HttpStatus[] statusSimulados = {
                HttpStatus.FOUND,
                HttpStatus.FORBIDDEN,
                HttpStatus.INTERNAL_SERVER_ERROR,
                HttpStatus.TOO_MANY_REQUESTS,
                HttpStatus.SERVICE_UNAVAILABLE
        };

        for (HttpStatus status : statusSimulados) {
            var fixture = brasil();

            fixture.server()
                    .expect(requestTo(URL_CNPJ))
                    .andRespond(withStatus(status));

            var erro = assertThrows(
                    IntegracaoExternaException.class,
                    () -> fixture.client().consultarCnpj(CNPJ)
            );

            HttpStatus esperado =
                    status == HttpStatus.TOO_MANY_REQUESTS
                            || status == HttpStatus.SERVICE_UNAVAILABLE
                            ? HttpStatus.SERVICE_UNAVAILABLE
                            : HttpStatus.BAD_GATEWAY;

            assertEquals(esperado, erro.getStatus());

            fixture.server().verify();
        }
    }

    @Test
    void timeoutVira504ESemConexaoVira503() {
        IOException[] causas = {
                new SocketTimeoutException("Falha simulada"),
                new IOException("Falha simulada")
        };

        for (IOException causa : causas) {
            var fixture = brasil();

            fixture.server()
                    .expect(requestTo(URL_CNPJ))
                    .andRespond(request -> {
                        throw causa;
                    });

            var erro = assertThrows(
                    IntegracaoExternaException.class,
                    () -> fixture.client().consultarCnpj(CNPJ)
            );

            HttpStatus esperado =
                    causa instanceof SocketTimeoutException
                            ? HttpStatus.GATEWAY_TIMEOUT
                            : HttpStatus.SERVICE_UNAVAILABLE;

            assertEquals(esperado, erro.getStatus());

            fixture.server().verify();
        }
    }

    @Test
    void cepComHifenUsaEndpointCorretoERetornaEndereco() {
        var fixture = cep();

        fixture.server()
                .expect(requestTo(URL_CEP))
                .andRespond(
                        withSuccess(
                                """
                                {
                                  "cep": "01001-000",
                                  "localidade": "São Paulo",
                                  "uf": "SP"
                                }
                                """,
                                MediaType.APPLICATION_JSON
                        )
                );

        var resposta = fixture.client()
                .consultarCep(" 01001-000 ");

        assertEquals("São Paulo", resposta.localidade());
        assertEquals("SP", resposta.uf());
        assertNull(resposta.erro());

        fixture.server().verify();
    }

    @Test
    void cepNaoEncontradoFuncionaComBooleanOuTextoTrue() {
        String[] corpos = {
                "{\"erro\":true}",
                "{\"erro\":\"true\"}"
        };

        for (String corpo : corpos) {
            var fixture = cep();

            fixture.server()
                    .expect(
                            requestTo(
                                    "https://viacep.com.br/ws/99999999/json/"
                            )
                    )
                    .andRespond(
                            withSuccess(
                                    corpo,
                                    MediaType.APPLICATION_JSON
                            )
                    );

            assertThrows(
                    RecursoNaoEncontradoException.class,
                    () -> fixture.client().consultarCep("99999999")
            );

            fixture.server().verify();
        }
    }

    @Test
    void formatoCepInvalidoNaoFazRequisicao() {
        var fixture = cep();

        String[] valores = {
                null,
                "",
                "123",
                "01001A00",
                "01001 000",
                "https://localhost/"
        };

        for (String valor : valores) {
            assertThrows(
                    RegraNegocioException.class,
                    () -> fixture.client().consultarCep(valor)
            );
        }

        fixture.server().verify();
    }

    @Test
    void respostaCepVaziaMalformadaOuDivergenteVira502() {
        String[] corpos = {
                "",
                "{",
                "{}",
                "{\"cep\":\"99999-999\"}"
        };

        for (String corpo : corpos) {
            var fixture = cep();

            fixture.server()
                    .expect(requestTo(URL_CEP))
                    .andRespond(
                            withSuccess(
                                    corpo,
                                    MediaType.APPLICATION_JSON
                            )
                    );

            var erro = assertThrows(
                    IntegracaoExternaException.class,
                    () -> fixture.client().consultarCep(CEP)
            );

            assertEquals(HttpStatus.BAD_GATEWAY, erro.getStatus());

            fixture.server().verify();
        }
    }

    @Test
    void viaCepTambemTrataHttp404E503() {
        var inexistente = cep();

        inexistente.server()
                .expect(requestTo(URL_CEP))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThrows(
                RecursoNaoEncontradoException.class,
                () -> inexistente.client().consultarCep(CEP)
        );

        inexistente.server().verify();

        var indisponivel = cep();

        indisponivel.server()
                .expect(requestTo(URL_CEP))
                .andRespond(
                        withStatus(HttpStatus.SERVICE_UNAVAILABLE)
                );

        var erro = assertThrows(
                IntegracaoExternaException.class,
                () -> indisponivel.client().consultarCep(CEP)
        );

        assertEquals(
                HttpStatus.SERVICE_UNAVAILABLE,
                erro.getStatus()
        );

        indisponivel.server().verify();
    }
}