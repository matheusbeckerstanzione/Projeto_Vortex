package neocore.DTO.atributocontato;

import jakarta.validation.constraints.NotNull;
import neocore.Model.Enum.StatusRevisao;

public record RevisaoAtributoContatoRequest(@NotNull
                                            StatusRevisao statusRevisao,

                                            String motivoRevisao) {
}
