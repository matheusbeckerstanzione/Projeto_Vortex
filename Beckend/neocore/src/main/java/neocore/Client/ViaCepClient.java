package neocore.Client;

import neocore.DTO.integracao.ViaCepResponse;
import neocore.Exception.RecursoNaoEncontradoException;
import neocore.Exception.RegraNegocioException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ViaCepClient {

    private final RestClient client;

    public ViaCepClient(
            @Lazy
            @Qualifier("viaCepRestClient")
            RestClient client) {

        this.client = client;
    }

    public ViaCepResponse consultarCep(String cep) {
        String normalizado = normalizarCep(cep);

        var resposta = IntegracaoHttpSupport.buscar(
                client,
                "/ws/{cep}/json/",
                normalizado,
                ViaCepResponse.class,
                "ViaCEP",
                "CEP"
        );

        if (Boolean.TRUE.equals(resposta.erro())) {
            throw new RecursoNaoEncontradoException(
                    "CEP não encontrado no ViaCEP."
            );
        }

        String recebido;

        try {
            recebido = normalizarCep(resposta.cep());

        } catch (RegraNegocioException exception) {
            throw IntegracaoHttpSupport.respostaInvalida(
                    "ViaCEP"
            );
        }

        if (!normalizado.equals(recebido)) {
            throw IntegracaoHttpSupport.respostaInvalida(
                    "ViaCEP"
            );
        }

        return resposta;
    }

    private static String normalizarCep(String cep) {
        if (cep == null || cep.length() > 16) {
            throw formatoInvalido();
        }

        String valor = cep.strip();

        boolean semMascara = valor.matches("[0-9]{8}");

        boolean comMascara = valor.matches(
                "[0-9]{5}-[0-9]{3}"
        );

        if (!semMascara && !comMascara) {
            throw formatoInvalido();
        }

        return valor.replace("-", "");
    }

    private static RegraNegocioException formatoInvalido() {
        return new RegraNegocioException(
                "Informe um CEP com 8 números, com ou sem hífen."
        );
    }
}