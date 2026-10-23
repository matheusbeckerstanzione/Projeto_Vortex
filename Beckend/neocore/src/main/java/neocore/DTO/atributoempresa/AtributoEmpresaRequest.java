package neocore.DTO.atributoempresa;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import neocore.Model.Enum.CampoEmpresa;
import neocore.Model.Enum.MetodoObtencao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AtributoEmpresaRequest(  @NotNull
                                       UUID empresaId,

                                       @NotNull
                                       UUID fonteId,

                                       @NotNull
                                       UUID finalidadeId,

                                       @NotNull
                                       CampoEmpresa campo,

                                       @NotBlank
                                       String valor,

                                       @NotBlank
                                       String referenciaOrigem,

                                       @NotBlank
                                       String trechoEvidencia,

                                       @NotNull
                                       MetodoObtencao metodoObtencao,

                                       @NotNull
                                       @Future
                                       OffsetDateTime validoAte) {
}
