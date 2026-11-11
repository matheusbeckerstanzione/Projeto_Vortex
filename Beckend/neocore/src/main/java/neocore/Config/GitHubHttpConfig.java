package neocore.Config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class GitHubHttpConfig {

    @Bean("gitHubRestClient")
    @Lazy
    public RestClient gitHubRestClient(
            @Value("${GITHUB_API_TOKEN:}") String token
    ) {
        var http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();

        var factory = new JdkClientHttpRequestFactory(http);

        factory.setReadTimeout(Duration.ofSeconds(20));

        var builder = RestClient.builder()
                .baseUrl("https://api.github.com")
                .requestFactory(factory)
                .defaultHeader(
                        HttpHeaders.ACCEPT,
                        "application/vnd.github+json"
                )
                .defaultHeader(
                        HttpHeaders.USER_AGENT,
                        "NeoCore"
                )
                .defaultHeader(
                        "X-GitHub-Api-Version",
                        "2026-03-10"
                );

        if (!token.isBlank()) {
            builder.defaultHeader(
                    HttpHeaders.AUTHORIZATION,
                    "Bearer " + token.strip()
            );
        }

        return builder.build();
    }
}