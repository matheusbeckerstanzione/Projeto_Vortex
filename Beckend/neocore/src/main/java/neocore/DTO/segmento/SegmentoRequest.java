package neocore.DTO.segmento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import neocore.Model.Enum.StatusSegmento;

import java.util.Map;
import java.util.UUID;

public record SegmentoRequest(@NotBlank
                               @Size(max = 120)
                               String nome,

                              String descricao,

                              @NotEmpty
                              Map<String, Object> criterios,

                              @NotNull
                              UUID finalidadeId,

                              @NotNull
                              StatusSegmento status) {
}
