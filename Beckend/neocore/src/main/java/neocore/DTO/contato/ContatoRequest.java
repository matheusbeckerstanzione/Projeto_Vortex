package neocore.DTO.contato;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import neocore.Model.Enum.StatusIdentidade;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ContatoRequest(@NotNull
                             UUID empresaId,

                             @NotBlank
                              @Size(max = 120)
                              String nomeExibicao,

                             @NotNull
                             StatusIdentidade statusIdentidade,

                             @NotNull
                              @Future
                             OffsetDateTime revisarAte) {
}
