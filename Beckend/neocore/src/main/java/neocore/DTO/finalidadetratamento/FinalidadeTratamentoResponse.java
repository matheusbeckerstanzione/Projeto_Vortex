package neocore.DTO.finalidadetratamento;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FinalidadeTratamentoResponse(UUID id,
                                           String nome,
                                           String descricao,
                                           String baseLegal,
                                           String referenciaAvaliacao,
                                           Integer retencaoDias,
                                           Boolean habilitada,
                                           OffsetDateTime criadoEm) {
}
