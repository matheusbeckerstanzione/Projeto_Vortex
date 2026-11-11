package neocore.DTO.github;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record EmpresaGitHubColetaRequest(

        @NotNull
        @PositiveOrZero
        Long versaoEsperada

) {
}