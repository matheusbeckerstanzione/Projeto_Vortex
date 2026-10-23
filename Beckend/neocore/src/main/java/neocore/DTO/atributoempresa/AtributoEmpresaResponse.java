package neocore.DTO.atributoempresa;

import neocore.Model.Enum.CampoEmpresa;
import neocore.Model.Enum.MetodoObtencao;
import neocore.Model.Enum.StatusRevisao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AtributoEmpresaResponse(UUID id,
                                      UUID empresaId,
                                      String empresaNome,
                                      UUID fonteId,
                                      String fonteNome,
                                      UUID finalidadeId,
                                      String finalidadeNome,
                                      CampoEmpresa campo,
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
