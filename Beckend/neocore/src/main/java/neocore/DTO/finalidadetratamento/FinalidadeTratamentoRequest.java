package neocore.DTO.finalidadetratamento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record FinalidadeTratamentoRequest(@NotBlank
                                             @Size(max = 120)
                                             String nome,

                                          @NotBlank
                                             String descricao,

                                          @Size(max = 100)
                                             String baseLegal,

                                          String referenciaAvaliacao,

                                          @NotNull
                                             @Positive
                                             Integer retencaoDias,

                                          @NotNull
                                             Boolean habilitada) {
}
