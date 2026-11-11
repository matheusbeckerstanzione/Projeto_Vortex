package neocore.Service;

import neocore.Client.GitHubClient;
import neocore.Controller.SinaisGitHubController;
import neocore.DTO.integracao.GitHubOrganizacaoResponse;
import neocore.DTO.integracao.GitHubRepositorioResponse;
import neocore.Exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import java.time.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.standaloneSetup;

class SinaisGitHubServiceTest {
    private static class Relogio extends Clock {
        Instant agora = Instant.parse("2026-01-01T12:00:00Z");
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return agora; }
    }

    private static class ClientFake extends GitHubClient {
        int chamadas;
        ClientFake() { super(RestClient.builder().build()); }
        @Override public GitHubOrganizacaoResponse organizacao(String login) {
            chamadas++;
            return new GitHubOrganizacaoResponse(1L, login, "Acme", "Organization", 30);
        }
        @Override public List<GitHubRepositorioResponse> repositorios(
                GitHubOrganizacaoResponse org, int pagina
        ) {
            return List.of(repo(10, "Java", false, false),
                    repo(11, "Java", true, false), repo(12, "Python", false, true));
        }
        private GitHubRepositorioResponse repo(long id, String linguagem,
                                               boolean fork, boolean arquivado) {
            return new GitHubRepositorioResponse(id, "projeto-" + id, linguagem,
                    fork, arquivado, false, null,
                    new GitHubRepositorioResponse.Dono(1L, "acme"));
        }
    }

    @Test void cacheNormalizaLoginSeparaPaginasEExpira() {
        var client = new ClientFake();
        var relogio = new Relogio();
        var service = new SinaisGitHubService(client, relogio);
        var primeira = service.consultar(" ACME ", 1);
        assertSame(primeira, service.consultar("acme", 1));
        assertEquals(1, client.chamadas);
        service.consultar("acme", 2);
        assertEquals(2, client.chamadas);
        relogio.agora = relogio.agora.plusSeconds(301);
        service.consultar("acme", 1);
        assertEquals(3, client.chamadas);
    }

    @Test void linguagensExcluemForksEArquivadosSemSomarTodaOrganizacao() {
        var r = new SinaisGitHubService(new ClientFake()).consultar("acme", 1);
        assertEquals(30, r.totalRepositoriosPublicos());
        assertEquals(3, r.repositorios().size());
        assertEquals(1, r.linguagensDosProjetosAtivosDaPagina().size());
        assertEquals("Java", r.linguagensDosProjetosAtivosDaPagina().get(0).nome());
        assertEquals(1, r.linguagensDosProjetosAtivosDaPagina().get(0).quantidadeRepositorios());
    }

    @Test void entradaInvalidaNaoChamaFornecedor() {
        var client = new ClientFake();
        var service = new SinaisGitHubService(client);
        for (String login : List.of("", "https://github.com/acme", "@acme", "a--b", "-acme")) {
            assertThrows(RegraNegocioException.class, () -> service.consultar(login, 1));
        }
        assertThrows(RegraNegocioException.class, () -> service.consultar("acme", 0));
        assertThrows(RegraNegocioException.class, () -> service.consultar("acme", 51));
        assertEquals(0, client.chamadas);
    }

    @Test void controllerEncaminhaPaginaEDevolveJson() throws Exception {
        // Testa contrato HTTP; a autorização continua na SegurancaConfig real.
        var mvc = standaloneSetup(new SinaisGitHubController(
                new SinaisGitHubService(new ClientFake())
        )).build();
        mvc.perform(get("/sinais/github/organizacoes/acme").param("pagina", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizacao").value("acme"))
                .andExpect(jsonPath("$.pagina").value(2))
                .andExpect(jsonPath("$.repositorios[0].url")
                        .value("https://github.com/acme/projeto-10"));
    }
}
