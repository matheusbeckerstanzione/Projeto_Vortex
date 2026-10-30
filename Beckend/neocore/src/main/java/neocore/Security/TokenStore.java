package neocore.Security;

import neocore.Exception.RegraNegocioException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Component
public class TokenStore {

    public static final long ACESSO_SEGUNDOS = 900;

    private static final long DESAFIO_SEGUNDOS = 300;
    private static final int LIMITE_GLOBAL = 10_000;
    private static final int LIMITE_POR_USUARIO = 10;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final Map<String, Entrada> entradas = new HashMap<>();
    private final Clock clock;

    public TokenStore() {
        this(Clock.systemUTC());
    }

    TokenStore(Clock clock) {
        this.clock = Objects.requireNonNull(clock);
    }

    public static final class Entrada {

        public final UUID usuarioId;
        public final int versao;
        public final boolean desafio;
        public final Instant expira;

        private boolean ativa;
        private int tentativas;
        private String segredoPendente;

        private Entrada(
                UUID usuarioId,
                int versao,
                boolean desafio,
                Instant expira) {

            this.usuarioId = usuarioId;
            this.versao = versao;
            this.desafio = desafio;
            this.expira = expira;
        }
    }

    public synchronized String criar(
            UUID usuarioId,
            int versao,
            boolean desafio) {

        Objects.requireNonNull(usuarioId);

        boolean transacional = possuiTransacao();
        Instant agora = clock.instant();

        entradas.values().removeIf(
                entrada -> !entrada.expira.isAfter(agora)
        );

        long quantidadeUsuario = entradas.values()
                .stream()
                .filter(entrada -> entrada.usuarioId.equals(usuarioId))
                .count();

        // Reserva uma vaga para concluir o MFA.
        int limiteUsuario = desafio
                ? LIMITE_POR_USUARIO - 1
                : LIMITE_POR_USUARIO;

        if (entradas.size() >= LIMITE_GLOBAL
                || quantidadeUsuario >= limiteUsuario) {

            throw new RegraNegocioException(
                    "Limite de sessões atingido. "
                            + "Encerre uma sessão ou aguarde sua expiração."
            );
        }

        String token = aleatorio();
        String chave = hash(token);

        Entrada entrada = new Entrada(
                usuarioId,
                versao,
                desafio,
                agora.plusSeconds(
                        desafio ? DESAFIO_SEGUNDOS : ACESSO_SEGUNDOS
                )
        );

        entrada.ativa = !transacional;
        entradas.put(chave, entrada);

        if (transacional) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {

                        @Override
                        public void afterCommit() {
                            synchronized (TokenStore.this) {
                                if (entradas.get(chave) == entrada
                                        && entrada.expira.isAfter(clock.instant())) {

                                    entrada.ativa = true;
                                }
                            }
                        }

                        @Override
                        public void afterCompletion(int status) {
                            if (status != STATUS_COMMITTED) {
                                synchronized (TokenStore.this) {
                                    entradas.remove(chave, entrada);
                                }
                            }
                        }
                    }
            );
        }

        return token;
    }

    public synchronized Entrada obter(
            String token,
            boolean desafio) {

        String chave = hash(token);
        Entrada entrada = entradas.get(chave);

        if (entrada != null
                && !entrada.expira.isAfter(clock.instant())) {

            entradas.remove(chave, entrada);
            entrada = null;
        }

        if (entrada == null
                || !entrada.ativa
                || entrada.desafio != desafio) {

            throw invalido();
        }

        return entrada;
    }

    public synchronized void tentativa(String token) {
        Entrada entrada = obter(token, true);

        if (++entrada.tentativas > 5) {
            // Continua invalidado mesmo se a operação posterior falhar.
            entradas.remove(hash(token), entrada);
            throw invalido();
        }
    }

    public synchronized void pendente(
            String token,
            String segredoCifrado) {

        obter(token, true).segredoPendente =
                Objects.requireNonNull(segredoCifrado);
    }

    public synchronized String pendente(String token) {
        return obter(token, true).segredoPendente;
    }

    public synchronized void remover(String token) {
        String chave = hash(token);
        Entrada entrada = entradas.get(chave);

        if (entrada != null) {
            depoisDoCommit(
                    () -> entradas.remove(chave, entrada)
            );
        }
    }

    public synchronized void revogar(UUID usuarioId) {
        Map<String, Entrada> anteriores = new HashMap<>();

        entradas.forEach((chave, entrada) -> {
            if (entrada.usuarioId.equals(usuarioId)) {
                anteriores.put(chave, entrada);
            }
        });

        // Não remove tokens criados depois desta chamada.
        depoisDoCommit(() ->
                anteriores.forEach(
                        (chave, entrada) -> entradas.remove(chave, entrada)
                )
        );
    }

    private void depoisDoCommit(Runnable operacao) {
        if (!possuiTransacao()) {
            operacao.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {

                    @Override
                    public void afterCommit() {
                        synchronized (TokenStore.this) {
                            operacao.run();
                        }
                    }
                }
        );
    }

    private boolean possuiTransacao() {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            return false;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException(
                    "Transação sem sincronização de sessões."
            );
        }

        return true;
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
            throw invalido();
        }

        try {
            // Hash de token aleatório, não de senha de usuário.
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(texto.getBytes(StandardCharsets.UTF_8));

            return HexFormat.of().formatHex(digest);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "Algoritmo de token indisponível.",
                    exception
            );
        }
    }

    private static BadCredentialsException invalido() {
        return new BadCredentialsException(
                "Token inválido ou expirado."
        );
    }
}