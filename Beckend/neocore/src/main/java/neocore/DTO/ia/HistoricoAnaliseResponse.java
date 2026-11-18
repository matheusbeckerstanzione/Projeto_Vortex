package neocore.DTO.ia;

import tools.jackson.databind.JsonNode;

import java.time.Instant;

public record HistoricoAnaliseResponse(
        String id,
        String operacao,
        boolean ficticio,
        Instant criadoEm,
        JsonNode resposta
) {
}