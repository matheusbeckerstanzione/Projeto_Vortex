package neocore.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

public class FiltroLimiteRequisicoes extends OncePerRequestFilter {

    private static final Set<String> PUBLICOS = Set.of(
            "/autenticacao/login",
            "/autenticacao/mfa/configuracao",
            "/autenticacao/mfa/confirmar",
            "/convites/ativar",
            "/solicitacoes-acesso"
    );

    private final LimitadorRequisicoes limitador;

    public FiltroLimiteRequisicoes(
            LimitadorRequisicoes limitador) {

        this.limitador = limitador;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws IOException, ServletException {

        // Não confiar em X-Forwarded-For enviado pelo cliente.
        String ip = request.getRemoteAddr();

        String caminho = request.getRequestURI()
                .substring(request.getContextPath().length());

        boolean publico = "POST".equals(request.getMethod())
                && PUBLICOS.contains(caminho);

        boolean permitido = limitador.permitir(
                "ip:" + ip,
                120
        );

        if (permitido && publico) {
            permitido = limitador.permitir(
                    "publico:ip:" + ip,
                    10
            ) && limitador.permitir(
                    "publico:global",
                    200
            );
        }

        if (permitido) {
            permitido = limitador.permitir(
                    "global",
                    3000
            );
        }

        if (!permitido) {
            response.setHeader(
                    "Retry-After",
                    Long.toString(limitador.segundosAteRenovar())
            );

            RespostaSeguranca.enviar(response, 429);
            return;
        }

        chain.doFilter(request, response);
    }
}