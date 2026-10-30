package neocore.Client;

import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RecursoNaoEncontradoException;
import neocore.Exception.RegraNegocioException;

import org.springframework.http.HttpStatus;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;

// Utilitário interno: não precisa de @Component.
final class IntegracaoHttpSupport {

    private IntegracaoHttpSupport() {}

    static <T> T buscar(
            RestClient client,
            String caminho,
            String valor,
            Class<T> tipo,
            String fornecedor,
            String documento) {

        try {
            T resposta = client.get()
                    .uri(caminho, valor)
                    .retrieve()
                    .onStatus(
                            status -> !status.is2xxSuccessful(),
                            (request, response) -> {

                                int codigo =
                                        response.getStatusCode().value();

                                if (codigo == 400) {
                                    throw new RegraNegocioException(
                                            fornecedor
                                                    + " rejeitou o "
                                                    + documento
                                                    + " informado."
                                    );
                                }

                                if (codigo == 404) {
                                    throw new RecursoNaoEncontradoException(
                                            documento
                                                    + " não encontrado. Fornecedor: "
                                                    + fornecedor
                                                    + "."
                                    );
                                }

                                if (codigo == 429 || codigo == 503) {
                                    throw new IntegracaoExternaException(
                                            HttpStatus.SERVICE_UNAVAILABLE,
                                            fornecedor
                                                    + " indisponível ou com limite "
                                                    + "de consultas atingido."
                                    );
                                }

                                throw respostaInvalida(fornecedor);
                            }
                    )
                    .body(tipo);

            if (resposta == null) {
                throw respostaInvalida(fornecedor);
            }

            return resposta;

        } catch (ResourceAccessException exception) {
            if (timeout(exception)) {
                throw new IntegracaoExternaException(
                        HttpStatus.GATEWAY_TIMEOUT,
                        "Tempo limite excedido na consulta ao fornecedor "
                                + fornecedor
                                + "."
                );
            }

            throw new IntegracaoExternaException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Não foi possível conectar ao fornecedor "
                            + fornecedor
                            + "."
            );

        } catch (RestClientException exception) {
            throw respostaInvalida(fornecedor);
        }
    }

    static IntegracaoExternaException respostaInvalida(
            String fornecedor) {

        return new IntegracaoExternaException(
                HttpStatus.BAD_GATEWAY,
                "Resposta inválida ou inesperada do fornecedor "
                        + fornecedor
                        + "."
        );
    }

    private static boolean timeout(Throwable exception) {
        for (
                Throwable causa = exception;
                causa != null;
                causa = causa.getCause()
        ) {
            if (causa instanceof SocketTimeoutException
                    || causa instanceof HttpTimeoutException) {

                return true;
            }
        }

        return false;
    }
}