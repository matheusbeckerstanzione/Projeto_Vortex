package neocore.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import neocore.Model.Enum.StatusUsuario;
import neocore.Repository.UsuarioRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;

public class FiltroToken extends OncePerRequestFilter {

    private final TokenStore tokens;
    private final UsuarioRepository usuarios;
    private final LimitadorRequisicoes limitador;

    public FiltroToken(
            TokenStore tokens,
            UsuarioRepository usuarios,
            LimitadorRequisicoes limitador) {

        this.tokens = tokens;
        this.usuarios = usuarios;
        this.limitador = limitador;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain)
            throws ServletException, IOException {

        SecurityContextHolder.clearContext();

        try {
            String header = request.getHeader("Authorization");

            if (header != null) {
                try {
                    if (!header.startsWith("Bearer ")) {
                        throw new BadCredentialsException(
                                "Credencial inválida."
                        );
                    }

                    String token = header.substring(7);

                    var entrada = tokens.obter(token, false);

                    var usuario = usuarios.findById(entrada.usuarioId)
                            .orElseThrow(() ->
                                    new BadCredentialsException(
                                            "Credencial inválida."
                                    )
                            );

                    boolean bloqueado = usuario.getBloqueadoAte() != null
                            && usuario.getBloqueadoAte()
                            .isAfter(OffsetDateTime.now());

                    if (usuario.getStatus() != StatusUsuario.ATIVO
                            || usuario.getPerfil() == null
                            || !Objects.equals(
                            usuario.getVersaoAcesso(),
                            entrada.versao
                    )
                            || usuario.getSegredoMfaCriptografado() == null
                            || usuario.getSegredoMfaCriptografado().isBlank()
                            || bloqueado) {

                        throw new BadCredentialsException(
                                "Credencial inválida."
                        );
                    }

                    // Confere novamente após a consulta ao banco.
                    tokens.obter(token, false);

                    if (!limitador.permitir(
                            "usuario:" + usuario.getId(),
                            120)) {

                        response.setHeader(
                                "Retry-After",
                                Long.toString(
                                        limitador.segundosAteRenovar()
                                )
                        );

                        RespostaSeguranca.enviar(response, 429);
                        return;
                    }

                    var authentication =
                            new UsernamePasswordAuthenticationToken(
                                    usuario.getId(),
                                    null,
                                    List.of(
                                            new SimpleGrantedAuthority(
                                                    "ROLE_"
                                                            + usuario.getPerfil().name()
                                            )
                                    )
                            );

                    var contexto =
                            SecurityContextHolder.createEmptyContext();

                    contexto.setAuthentication(authentication);

                    SecurityContextHolder.setContext(contexto);

                } catch (BadCredentialsException exception) {
                    RespostaSeguranca.enviar(response, 401);
                    return;
                }
            }

            chain.doFilter(request, response);

        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}