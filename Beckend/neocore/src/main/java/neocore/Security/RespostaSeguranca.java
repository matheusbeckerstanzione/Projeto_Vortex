package neocore.Security;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public final class RespostaSeguranca {

    private RespostaSeguranca() {}

    public static void enviar(
            HttpServletResponse response,
            int status) throws IOException {

        String mensagem = switch (status) {
            case 401 ->
                    "Autenticação necessária ou credencial inválida.";

            case 403 ->
                    "Acesso não permitido.";

            case 429 ->
                    "Limite de requisições atingido. Tente novamente depois.";

            default ->
                    "Não foi possível concluir a solicitação.";
        };

        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setHeader("Cache-Control", "no-store");

        response.getWriter().write(
                "{\"status\":" + status
                        + ",\"mensagem\":\"" + mensagem + "\"}"
        );
    }
}