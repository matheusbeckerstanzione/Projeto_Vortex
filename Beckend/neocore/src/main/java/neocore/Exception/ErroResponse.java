package neocore.Exception;

import java.time.OffsetDateTime;
import java.util.List;

public record ErroResponse(
        OffsetDateTime timestamp,
        int status,
        String erro,
        String mensagem,
        String caminho,
        List<ErroCampoResponse> campos
) {

    public ErroResponse {
        campos = campos == null ? List.of() : List.copyOf(campos);
    }
}