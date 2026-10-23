package neocore.DTO.solicitacaoacesso;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SolicitacaoAcessoRequest(@NotBlank
                                        @Size(max = 120)
                                        String nome,

                                       @NotBlank
                                        @Email
                                        @Size(max = 254)
                                        String email,

                                       @NotBlank
                                        @Size(max = 500)
                                        String justificativa) {
}
