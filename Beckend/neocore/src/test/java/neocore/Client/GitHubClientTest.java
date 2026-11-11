package neocore.Client;

import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RecursoNaoEncontradoException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import java.net.SocketTimeoutException;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class GitHubClientTest {
    private record Fixture(GitHubClient client, MockRestServiceServer server) {}

    private Fixture fixture() {
        var builder = RestClient.builder().baseUrl("https://api.github.com");
        var server = MockRestServiceServer.bindTo(builder).build();
        return new Fixture(new GitHubClient(builder.build()), server);
    }

    private void organizar(Fixture f) {
        f.server().expect(requestTo("https://api.github.com/orgs/acme"))
                .andRespond(withSuccess("""
                        {"id":1,"login":"acme","name":"Acme","type":"Organization",
                         "public_repos":30,"campo_ignorado":true}
                        """, MediaType.APPLICATION_JSON));
    }

    @Test void consultaOrganizacaoEPaginaPublica() {
        var f = fixture();
        organizar(f);
        f.server().expect(requestTo("https://api.github.com/orgs/acme/repos?type=public&sort=pushed&direction=desc&per_page=20&page=2"))
                .andRespond(withSuccess("""
                        [{"id":10,"name":"projeto","language":"Java","fork":false,
                        "archived":false,"private":false,"pushed_at":"2026-01-01T12:00:00Z",
                        "owner":{"id":1,"login":"acme"}}]
                        """, MediaType.APPLICATION_JSON));
        var org = f.client().organizacao("acme");
        var repos = f.client().repositorios(org, 2);
        assertEquals("Java", repos.get(0).language());
        assertNotNull(repos.get(0).pushedAt());
        f.server().verify();
    }

    @Test void perfilPessoalNaoViraOrganizacao() {
        var f = fixture();
        f.server().expect(requestTo("https://api.github.com/orgs/acme"))
                .andRespond(withSuccess("""
                        {"id":1,"login":"acme","type":"User","public_repos":1}
                        """, MediaType.APPLICATION_JSON));
        assertEquals(HttpStatus.BAD_GATEWAY,
                assertThrows(IntegracaoExternaException.class,
                        () -> f.client().organizacao("acme")).getStatus());
        f.server().verify();
    }

    @Test void naoEncontradoRetornaExcecaoDoProjeto() {
        var f = fixture();
        f.server().expect(requestTo("https://api.github.com/orgs/acme"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));
        assertThrows(RecursoNaoEncontradoException.class,
                () -> f.client().organizacao("acme"));
        f.server().verify();
    }

    @Test void cotaNaoDisparaTentativasAutomaticas() {
        var f = fixture();
        f.server().expect(requestTo("https://api.github.com/orgs/acme"))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(IntegracaoExternaException.class,
                        () -> f.client().organizacao("acme")).getStatus());
        f.server().verify();
    }

    @Test void timeoutRetorna504() {
        var f = fixture();
        f.server().expect(requestTo("https://api.github.com/orgs/acme"))
                .andRespond(withException(new SocketTimeoutException()));
        assertEquals(HttpStatus.GATEWAY_TIMEOUT,
                assertThrows(IntegracaoExternaException.class,
                        () -> f.client().organizacao("acme")).getStatus());
        f.server().verify();
    }

    @Test void respostaPrivadaNaoEExposta() {
        var f = fixture();
        organizar(f);
        f.server().expect(requestTo("https://api.github.com/orgs/acme/repos?type=public&sort=pushed&direction=desc&per_page=20&page=1"))
                .andRespond(withSuccess("""
                        [{"id":10,"name":"privado","fork":false,"archived":false,
                        "private":true,"owner":{"id":1,"login":"acme"}}]
                        """, MediaType.APPLICATION_JSON));
        var org = f.client().organizacao("acme");
        assertThrows(IntegracaoExternaException.class,
                () -> f.client().repositorios(org, 1));
        f.server().verify();
    }
}
