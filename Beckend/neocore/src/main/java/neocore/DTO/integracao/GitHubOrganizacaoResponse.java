package neocore.DTO.integracao;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GitHubOrganizacaoResponse(
        Long id,
        String login,
        String name,
        String type,

        @JsonProperty("public_repos")
        Integer publicRepos
) {
}