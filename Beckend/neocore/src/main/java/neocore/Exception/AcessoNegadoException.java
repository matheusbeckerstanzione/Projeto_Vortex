package neocore.Exception;

import org.springframework.security.access.AccessDeniedException;

public class AcessoNegadoException extends AccessDeniedException {

    public AcessoNegadoException(String mensagem) {
        super(mensagem);
    }
}