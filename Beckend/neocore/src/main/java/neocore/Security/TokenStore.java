package neocore.Security;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;

@Component
public class TokenStore {

    private static final SecureRandom RANDOM = new SecureRandom();

    public static final long ACESSO_SEGUNDOS = 1800;

    private static final long DESAFIO_SEGUNDOS = 300;

    private final Map<String, Entrada> entradas = new HashMap<>();

    public static final class Entrada {

        public final UUID usuarioId;
        public final int versao;
        public final boolean desafio;
        public final Instant expira;

        private int tentativas;
        private String segredoPendente;

        Entrada(
                UUID usuarioId,
                int versao,
                boolean desafio,
                Instant expira
        ) {
            this.usuarioId = usuarioId;
            this.versao = versao;
            this.desafio = desafio;
            this.expira = expira;
        }
    }

    public synchronized String criar(
            UUID usuarioId,
            int versao,
            boolean desafio
    ) {
        entradas.entrySet().removeIf(
                entrada -> !entrada.getValue().expira
                        .isAfter(Instant.now())
        );

        if (entradas.size() >= 10000) {
            throw new IllegalStateException(
                    "Limite de sessões atingido."
            );
        }

        String token = aleatorio();

        long duracao = desafio
                ? DESAFIO_SEGUNDOS
                : ACESSO_SEGUNDOS;

        entradas.put(
                hash(token),
                new Entrada(
                        usuarioId,
                        versao,
                        desafio,
                        Instant.now().plusSeconds(duracao)
                )
        );

        return token;
    }

    public synchronized Entrada obter(
            String token,
            boolean desafio
    ) {
        Entrada entrada = entradas.get(hash(token));

        if (entrada == null
                || entrada.desafio != desafio
                || !entrada.expira.isAfter(Instant.now())) {

            throw new BadCredentialsException(
                    "Token inválido ou expirado."
            );
        }

        return entrada;
    }

    public synchronized void tentativa(String token) {
        Entrada entrada = obter(token, true);

        if (++entrada.tentativas > 5) {
            remover(token);

            throw new BadCredentialsException(
                    "Desafio expirado."
            );
        }
    }

    public synchronized void pendente(
            String token,
            String cifrado
    ) {
        obter(token, true).segredoPendente = cifrado;
    }

    public synchronized String pendente(String token) {
        return obter(token, true).segredoPendente;
    }

    public synchronized void remover(String token) {
        entradas.remove(hash(token));
    }

    public synchronized void revogar(UUID usuarioId) {
        entradas.values().removeIf(
                entrada -> entrada.usuarioId.equals(usuarioId)
        );
    }

    public static String aleatorio() {
        byte[] bytes = new byte[32];

        RANDOM.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    public static String hash(String texto) {
        if (texto == null || texto.length() > 1024) {
            throw new BadCredentialsException(
                    "Token inválido."
            );
        }

        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(texto.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}