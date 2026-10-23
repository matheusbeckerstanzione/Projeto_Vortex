package neocore.DTO.conviteacesso;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ConviteAcessoResponse(UUID id,
                                    UUID usuarioId,
                                    String usuarioNome,
                                    String usuarioEmail,
                                    UUID criadoPorId,
                                    OffsetDateTime criadoEm,
                                    OffsetDateTime expiraEm,
                                    OffsetDateTime utilizadoEm,
                                    OffsetDateTime revogadoEm) {
}
