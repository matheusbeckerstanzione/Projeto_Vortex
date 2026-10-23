package neocore.DTO.atributocontato;

import neocore.Model.Enum.CampoContato;
import neocore.Model.Enum.MetodoObtencao;
import neocore.Model.Enum.StatusRevisao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AtributoContatoResponse(UUID id,
                                      UUID contatoId,
                                      String contatoNome,
                                      UUID fonteId,
                                      String fonteNome,
                                      UUID finalidadeId,
                                      String finalidadeNome,
                                      CampoContato campo,
                                      String valor,
                                      String referenciaOrigem,
                                      String trechoEvidencia,
                                      MetodoObtencao metodoObtencao,
                                      StatusRevisao statusRevisao,
                                      UUID revisadoPorId,
                                      String revisadoPorNome,
                                      String motivoRevisao,
                                      OffsetDateTime coletadoEm,
                                      OffsetDateTime revisadoEm,
                                      OffsetDateTime validoAte) {
}
