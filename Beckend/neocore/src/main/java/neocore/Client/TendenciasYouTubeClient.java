package neocore.Client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import neocore.DTO.integracao.YouTubeVideoResponse;
import neocore.Exception.IntegracaoExternaException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

import java.time.OffsetDateTime;
import java.util.List;

@Component
public class TendenciasYouTubeClient {

    private final RestClient client;
    private final String apiKey;

    public TendenciasYouTubeClient(

            @Lazy
            @Qualifier("youTubeRestClient")
            RestClient client,

            @Value("${YOUTUBE_API_KEY:}")
            String apiKey

    ) {
        this.client = client;
        this.apiKey = apiKey.strip();
    }

    public List<YouTubeVideoResponse> buscar(

            String tema,

            String regiao,

            OffsetDateTime inicio,

            OffsetDateTime fim

    ) {
        if (apiKey.isBlank()) {
            throw new IntegracaoExternaException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Configure YOUTUBE_API_KEY ou forneça "
                            + "referências públicas recentes."
            );
        }

        try {
            Busca resposta = client.get()
                    .uri(uri -> {
                        var builder = uri
                                .path("/youtube/v3/search")
                                .queryParam("part", "snippet")
                                .queryParam("type", "video")
                                .queryParam("maxResults", 10)
                                .queryParam("order", "date")
                                .queryParam(
                                        "publishedAfter",
                                        inicio.toInstant().toString()
                                )
                                .queryParam(
                                        "publishedBefore",
                                        fim.toInstant().toString()
                                )
                                .queryParam(
                                        "fields",
                                        "items(id(videoId),snippet(title,publishedAt))"
                                )
                                .queryParam(
                                        "q",
                                        "{tema}"
                                );

                        if (!"GLOBAL".equals(regiao)) {
                            builder.queryParam(
                                    "regionCode",
                                    regiao
                            );
                        }

                        return builder.build(tema);
                    })
                    .header(
                            "x-goog-api-key",
                            apiKey
                    )
                    .retrieve()
                    .onStatus(
                            status -> !status.is2xxSuccessful(),
                            (request, response) -> {
                                throw new IntegracaoExternaException(
                                        HttpStatus.SERVICE_UNAVAILABLE,
                                        "Busca recente do YouTube "
                                                + "indisponível ou cota atingida."
                                );
                            }
                    )
                    .body(Busca.class);

            if (resposta == null
                    || resposta.items() == null) {

                throw IntegracaoHttpSupport
                        .respostaInvalida("YouTube");
            }

            return resposta.items()
                    .stream()
                    .map(item -> {
                        if (item == null
                                || item.id() == null
                                || item.snippet() == null
                                || item.id().videoId() == null
                                || !item.id().videoId()
                                .matches("[A-Za-z0-9_-]{11}")
                                || item.snippet().title() == null
                                || item.snippet().title().isBlank()
                                || item.snippet().publishedAt() == null) {

                            throw IntegracaoHttpSupport
                                    .respostaInvalida("YouTube");
                        }

                        return new YouTubeVideoResponse(
                                item.snippet().title(),

                                "https://www.youtube.com/watch?v="
                                        + item.id().videoId(),

                                item.snippet().publishedAt()
                        );
                    })
                    .filter(video ->
                            !video.publicadoEm().isBefore(inicio)
                                    && !video.publicadoEm().isAfter(fim)
                    )
                    .limit(10)
                    .toList();

        } catch (ResourceAccessException exception) {
            throw new IntegracaoExternaException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível conectar à busca "
                            + "recente do YouTube."
            );

        } catch (RestClientException exception) {
            throw IntegracaoHttpSupport
                    .respostaInvalida("YouTube");
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Busca(List<Item> items) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Item(Id id, Snippet snippet) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Id(String videoId) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Snippet(
            String title,
            OffsetDateTime publishedAt
    ) {
    }
}