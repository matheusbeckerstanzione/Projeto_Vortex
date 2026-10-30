package neocore.Config;

import neocore.Model.Usuario;
import neocore.Model.Enum.*;
import neocore.Repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Locale;

@Configuration
@ConditionalOnProperty(
        name = "neocore.bootstrap.enabled",
        havingValue = "true"
)
public class PrimeiroAdministradorConfig {

    @Bean
    ApplicationRunner criarPrimeiroAdministrador(
            UsuarioRepository usuarios,
            PasswordEncoder encoder,
            PlatformTransactionManager manager,
            @Value("${NEOCORE_ADMIN_EMAIL:}") String email,
            @Value("${NEOCORE_ADMIN_NOME:}") String nome,
            @Value("${NEOCORE_ADMIN_PASSWORD:}") String senha
    ) {
        return args -> new TransactionTemplate(manager)
                .executeWithoutResult(status -> {

                    if (usuarios.count() != 0) {
                        throw new IllegalStateException(
                                "Bootstrap só pode ser usado "
                                        + "com a tabela usuarios vazia."
                        );
                    }

                    boolean emailValido = email.matches(
                            "[^\\s@]+@[^\\s@]+\\.[^\\s@]+"
                    );

                    boolean senhaValida = senha.length() >= 12
                            && senha.getBytes(
                            StandardCharsets.UTF_8
                    ).length <= 72;

                    if (nome.isBlank()
                            || nome.length() > 120
                            || email.length() > 254
                            || !emailValido
                            || !senhaValida) {

                        throw new IllegalStateException(
                                "Configure nome, e-mail válido e senha "
                                        + "inicial de 12 caracteres ou mais "
                                        + "(máximo 72 bytes)."
                        );
                    }

                    var usuario = new Usuario();

                    usuario.setNome(nome.strip());
                    usuario.setEmail(
                            email.strip().toLowerCase(Locale.ROOT)
                    );

                    usuario.setSenhaHash(encoder.encode(senha));
                    usuario.setPerfil(
                            PerfilUsuario.ADMINISTRADOR
                    );
                    usuario.setStatus(StatusUsuario.ATIVO);

                    usuario.setCriadoEm(OffsetDateTime.now());
                    usuario.setAtualizadoEm(
                            usuario.getCriadoEm()
                    );
                    usuario.setAtivadoEm(
                            usuario.getCriadoEm()
                    );

                    usuarios.save(usuario);
                });
    }
}