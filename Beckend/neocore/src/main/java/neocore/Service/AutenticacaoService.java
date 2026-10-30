package neocore.Service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

import neocore.DTO.autenticacao.*;
import neocore.Model.Usuario;
import neocore.Model.Enum.*;
import neocore.Security.TokenStore;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Transactional(noRollbackFor = BadCredentialsException.class)
public class AutenticacaoService {

    private final EntityManager em;
    private final ServiceSupport suporte;
    private final PasswordEncoder encoder;
    private final TokenStore tokens;
    private final MfaService mfa;
    private final AuditoriaService auditoria;

    private static final String DUMMY =
            new BCryptPasswordEncoder(12)
                    .encode("senha-inacessivel-dummy");

    public LoginResponse login(LoginRequest request) {
        suporte.validar(request);

        var usuarios = em.createQuery(
                        """
                        select u from Usuario u
                        where lower(u.email) = :email
                        """,
                        Usuario.class
                )
                .setParameter(
                        "email",
                        ServiceSupport.email(request.email())
                )
                .setMaxResults(2)
                .getResultList();

        if (usuarios.size() != 1) {
            encoder.matches(request.senha(), DUMMY);
            throw invalida();
        }

        var usuario = suporte.bloquear(
                Usuario.class,
                usuarios.get(0).getId()
        );

        boolean bloqueado = usuario.getBloqueadoAte() != null
                && usuario.getBloqueadoAte()
                .isAfter(OffsetDateTime.now());

        if (usuario.getStatus() != StatusUsuario.ATIVO
                || usuario.getSenhaHash() == null
                || bloqueado) {

            encoder.matches(request.senha(), DUMMY);
            throw invalida();
        }

        if (!encoder.matches(
                request.senha(),
                usuario.getSenhaHash()
        )) {
            falha(usuario);
            throw invalida();
        }

        String desafio = tokens.criar(
                usuario.getId(),
                usuario.getVersaoAcesso(),
                true
        );

        String mensagem =
                usuario.getSegredoMfaCriptografado() == null
                        ? "Configure e confirme o MFA para concluir o login."
                        : "Informe o código MFA.";

        return new LoginResponse(
                false,
                true,
                desafio,
                mensagem
        );
    }

    public MfaService.Configuracao iniciarConfiguracaoMfa(
            String tokenTemporario
    ) {
        var usuario = desafio(tokenTemporario);

        if (usuario.getSegredoMfaCriptografado() != null) {
            throw invalida();
        }

        tokens.tentativa(tokenTemporario);

        var configuracao = mfa.gerar(usuario.getEmail());

        tokens.pendente(
                tokenTemporario,
                mfa.cifrar(configuracao.segredo())
        );

        return configuracao;
    }

    public TokenResponse confirmarMfa(MfaRequest request) {
        suporte.validar(request);

        var usuario = desafio(request.tokenTemporario());

        tokens.tentativa(request.tokenTemporario());

        String cifrado = usuario.getSegredoMfaCriptografado();

        boolean configurando = cifrado == null;

        if (configurando) {
            cifrado = tokens.pendente(request.tokenTemporario());
        }

        if (cifrado == null) {
            throw invalida();
        }

        long contador;

        try {
            contador = mfa.validar(
                    cifrado,
                    request.codigo(),
                    usuario.getUltimoContadorMfa()
            );
        } catch (BadCredentialsException exception) {
            falha(usuario);
            throw invalida();
        }

        usuario.setUltimoContadorMfa(contador);

        if (configurando) {
            usuario.setSegredoMfaCriptografado(cifrado);

            usuario.setVersaoAcesso(
                    Math.addExact(usuario.getVersaoAcesso(), 1)
            );

            tokens.revogar(usuario.getId());
        } else {
            tokens.remover(request.tokenTemporario());
        }

        usuario.setTentativasLogin(0);
        usuario.setBloqueadoAte(null);
        usuario.setAtualizadoEm(OffsetDateTime.now());

        em.flush();

        String token = tokens.criar(
                usuario.getId(),
                usuario.getVersaoAcesso(),
                false
        );

        auditoria.registrar(
                usuario,
                "LOGIN_MFA",
                "Usuario",
                usuario.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return new TokenResponse(
                token,
                "Bearer",
                TokenStore.ACESSO_SEGUNDOS,
                usuario.getId(),
                usuario.getNome(),
                usuario.getPerfil()
        );
    }

    public void logout(String token) {
        tokens.remover(token);
    }

    private Usuario desafio(String token) {
        var entrada = tokens.obter(token, true);

        var usuario = suporte.bloquear(
                Usuario.class,
                entrada.usuarioId
        );

        // Confere novamente após obter o bloqueio.
        tokens.obter(token, true);

        boolean bloqueado = usuario.getBloqueadoAte() != null
                && usuario.getBloqueadoAte()
                .isAfter(OffsetDateTime.now());

        if (usuario.getStatus() != StatusUsuario.ATIVO
                || usuario.getVersaoAcesso() != entrada.versao
                || bloqueado) {
            throw invalida();
        }

        return usuario;
    }

    private void falha(Usuario usuario) {
        usuario.setTentativasLogin(
                Math.min(5, usuario.getTentativasLogin() + 1)
        );

        if (usuario.getTentativasLogin() >= 5) {
            usuario.setBloqueadoAte(
                    OffsetDateTime.now().plusMinutes(15)
            );

            tokens.revogar(usuario.getId());
        }

        auditoria.registrar(
                usuario,
                "FALHA_LOGIN",
                "Usuario",
                usuario.getId(),
                ResultadoAuditoria.FALHA
        );
    }

    private BadCredentialsException invalida() {
        return new BadCredentialsException(
                "Credenciais inválidas ou acesso bloqueado."
        );
    }
}