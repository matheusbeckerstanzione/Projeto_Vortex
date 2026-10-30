package neocore.DTO.enriquecimento;

import java.util.Map;
import java.util.UUID;

public record EnriquecimentoEmpresaResponse(
        UUID empresaId,
        long versao,
        Map<CampoEnriquecimentoEmpresa, String> valores,
        Map<String, Map<String, String>> origens
) {
}