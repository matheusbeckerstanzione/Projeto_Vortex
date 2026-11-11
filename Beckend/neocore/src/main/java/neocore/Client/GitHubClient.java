package neocore.Client;

import neocore.DTO.integracao.GitHubOrganizacaoResponse;
import neocore.DTO.integracao.GitHubRepositorioResponse;
import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RecursoNaoEncontradoException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.List;

@Component
public class GitHubClient {
    private static final Logger LOG =
            LoggerFactory.getLogger(GitHubClient.class);

    private final RestClient client;

    public GitHubClient(
            @Lazy
            @Qualifier("gitHubRestClient")
            RestClient client
    ) {
        this.client = client;
    }

    public GitHubOrganizacaoResponse organizacao(String login) {
        var org = buscar(
                "/orgs/{login}",
                GitHubOrganizacaoResponse.class,
                login
        );

        if (org.id() == null
                || org.id() <= 0
                || org.login() == null
                || !org.login().matches("[A-Za-z0-9-]{1,39}")
                || !"Organization".equals(org.type())
                || org.publicRepos() == null
                || org.publicRepos() < 0) {

            throw invalida();
        }

        return org;
    }

    public List<GitHubRepositorioResponse> repositorios(
            GitHubOrganizacaoResponse org,
            int pagina
    ) {
        var repos = buscar(
                "/orgs/{login}/repos"
                        + "?type=public"
                        + "&sort=pushed"
                        + "&direction=desc"
                        + "&per_page=20"
                        + "&page={pagina}",
                GitHubRepositorioResponse[].class,
                org.login(),
                pagina
        );

        if (repos.length > 20) {
            throw invalida();
        }

        for (var repo : repos) {
            if (repo == null
                    || repo.id() == null
                    || repo.id() <= 0
                    || repo.name() == null
                    || !repo.name().matches("[A-Za-z0-9_.-]{1,100}")
                    || repo.name().equals(".")
                    || repo.name().equals("..")
                    || !Boolean.FALSE.equals(repo.privado())
                    || repo.fork() == null
                    || repo.archived() == null
                    || repo.owner() == null
                    || !org.id().equals(repo.owner().id())
                    || !org.login().equalsIgnoreCase(
                    repo.owner().login()
            )) {

                throw invalida();
            }
        }

        return List.of(repos);
    }

    private <T> T buscar(
            String caminho,
            Class<T> tipo,
            Object... parametros
    ) {
        try {
            T resposta = client.get()
                    .uri(caminho, parametros)
                    .retrieve()
                    .onStatus(
                            status -> !status.is2xxSuccessful(),
                            (request, response) -> {
                                int status =
                                        response.getStatusCode().value();

                                LOG.warn(
                                        "Resposta GitHub: status={}, restantes={}, reset={}, retryAfter={}",
                                        status,
                                        response.getHeaders().getFirst("X-RateLimit-Remaining"),
                                        response.getHeaders().getFirst("X-RateLimit-Reset"),
                                        response.getHeaders().getFirst("Retry-After")
                                );

                                if (status == 404) {
                                    throw new RecursoNaoEncontradoException(
                                            "Organização pública não encontrada no GitHub."
                                    );
                                }

                                if (status == 403
                                        || status == 429
                                        || status >= 500) {

                                    throw new IntegracaoExternaException(
                                            HttpStatus.SERVICE_UNAVAILABLE,
                                            "GitHub indisponível, acesso recusado "
                                                    + "ou limite atingido. "
                                                    + "Tente mais tarde."
                                    );
                                }

                                throw invalida();
                            }
                    )
                    .body(tipo);

            if (resposta == null) {
                throw invalida();
            }

            return resposta;

        } catch (ResourceAccessException exception) {
            boolean timeout = false;
            StringBuilder tipos = new StringBuilder();

            for (
                    Throwable causa = exception;
                    causa != null;
                    causa = causa.getCause()
            ) {
                if (tipos.length() > 0) {
                    tipos.append(" -> ");
                }

                tipos.append(
                        causa.getClass().getSimpleName()
                );

                if (causa instanceof SocketTimeoutException
                        || causa instanceof HttpTimeoutException) {
                    timeout = true;
                }
            }

            LOG.warn(
                    "Falha de transporte ao acessar api.github.com; causas={}",
                    tipos
            );

            throw new IntegracaoExternaException(
                    timeout
                            ? HttpStatus.GATEWAY_TIMEOUT
                            : HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível concluir a conexão com o GitHub."
            );

        } catch (RestClientException exception) {
            throw invalida();
        }
    }

    private IntegracaoExternaException invalida() {
        return new IntegracaoExternaException(
                HttpStatus.BAD_GATEWAY,
                "Resposta inválida ou inesperada do GitHub."
        );
    }
}