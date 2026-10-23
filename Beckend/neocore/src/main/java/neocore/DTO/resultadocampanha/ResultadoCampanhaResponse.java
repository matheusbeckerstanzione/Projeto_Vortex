package neocore.DTO.resultadocampanha;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ResultadoCampanhaResponse(UUID id,
                                        UUID campanhaId,
                                        String campanhaNome,
                                        UUID fonteId,
                                        String fonteNome,
                                        String variante,
                                        LocalDate periodoInicio,
                                        LocalDate periodoFim,
                                        Integer envios,
                                        Integer entregues,
                                        Integer cliques,
                                        Integer conversoes,
                                        BigDecimal custo,
                                        BigDecimal receita,
                                        OffsetDateTime registradoEm) {
}
