package neocore.DTO.restricaouso;

import jakarta.validation.constraints.NotBlank;

public record EncerramentoRestricaoRequest(@NotBlank
                                           String motivoEncerramento) {
}
