package neocore.DTO.segmentocontato;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SegmentoContatoRequest(@NotNull
                                     UUID segmentoId,

                                     @NotNull
                                     UUID contatoId,

                                     @NotBlank
                                     String motivoInclusao) {
}
