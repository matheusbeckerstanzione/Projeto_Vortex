package neocore.DTO.segmento;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record SegmentacaoEmpresasRequest(

        @NotNull
        UUID finalidadeId,

        @NotEmpty
        Map<String, Object> criterios

) {
}