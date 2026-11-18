package neocore.DTO.integracao;

import java.time.OffsetDateTime;

public record YouTubeVideoResponse(
        String titulo,
        String url,
        OffsetDateTime publicadoEm
) {
}