package neocore.DTO.solicitacaoacesso;


import jakarta.validation.constraints.NotNull;
import neocore.Model.Enum.StatusSolicitacao;

public record AvaliacaoSolicitacaoRequest(@NotNull StatusSolicitacao status) {
}
