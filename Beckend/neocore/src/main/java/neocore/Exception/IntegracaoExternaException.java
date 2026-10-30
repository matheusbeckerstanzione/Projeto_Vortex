package neocore.Exception;

import org.springframework.http.HttpStatus;

public class IntegracaoExternaException extends RuntimeException {

    private final HttpStatus status;

    public IntegracaoExternaException(
            HttpStatus status,
            String mensagem) {

        super(mensagem);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}