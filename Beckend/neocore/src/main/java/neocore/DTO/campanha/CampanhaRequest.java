package neocore.DTO.campanha;

import jakarta.validation.constraints.*;
import neocore.Model.Enum.CanalCampanha;
import neocore.Model.Enum.StatusCampanha;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record CampanhaRequest(@NotNull
                              UUID segmentoId,

                              @NotNull
                              UUID finalidadeId,

                              @NotBlank
                              @Size(max = 160)
                              String nome,

                              @NotBlank
                              String objetivo,

                              @NotNull
                              CanalCampanha canal,

                              @NotNull
                              StatusCampanha status,

                              @NotEmpty
                              Map<String, Object> criteriosPublicoSnapshot,

                              @DecimalMin("0.00")
                              BigDecimal orcamento,

                              OffsetDateTime inicioEm,
                              OffsetDateTime fimEm) {
}
