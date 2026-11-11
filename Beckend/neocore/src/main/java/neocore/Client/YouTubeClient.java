package neocore.Client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import neocore.DTO.integracao.YouTubeVideoResponse;
import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RegraNegocioException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class YouTubeClient {

    private final RestClient client;
    private final String apiKey;

    public YouTubeClient(
            @Lazy @Qualifier("youTubeRestClient") RestClient client,
            @Value("${YOUTUBE_API_KEY:}") String apiKey
    ) {
        this.client = client;
        this.apiKey = apiKey.strip();
    }

    public List<YouTubeVideoResponse> buscarVideos(String tema) {
        String termo = tema.strip();

        if (termo.isEmpty() || termo.length() > 100) {
            throw new RegraNegocioException(
                    "Informe um tema com 1 a 100 caracteres."
            );
        }

        if (apiKey.isEmpty()) {
            throw new IntegracaoExternaException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "A busca do YouTube ainda não foi configurada."
            );
        }

        BuscaResponse resposta;

        try {
            resposta = client.get()
                    .uri(
                            "/youtube/v3/search?part=snippet&type=video"
                                    + "&maxResults=10&regionCode=BR"
                                    + "&relevanceLanguage=pt"
                                    + "&fields={campos}&q={tema}",
                            "items(id(videoId),snippet(title,publishedAt))",
                            termo
                    )
                    .header("x-goog-api-key", apiKey)
                    .retrieve()
                    .onStatus(
                            status -> !status.is2xxSuccessful(),
                            (request, response) -> {
                                int codigo = response.getStatusCode().value();

                                if (codigo == 429 || codigo == 503) {
                                    throw new IntegracaoExternaException(
                                            HttpStatus.SERVICE_UNAVAILABLE,
                                            "Busca do YouTube temporariamente indisponível."
                                    );
                                }

                                if (codigo == 403) {
                                    throw new IntegracaoExternaException(
                                            HttpStatus.BAD_GATEWAY,
                                            "O YouTube recusou a busca. Confira a chave, "
                                                    + "as permissões e a cota no Google Cloud."
                                    );
                                }

                                throw IntegracaoHttpSupport.respostaInvalida("YouTube");
                            }
                    )
                    .body(BuscaResponse.class);
        } catch (ResourceAccessException exception) {
            throw new IntegracaoExternaException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível concluir a conexão com o YouTube."
            );
        } catch (RestClientException exception) {
            throw IntegracaoHttpSupport.respostaInvalida("YouTube");
        }

        if (resposta == null || resposta.items() == null) {
            throw IntegracaoHttpSupport.respostaInvalida("YouTube");
        }

        List<YouTubeVideoResponse> videos = new ArrayList<>();

        for (VideoItem item : resposta.items()) {
            if (item == null || item.id() == null || item.snippet() == null) {
                throw IntegracaoHttpSupport.respostaInvalida("YouTube");
            }

            String videoId = item.id().videoId();
            VideoSnippet snippet = item.snippet();

            if (videoId == null || !videoId.matches("[A-Za-z0-9_-]{11}")
                    || snippet.title() == null || snippet.title().isBlank()
                    || snippet.publishedAt() == null) {
                throw IntegracaoHttpSupport.respostaInvalida("YouTube");
            }

            videos.add(new YouTubeVideoResponse(
                    snippet.title(),
                    "https://www.youtube.com/watch?v=" + videoId,
                    snippet.publishedAt()
            ));
        }

        return List.copyOf(videos);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record BuscaResponse(List<VideoItem> items) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record VideoItem(VideoId id, VideoSnippet snippet) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record VideoId(String videoId) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record VideoSnippet(String title, OffsetDateTime publishedAt) {
    }
}