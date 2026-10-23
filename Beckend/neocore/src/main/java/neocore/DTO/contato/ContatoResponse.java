package neocore.DTO.contato;

import neocore.Model.Enum.StatusIdentidade;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ContatoResponse(UUID id,
                              UUID empresaId,
                              String empresaNome,
                              String nomeExibicao,
                              StatusIdentidade statusIdentidade,
                              OffsetDateTime criadoEm,
                              OffsetDateTime revisarAte,
                              OffsetDateTime atualizadoEm) {
}
