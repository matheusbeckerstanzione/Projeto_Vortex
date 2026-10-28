package neocore.Exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.OffsetDateTime;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> tratarRecursoNaoEncontrado(
            RecursoNaoEncontradoException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request,
                List.of()
        );
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ErroResponse> tratarRegraNegocio(
            RegraNegocioException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request,
                List.of()
        );
    }

    @ExceptionHandler(ConflitoException.class)
    public ResponseEntity<ErroResponse> tratarConflito(
            ConflitoException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.CONFLICT,
                exception.getMessage(),
                request,
                List.of()
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErroResponse> tratarAcessoNegado(
            AccessDeniedException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.FORBIDDEN,
                "Você não tem permissão para realizar esta operação.",
                request,
                List.of()
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErroResponse> tratarAutenticacao(
            AuthenticationException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.UNAUTHORIZED,
                "Autenticação necessária ou credenciais inválidas.",
                request,
                List.of()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> tratarValidacao(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<ErroCampoResponse> campos =
                exception.getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .map(erro -> new ErroCampoResponse(
                                erro.getField(),
                                erro.getDefaultMessage()
                        ))
                        .distinct()
                        .toList();

        return responder(
                HttpStatus.BAD_REQUEST,
                "Existem campos inválidos na requisição.",
                request,
                campos
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErroResponse> tratarRestricoesValidacao(
            ConstraintViolationException exception,
            HttpServletRequest request
    ) {
        List<ErroCampoResponse> campos =
                exception.getConstraintViolations()
                        .stream()
                        .map(erro -> new ErroCampoResponse(
                                erro.getPropertyPath().toString(),
                                erro.getMessage()
                        ))
                        .distinct()
                        .toList();

        return responder(
                HttpStatus.BAD_REQUEST,
                "Existem valores inválidos na requisição.",
                request,
                campos
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResponse> tratarCorpoInvalido(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.BAD_REQUEST,
                "Corpo da requisição ausente ou inválido. "
                        + "Confira o JSON, os tipos e os valores informados.",
                request,
                List.of()
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErroResponse> tratarParametroInvalido(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.BAD_REQUEST,
                "Um parâmetro da requisição possui formato inválido.",
                request,
                List.of(new ErroCampoResponse(
                        exception.getName(),
                        "Formato inválido."
                ))
        );
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErroResponse> tratarMetodoNaoPermitido(
            HttpRequestMethodNotSupportedException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.METHOD_NOT_ALLOWED,
                "Método HTTP não permitido para este endereço.",
                request,
                List.of()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponse> tratarIntegridadeBanco(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        return responder(
                HttpStatus.CONFLICT,
                "Não foi possível concluir a operação devido a "
                        + "uma restrição de integridade dos dados.",
                request,
                List.of()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResponse> tratarErroInesperado(
            Exception exception,
            HttpServletRequest request
    ) {
        // Registra o erro no servidor sem expor detalhes na resposta.
        log.error("Erro inesperado ao processar requisição.", exception);

        return responder(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocorreu um erro interno ao processar a solicitação.",
                request,
                List.of()
        );
    }

    private ResponseEntity<ErroResponse> responder(
            HttpStatus status,
            String mensagem,
            HttpServletRequest request,
            List<ErroCampoResponse> campos
    ) {
        ErroResponse resposta = new ErroResponse(
                OffsetDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                mensagem,
                request.getRequestURI(),
                campos
        );

        return ResponseEntity.status(status).body(resposta);
    }
}