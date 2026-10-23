package neocore.DTO.conviteacesso;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CriacaoConviteRequest(@NotNull
                                    UUID usuarioId,

                                    @NotNull
                                    @Future
                                    OffsetDateTime expiraEm) {
}
