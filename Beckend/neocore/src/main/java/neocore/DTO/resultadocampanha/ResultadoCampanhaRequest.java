package neocore.DTO.resultadocampanha;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ResultadoCampanhaRequest( @NotNull
                                        UUID campanhaId,

                                        @NotNull
                                        UUID fonteId,

                                        @NotBlank
                                        @Size(max = 50)
                                        String variante,

                                        @NotNull
                                        LocalDate periodoInicio,

                                        @NotNull
                                        LocalDate periodoFim,

                                        @NotNull
                                        @PositiveOrZero
                                        Integer envios,

                                        @NotNull
                                        @PositiveOrZero
                                        Integer entregues,

                                        @NotNull
                                        @PositiveOrZero
                                        Integer cliques,

                                        @NotNull
                                        @PositiveOrZero
                                        Integer conversoes,

                                        @DecimalMin("0.00")
                                        BigDecimal custo,

                                        @DecimalMin("0.00")
                                        BigDecimal receita) {
}
