package neocore.DTO.atributoempresa;

import jakarta.validation.constraints.NotNull;
import neocore.Model.Enum.StatusRevisao;

public record RevisaoAtributoEmpresaRequest(@NotNull
                                            StatusRevisao statusRevisao,

                                            String motivoRevisao) {
}
