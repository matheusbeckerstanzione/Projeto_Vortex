package neocore.DTO.interacaocontato;

import neocore.Model.Enum.TipoInteracao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record InteracaoContatoResponse(UUID id,
                                       UUID contatoId,
                                       String contatoNome,
                                       UUID campanhaId,
                                       String campanhaNome,
                                       UUID fonteId,
                                       String fonteNome,
                                       UUID finalidadeId,
                                       String finalidadeNome,
                                       String identificadorOrigem,
                                       TipoInteracao tipoInteracao,
                                       String tema,
                                       String referenciaOrigem,
                                       OffsetDateTime ocorridoEm,
                                       OffsetDateTime criadoEm) {
}
