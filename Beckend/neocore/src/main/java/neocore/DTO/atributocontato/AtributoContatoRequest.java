package neocore.DTO.atributocontato;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import neocore.Model.Enum.CampoContato;
import neocore.Model.Enum.MetodoObtencao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AtributoContatoRequest(@NotNull
                                     UUID contatoId,

                                     @NotNull
                                      UUID fonteId,

                                     @NotNull
                                      UUID finalidadeId,

                                     @NotNull
                                     CampoContato campo,

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
