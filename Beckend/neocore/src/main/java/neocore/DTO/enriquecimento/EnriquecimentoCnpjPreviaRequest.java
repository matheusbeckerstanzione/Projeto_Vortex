package neocore.DTO.enriquecimento;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record EnriquecimentoCnpjPreviaRequest(

        @NotBlank
        @Pattern(
                regexp = "[0-9]{14}|[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}/[0-9]{4}-[0-9]{2}"
        )
        String cnpj,

        @NotNull
        @Valid
        EnriquecimentoPreviaRequest parametros

) {
}