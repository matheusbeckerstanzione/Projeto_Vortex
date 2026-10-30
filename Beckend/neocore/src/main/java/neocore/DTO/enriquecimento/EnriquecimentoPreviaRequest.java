package neocore.DTO.enriquecimento;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EnriquecimentoPreviaRequest(
        @NotNull UUID finalidadeId,
        @NotNull UUID fonteBrasilApiId,
        @NotNull UUID fonteViaCepId,
        @NotNull @Future OffsetDateTime validoAte
) {
}