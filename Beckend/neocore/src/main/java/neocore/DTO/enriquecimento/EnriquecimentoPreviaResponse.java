package neocore.DTO.enriquecimento;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EnriquecimentoPreviaResponse(
        UUID previaId,
        UUID empresaId,
        long versao,
        Instant expiraEm,
        List<CampoEnriquecimentoResponse> campos,
        List<String> avisos
) {
}