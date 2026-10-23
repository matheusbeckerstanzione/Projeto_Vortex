package neocore.DTO.autenticacao;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MfaRequest( @NotBlank
                          String tokenTemporario,

                          @NotBlank
                          @Pattern(
                                  regexp = "\\d{6}",
                                  message = "O código MFA deve possuir 6 números"
                          )
                          String codigo
) {
}
