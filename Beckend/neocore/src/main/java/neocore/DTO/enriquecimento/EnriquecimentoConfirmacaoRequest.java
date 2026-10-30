package neocore.DTO.enriquecimento;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

public record EnriquecimentoConfirmacaoRequest(
        @NotNull UUID previaId,

        @NotEmpty
        Set<@NotNull CampoEnriquecimentoEmpresa> campos,

        @NotNull
        Set<@NotNull CampoEnriquecimentoEmpresa> sobrescrever
) {
}