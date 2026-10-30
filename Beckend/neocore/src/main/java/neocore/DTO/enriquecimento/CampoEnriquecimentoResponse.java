package neocore.DTO.enriquecimento;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CampoEnriquecimentoResponse(
        CampoEnriquecimentoEmpresa campo,
        String atual,
        String sugerido,
        boolean exigeSobrescrita,
        UUID fonteId,
        String fornecedor,
        String referenciaOrigem,
        OffsetDateTime consultadoEm
) {
}