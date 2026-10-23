package neocore.DTO.solicitacaoacesso;

import neocore.Model.Enum.StatusSolicitacao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SolicitacaoAcessoResponse(UUID id,
                                        String nome,
                                        String email,
                                        String justificativa,
                                        StatusSolicitacao status,
                                        UUID avaliadoPorId,
                                        String avaliadoPorNome,
                                        OffsetDateTime solicitadoEm,
                                        OffsetDateTime avaliadoEm) {
}
