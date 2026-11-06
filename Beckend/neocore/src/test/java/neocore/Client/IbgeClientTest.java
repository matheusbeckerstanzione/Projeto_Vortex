package neocore.Client;

import neocore.DTO.integracao.MunicipioIbgeResponse;
import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RegraNegocioException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class IbgeClientTest {

    private static final String URL_DF =
            "https://servicodados.ibge.gov.br/api/v1/localidades/estados/53/municipios?orderBy=nome";

    private MockRestServiceServer server;
    private IbgeClient client;

    @BeforeEach
    void configurarClient() {
        var builder = RestClient.builder()
                .baseUrl("https://servicodados.ibge.gov.br");

        server = MockRestServiceServer.bindTo(builder).build();
        client = new IbgeClient(builder.build());
    }

    @Test
    void converteSiglaEDevolveCodigoComoTexto() {
        server.expect(requestTo(URL_DF))
                .andRespond(withSuccess("""
                        [{"id":5300108,"nome":"Brasília","microrregiao":{}}]
                        """, MediaType.APPLICATION_JSON));

        assertEquals(
                List.of(new MunicipioIbgeResponse("5300108", "Brasília")),
                client.listarMunicipios("df")
        );

        server.verify();
    }

    @Test
    void rejeitaUfInvalidaAntesDeConsultarIbge() {
        assertThrows(
                RegraNegocioException.class,
                () -> client.listarMunicipios("ZZ")
        );
    }

    @Test
    void rejeitaMunicipioSemCodigo() {
        server.expect(requestTo(URL_DF))
                .andRespond(withSuccess("""
                        [{"nome":"Brasília"}]
                        """, MediaType.APPLICATION_JSON));

        var erro = assertThrows(
                IntegracaoExternaException.class,
                () -> client.listarMunicipios("DF")
        );

        assertEquals(HttpStatus.BAD_GATEWAY, erro.getStatus());
        server.verify();
    }

    @Test
    void preservaStatusDeIndisponibilidade() {
        server.expect(requestTo(URL_DF))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        var erro = assertThrows(
                IntegracaoExternaException.class,
                () -> client.listarMunicipios("DF")
        );

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, erro.getStatus());
        server.verify();
    }
}