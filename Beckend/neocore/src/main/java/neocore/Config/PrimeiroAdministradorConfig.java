package neocore.Config;

import jakarta.persistence.EntityManager;
import neocore.Model.Enum.PerfilUsuario;
import neocore.Model.Enum.StatusUsuario;
import neocore.Model.Usuario;
import neocore.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.OffsetDateTime;
import java.util.Locale;

@Configuration
@ConditionalOnProperty(
        name = "neocore.bootstrap.enabled",
        havingValue = "true"
)
public class PrimeiroAdministradorConfig {

    @Bean
    public ApplicationRunner criarPrimeiroAdministrador(
            UsuarioRepository usuarios,
            EntityManager em,
            PasswordEncoder encoder,
            PlatformTransactionManager manager,

            @Value("${NEOCORE_ADMIN_EMAIL:}")
            String email,

            @Value("${NEOCORE_ADMIN_NOME:}")
            String nome,

            @Value("${NEOCORE_ADMIN_PASSWORD:}")
            String senha) {

        return args ->
                new TransactionTemplate(manager)
                        .executeWithoutResult(status -> {

                            // Bloqueio transacional no PostgreSQL.
                            // Evita dois bootstraps simultâneos.
                            em.createNativeQuery(
                                    "SELECT 1 FROM "
                                            + "pg_advisory_xact_lock(6382738429134)"
                            ).getSingleResult();

                            if (usuarios.count() != 0) {
                                throw new IllegalStateException(
                                        "Bootstrap exige a tabela usuarios vazia."
                                );
                            }

                            String emailNormalizado = email.strip()
                                    .toLowerCase(Locale.ROOT);

                            if (nome.isBlank()
                                    || nome.length() > 120
                                    || emailNormalizado.length() > 254
                                    || !emailNormalizado.matches(
                                    "[^\\s@]+@[^\\s@]+\\.[^\\s@]+"
                            )) {

                                throw new IllegalStateException(
                                        "Configure nome e e-mail válidos "
                                                + "do administrador."
                                );
                            }

                            var usuario = new Usuario();

                            usuario.setNome(nome.strip());
                            usuario.setEmail(emailNormalizado);
                            usuario.setSenhaHash(encoder.encode(senha));
                            usuario.setPerfil(PerfilUsuario.ADMINISTRADOR);
                            usuario.setStatus(StatusUsuario.ATIVO);

                            usuario.setCriadoEm(OffsetDateTime.now());
                            usuario.setAtualizadoEm(usuario.getCriadoEm());
                            usuario.setAtivadoEm(usuario.getCriadoEm());

                            usuario.setVersaoAcesso(0);
                            usuario.setTentativasLogin(0);
                            usuario.setUltimoContadorMfa(0L);

                            usuarios.save(usuario);

                            // O primeiro login também exige MFA.
                        });
    }
}