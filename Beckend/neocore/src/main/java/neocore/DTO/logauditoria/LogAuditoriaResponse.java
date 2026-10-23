package neocore.DTO.logauditoria;

import neocore.Model.Enum.ResultadoAuditoria;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LogAuditoriaResponse(Long id,
                                   UUID usuarioId,
                                   String usuarioNome,
                                   String acao,
                                   String tipoRecurso,
                                   UUID recursoId,
                                   ResultadoAuditoria resultado,
                                   OffsetDateTime ocorridoEm) {
}
