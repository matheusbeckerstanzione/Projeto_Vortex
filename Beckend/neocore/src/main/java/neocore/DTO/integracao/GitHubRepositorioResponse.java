package neocore.DTO.integracao;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.OffsetDateTime;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubRepositorioResponse(
        Long id,
        String name,
        String language,
        Boolean fork,
        Boolean archived,

        @JsonProperty("private")
        Boolean privado,

        @JsonProperty("pushed_at")
        OffsetDateTime pushedAt,

        Dono owner
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Dono(
            Long id,
            String login
    ) {
    }
}