package neocore.DTO.restricaouso;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import neocore.Model.Enum.CanalCampanha;
import neocore.Model.Enum.EscopoRestricao;

import java.util.UUID;

public record RestricaoUsoRequest(@NotNull
                                  UUID contatoId,

                                  UUID finalidadeId,

                                  @NotNull
                                  EscopoRestricao escopo,

                                  CanalCampanha canal,

                                  @NotBlank
                                  String motivo) {
}
