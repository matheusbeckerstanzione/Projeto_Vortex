package neocore.Security;

import neocore.Exception.RegraNegocioException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class SenhaSeguraEncoder implements PasswordEncoder {

    private static final Pattern HASH_LISTA =
            Pattern.compile("[0-9a-fA-F]{64}");

    private static final Pattern HASH_BCRYPT =
            Pattern.compile("\\$2[aby]\\$[0-9]{2}\\$[./A-Za-z0-9]{53}");

    private final BCryptPasswordEncoder bcrypt =
            new BCryptPasswordEncoder(12);

    private final Set<String> senhasBloqueadas;

    public SenhaSeguraEncoder(String arquivo, boolean exigirLista) {
        this.senhasBloqueadas = carregarLista(arquivo, exigirLista);
    }

    @Override
    public String encode(CharSequence rawPassword) {
        String senha = rawPassword == null
                ? null
                : rawPassword.toString();

        if (!comprimentoValido(senha)
                || senha.isBlank()
                || senha.codePointCount(0, senha.length()) < 12) {

            throw new RegraNegocioException(
                    "A senha deve ter pelo menos 12 caracteres "
                            + "e no máximo 72 bytes UTF-8."
            );
        }

        if (senhasBloqueadas.contains(sha256(senha))) {
            throw new RegraNegocioException(
                    "Esta senha consta na lista de senhas comprometidas. "
                            + "Escolha outra."
            );
        }

        return bcrypt.encode(senha);
    }

    @Override
    public boolean matches(
            CharSequence rawPassword,
            String encodedPassword) {

        String senha = rawPassword == null
                ? null
                : rawPassword.toString();

        if (!comprimentoValido(senha)
                || encodedPassword == null
                || !HASH_BCRYPT.matcher(encodedPassword).matches()) {

            return false;
        }

        // A política mínima nova é aplicada ao criar senhas.
        // A comparação continua compatível com hashes legados.
        try {
            return bcrypt.matches(senha, encodedPassword);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    @Override
    public boolean upgradeEncoding(String encodedPassword) {
        return bcrypt.upgradeEncoding(encodedPassword);
    }

    private static boolean comprimentoValido(String senha) {
        return senha != null
                && !senha.isEmpty()
                && senha.length() <= 72
                && StandardCharsets.UTF_8.newEncoder().canEncode(senha)
                && senha.getBytes(StandardCharsets.UTF_8).length <= 72;
    }

    private static Set<String> carregarLista(
            String arquivo,
            boolean exigirLista) {

        if (arquivo == null || arquivo.isBlank()) {
            if (exigirLista) {
                throw listaIndisponivel();
            }

            return Set.of();
        }

        Set<String> hashes = new HashSet<>();

        try (var reader = Files.newBufferedReader(
                Path.of(arquivo),
                StandardCharsets.UTF_8)) {

            String linha;

            while ((linha = reader.readLine()) != null) {
                String hash = linha.strip();

                if (hash.isEmpty() || hash.startsWith("#")) {
                    continue;
                }

                if (!HASH_LISTA.matcher(hash).matches()) {
                    throw listaIndisponivel();
                }

                hashes.add(hash.toLowerCase(Locale.ROOT));
            }

        } catch (IOException | InvalidPathException | SecurityException exception) {
            throw listaIndisponivel();
        }

        if (exigirLista && hashes.isEmpty()) {
            throw listaIndisponivel();
        }

        return Set.copyOf(hashes);
    }

    private static String sha256(String senha) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(senha.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(digest);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "Algoritmo de verificação indisponível."
            );
        }
    }

    private static IllegalStateException listaIndisponivel() {
        return new IllegalStateException(
                "Não foi possível carregar a lista de senhas bloqueadas."
        );
    }
}