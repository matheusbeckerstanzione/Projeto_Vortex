package neocore.DTO.sinais;

import java.util.List;

public record SugestaoPautasResponse(
        List<Pauta> pautas
) {
    public record Pauta(
            String titulo,
            String abordagem,
            List<String> linksReferencia
    ) {
    }
}