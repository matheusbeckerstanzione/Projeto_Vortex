package neocore.DTO.empresa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmpresaRequest(@NotBlank
                             @Size(max = 160)
                             String nome,

                             @NotBlank
                             @Size(max = 100)
                             String slug,

                             @NotBlank
                             @Pattern(
                                     regexp = "\\d{14}",
                                     message = "O CNPJ deve possuir 14 números"
                             )
                             String cnpj,

                             @NotBlank
                             @Size(max = 80)
                             String setor,

                             @NotBlank
                             @Size(max = 100)
                             String cidade,

                             @NotBlank
                             @Pattern(
                                     regexp = "^[A-Za-z]{2}$",
                                     message = "A UF deve possuir duas letras"
                             )
                             String uf,

                             String descricao,
                             String urlSite) {
}
