package neocore.DTO.tarefacoleta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TarefaColetaRequest(@NotNull
                                  UUID pesquisaId,

                                  @NotNull
                                  UUID fonteId,

                                  @NotBlank
                                  String urlPagina,

                                  @NotBlank
                                  @Size(max = 160)
                                  String chaveIdempotencia,

                                  @NotNull
                                  OffsetDateTime disponivelEm) {
}
