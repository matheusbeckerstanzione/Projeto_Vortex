package neocore.Security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;

import neocore.Model.Enum.StatusUsuario;
import neocore.Repository.UsuarioRepository;

import org.springframework.security.authentication.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class FiltroToken extends OncePerRequestFilter {

    private final TokenStore tokens;
    private final UsuarioRepository usuarios;

    public FiltroToken(
            TokenStore tokens,
            UsuarioRepository usuarios
    ) {
        this.tokens = tokens;
        this.usuarios = usuarios;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null) {
            try {
                if (!header.startsWith("Bearer ")) {
                    throw new BadCredentialsException(
                            "Credencial inválida."
                    );
                }

                var entrada = tokens.obter(
                        header.substring(7),
                        false
                );

                var usuario = usuarios.findById(entrada.usuarioId)
                        .orElseThrow(() ->
                                new BadCredentialsException(
                                        "Usuário não encontrado."
                                )
                        );

                if (usuario.getStatus() != StatusUsuario.ATIVO
                        || usuario.getVersaoAcesso() != entrada.versao
                        || usuario.getSegredoMfaCriptografado() == null) {

                    throw new BadCredentialsException(
                            "Credencial inválida."
                    );
                }

                var permissao = new SimpleGrantedAuthority(
                        "ROLE_" + usuario.getPerfil().name()
                );

                var authentication =
                        new UsernamePasswordAuthenticationToken(
                                usuario.getId(),
                                null,
                                List.of(permissao)
                        );

                var contexto =
                        SecurityContextHolder.createEmptyContext();

                contexto.setAuthentication(authentication);

                SecurityContextHolder.setContext(contexto);

            } catch (BadCredentialsException exception) {
                response.setStatus(401);
                response.setContentType("application/json");

                response.getWriter().write(
                        """
                        {
                          "status": 401,
                          "mensagem": "Credencial inválida ou expirada."
                        }
                        """
                );

                return;
            }
        }

        try {
            chain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}