package neocore.Service;

import neocore.Client.GitHubClient;
import neocore.DTO.sinais.SinaisGitHubResponse;
import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RegraNegocioException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.stream.Collectors;

@Service
public class SinaisGitHubService {

    private static final Duration TTL = Duration.ofMinutes(5);

    private static final int MAX_CACHE = 128;

    private final GitHubClient client;
    private final Clock clock;

    private final Semaphore consultas = new Semaphore(2);

    private final Map<String, Entrada> cache =
            new LinkedHashMap<>();

    private record Entrada(
            SinaisGitHubResponse dados,
            Instant expira
    ) {
    }

    @Autowired
    public SinaisGitHubService(GitHubClient client) {
        this(client, Clock.systemUTC());
    }

    SinaisGitHubService(
            GitHubClient client,
            Clock clock
    ) {
        this.client = client;
        this.clock = clock;
    }

    public SinaisGitHubResponse consultar(
            String organizacao,
            int pagina
    ) {
        String login = organizacao == null
                ? ""
                : organizacao.strip().toLowerCase(Locale.ROOT);

        if (!login.matches(
                "[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?"
        ) || login.contains("--")) {

            throw new RegraNegocioException(
                    "Informe o login da organização, sem URL ou @."
            );
        }

        if (pagina < 1 || pagina > 50) {
            throw new RegraNegocioException(
                    "Informe uma página entre 1 e 50."
            );
        }

        String chave = login + ":" + pagina;

        synchronized (cache) {
            cache.values().removeIf(
                    entrada -> !entrada.expira()
                            .isAfter(clock.instant())
            );

            var entrada = cache.get(chave);

            if (entrada != null) {
                return entrada.dados();
            }
        }

        if (!consultas.tryAcquire()) {
            throw new IntegracaoExternaException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Há consultas ao GitHub em andamento. "
                            + "Tente novamente em instantes."
            );
        }

        try {
            var org = client.organizacao(login);

            var repos = client.repositorios(org, pagina);

            var linguagens = repos.stream()
                    .filter(
                            repo -> !repo.fork()
                                    && !repo.archived()
                    )
                    .filter(
                            repo -> repo.language() != null
                                    && !repo.language().isBlank()
                    )
                    .collect(
                            Collectors.groupingBy(
                                    repo -> repo.language(),
                                    Collectors.counting()
                            )
                    )
                    .entrySet()
                    .stream()
                    .map(
                            entrada -> new SinaisGitHubResponse.Linguagem(
                                    entrada.getKey(),
                                    entrada.getValue()
                            )
                    )
                    .sorted(
                            Comparator.comparingLong(
                                            SinaisGitHubResponse.Linguagem
                                                    ::quantidadeRepositorios
                                    )
                                    .reversed()
                                    .thenComparing(
                                            SinaisGitHubResponse.Linguagem
                                                    ::nome
                                    )
                    )
                    .toList();

            var repositorios = repos.stream()
                    .map(
                            repo -> new SinaisGitHubResponse.Repositorio(
                                    repo.id(),
                                    repo.name(),
                                    "https://github.com/"
                                            + org.login()
                                            + "/"
                                            + repo.name(),
                                    repo.language(),
                                    repo.fork(),
                                    repo.archived(),
                                    repo.pushedAt()
                            )
                    )
                    .toList();

            var resposta = new SinaisGitHubResponse(
                    org.id(),
                    org.login(),
                    org.name(),
                    "https://github.com/" + org.login(),
                    org.publicRepos(),
                    pagina,
                    20,
                    repositorios,
                    linguagens,
                    clock.instant(),
                    "Linguagens principais dos repositórios desta página, "
                            + "excluindo forks e arquivados. "
                            + "Projetos públicos não comprovam uso interno, "
                            + "intenção de compra ou vínculo desta organização "
                            + "com uma empresa cadastrada."
            );

            synchronized (cache) {
                cache.values().removeIf(
                        entrada -> !entrada.expira()
                                .isAfter(clock.instant())
                );

                if (cache.size() >= MAX_CACHE) {
                    cache.remove(
                            cache.keySet().iterator().next()
                    );
                }

                cache.put(
                        chave,
                        new Entrada(
                                resposta,
                                clock.instant().plus(TTL)
                        )
                );
            }

            return resposta;

        } finally {
            consultas.release();
        }
    }
}