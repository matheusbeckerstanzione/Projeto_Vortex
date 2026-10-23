package neocore.DTO.tarefacoleta;

import neocore.Model.Enum.StatusTarefa;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TarefaColetaResponse(UUID id,
                                   UUID pesquisaId,
                                   UUID fonteId,
                                   String fonteNome,
                                   String urlPagina,
                                   String chaveIdempotencia,
                                   StatusTarefa status,
                                   Integer tentativas,
                                   OffsetDateTime disponivelEm,
                                   OffsetDateTime reservadaEm,
                                   String codigoErro,
                                   OffsetDateTime criadaEm,
                                   OffsetDateTime finalizadaEm) {
}
