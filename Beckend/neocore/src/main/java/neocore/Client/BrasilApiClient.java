package neocore.Client;

import neocore.DTO.integracao.BrasilApiCnpjResponse;
import neocore.Exception.RegraNegocioException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Locale;

@Component
public class BrasilApiClient {

    private final RestClient client;

    public BrasilApiClient(
            @Lazy
            @Qualifier("brasilApiRestClient")
            RestClient client) {

        this.client = client;
    }

    public BrasilApiCnpjResponse consultarCnpj(String cnpj) {
        String normalizado = normalizarCnpj(cnpj);

        var resposta = IntegracaoHttpSupport.buscar(
                client,
                "/api/cnpj/v1/{cnpj}",
                normalizado,
                BrasilApiCnpjResponse.class,
                "BrasilAPI",
                "CNPJ"
        );

        String recebido;

        try {
            recebido = normalizarCnpj(resposta.cnpj());

        } catch (RegraNegocioException exception) {
            // O problema está na resposta do fornecedor.
            throw IntegracaoHttpSupport.respostaInvalida(
                    "BrasilAPI"
            );
        }

        if (!normalizado.equals(recebido)) {
            throw IntegracaoHttpSupport.respostaInvalida(
                    "BrasilAPI"
            );
        }

        return resposta;
    }

    private static String normalizarCnpj(String cnpj) {
        if (cnpj == null || cnpj.length() > 32) {
            throw formatoInvalido();
        }

        String valor = cnpj.strip();

        boolean semMascara = valor.matches(
                "[0-9A-Za-z]{12}[0-9]{2}"
        );

        boolean comMascara = valor.matches(
                "[0-9A-Za-z]{2}\\."
                        + "[0-9A-Za-z]{3}\\."
                        + "[0-9A-Za-z]{3}/"
                        + "[0-9A-Za-z]{4}-"
                        + "[0-9]{2}"
        );

        if (!semMascara && !comMascara) {
            throw formatoInvalido();
        }

        return valor
                .replace(".", "")
                .replace("/", "")
                .replace("-", "")
                .toUpperCase(Locale.ROOT);
    }

    private static RegraNegocioException formatoInvalido() {
        return new RegraNegocioException(
                "Informe um CNPJ com 14 caracteres, com ou sem máscara. "
                        + "Os dois últimos caracteres devem ser números."
        );
    }
}