package neocore.DTO.segmento;

import neocore.Model.Enum.StatusSegmento;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record SegmentoResponse(UUID id,
                               String nome,
                               String descricao,
                               Map<String, Object> criterios,
                               UUID finalidadeId,
                               String finalidadeNome,
                               StatusSegmento status,
                               UUID criadoPorId,
                               String criadoPorNome,
                               OffsetDateTime criadoEm,
                               OffsetDateTime atualizadoEm) {
}
