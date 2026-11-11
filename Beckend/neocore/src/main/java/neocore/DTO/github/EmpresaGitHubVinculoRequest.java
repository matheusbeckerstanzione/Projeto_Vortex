package neocore.DTO.github;

import jakarta.validation.constraints.*;

public record EmpresaGitHubVinculoRequest(

        @NotBlank
        @Size(max = 39)
        String organizacao,

        @NotBlank
        @Size(max = 2048)
        String referenciaVinculo,

        @NotBlank
        @Size(min = 20, max = 500)
        String justificativaVinculo,

        @NotNull
        @AssertTrue(
                message = "Confirme a associação com a empresa."
        )
        Boolean confirmado,

        @PositiveOrZero
        Long versaoEsperada

) {
}