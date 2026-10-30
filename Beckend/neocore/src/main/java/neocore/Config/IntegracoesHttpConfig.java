package neocore.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class IntegracoesHttpConfig {

    @Bean("brasilApiRestClient")
    @Lazy
    public RestClient brasilApiRestClient() {
        return criar("https://brasilapi.com.br");
    }

    @Bean("viaCepRestClient")
    @Lazy
    public RestClient viaCepRestClient() {
        return criar("https://viacep.com.br");
    }

    private RestClient criar(String baseUrl) {
        var http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();

        var factory = new JdkClientHttpRequestFactory(http);

        factory.setReadTimeout(Duration.ofSeconds(8));

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader(
                        HttpHeaders.ACCEPT,
                        MediaType.APPLICATION_JSON_VALUE
                )
                .build();
    }
}