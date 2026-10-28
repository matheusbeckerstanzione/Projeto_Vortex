package neocore.Exception;

public record ErroCampoResponse(
        String campo,
        String mensagem
) {
}