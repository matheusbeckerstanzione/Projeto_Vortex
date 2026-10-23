package neocore.DTO.segmentocontato;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SegmentoContatoResponse(UUID id,
                                      UUID segmentoId,
                                      String segmentoNome,
                                      UUID contatoId,
                                      String contatoNome,
                                      String motivoInclusao,
                                      OffsetDateTime avaliadoEm) {
}
