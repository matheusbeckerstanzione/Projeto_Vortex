package neocore.DTO.interacaocontato;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import neocore.Model.Enum.TipoInteracao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record InteracaoContatoRequest(@NotNull
                                      UUID contatoId,

                                      UUID campanhaId,

                                      @NotNull
                                      UUID fonteId,

                                      @NotNull
                                      UUID finalidadeId,

                                      @NotBlank
                                      @Size(max = 160)
                                      String identificadorOrigem,

                                      @NotNull
                                      TipoInteracao tipoInteracao,

                                      @Size(max = 120)
                                      String tema,

                                      @NotBlank
                                      String referenciaOrigem,

                                      @NotNull
                                      OffsetDateTime ocorridoEm) {
}
