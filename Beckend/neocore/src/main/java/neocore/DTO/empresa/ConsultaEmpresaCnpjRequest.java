package neocore.DTO.empresa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ConsultaEmpresaCnpjRequest(

        @NotBlank
        @Pattern(
                regexp = "[0-9]{14}|[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}/[0-9]{4}-[0-9]{2}",
                message = "Informe um CNPJ numérico de 14 dígitos, com ou sem máscara."
        )
        String cnpj

) {
}