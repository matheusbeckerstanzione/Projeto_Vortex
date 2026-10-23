package neocore.DTO.campanha;

import neocore.Model.Enum.CanalCampanha;
import neocore.Model.Enum.StatusCampanha;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record CampanhaResponse(UUID id,
                               UUID segmentoId,
                               String segmentoNome,
                               UUID finalidadeId,
                               String finalidadeNome,
                               String nome,
                               String objetivo,
                               CanalCampanha canal,
                               StatusCampanha status,
                               Map<String, Object> criteriosPublicoSnapshot,
                               BigDecimal orcamento,
                               OffsetDateTime inicioEm,
                               OffsetDateTime fimEm,
                               UUID criadaPorId,
                               String criadaPorNome,
                               OffsetDateTime criadaEm) {
}
