package neocore.DTO.conviteacesso;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtivacaoContaRequest(@NotBlank
                                   String token,

                                   @NotBlank
                                   @Size(min = 8, max = 72)
                                   String senha) {
}
