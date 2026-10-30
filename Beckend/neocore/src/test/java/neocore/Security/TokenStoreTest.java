package neocore.Security;

import neocore.Exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TokenStoreTest {

    private final Relogio clock = new Relogio();
    private final TokenStore store = new TokenStore(clock);
    private final UUID usuario = UUID.randomUUID();

    @Test
    void tokenReservadoNaoAutenticaAntesDoCommit() {
        try (var tx = new Transacao()) {
            String token = store.criar(usuario, 3, false);
            assertEquals(32, Base64.getUrlDecoder().decode(token).length);
            assertThrows(BadCredentialsException.class, () -> store.obter(token, false));
            tx.commit();
            assertEquals(usuario, store.obter(token, false).usuarioId);
            assertEquals(3, store.obter(token, false).versao);
        }
    }

    @Test
    void rollbackDescartaReservaELiberaCapacidade() {
        var reservados = new ArrayList<String>();
        try (var tx = new Transacao()) {
            for (int i = 0; i < 10; i++) {
                reservados.add(store.criar(usuario, 0, false));
            }
            tx.rollback();
        }
        for (String token : reservados) {
            assertThrows(BadCredentialsException.class, () -> store.obter(token, false));
        }
        for (int i = 0; i < 10; i++) {
            String token = store.criar(usuario, 0, false);
            assertEquals(usuario, store.obter(token, false).usuarioId);
        }
    }

    @Test
    void revogacaoAntesDaCriacaoNaoRemoveNovoAcessoAposCommit() {
        String antigo = store.criar(usuario, 0, false);
        try (var tx = new Transacao()) {
            store.revogar(usuario);
            String novo = store.criar(usuario, 1, false);
            assertEquals(0, store.obter(antigo, false).versao);
            assertThrows(BadCredentialsException.class, () -> store.obter(novo, false));
            tx.commit();
            assertThrows(BadCredentialsException.class, () -> store.obter(antigo, false));
            assertEquals(1, store.obter(novo, false).versao);
        }
    }

    @Test
    void rollbackNaoExecutaRevogacaoNemLogoutPendentes() {
        String primeiro = store.criar(usuario, 0, false);
        String segundo = store.criar(usuario, 0, false);
        try (var tx = new Transacao()) {
            store.remover(primeiro);
            store.revogar(usuario);
            tx.rollback();
        }
        assertEquals(usuario, store.obter(primeiro, false).usuarioId);
        assertEquals(usuario, store.obter(segundo, false).usuarioId);
    }

    @Test
    void logoutSemTransacaoInvalidaImediatamente() {
        String token = store.criar(usuario, 0, false);
        store.remover(token);
        assertThrows(BadCredentialsException.class, () -> store.obter(token, false));
    }

    @Test
    void desafiosNaoValemComoAcessoEExpiramAntesDaSessao() {
        String acesso = store.criar(usuario, 0, false);
        String desafio = store.criar(usuario, 0, true);
        assertThrows(BadCredentialsException.class, () -> store.obter(desafio, false));
        assertThrows(BadCredentialsException.class, () -> store.obter(acesso, true));
        clock.avancar(Duration.ofMinutes(5));
        assertThrows(BadCredentialsException.class, () -> store.obter(desafio, true));
        assertEquals(usuario, store.obter(acesso, false).usuarioId);
        clock.avancar(Duration.ofMinutes(10));
        assertThrows(BadCredentialsException.class, () -> store.obter(acesso, false));
    }

    @Test
    void limitePorUsuarioNaoRevogaSessoesAnteriores() {
        List<String> tokens = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            tokens.add(store.criar(usuario, 0, false));
        }
        assertThrows(RegraNegocioException.class, () -> store.criar(usuario, 0, true));
        tokens.forEach(token -> assertEquals(usuario, store.obter(token, false).usuarioId));
        clock.avancar(Duration.ofMinutes(15));
        String novo = store.criar(usuario, 0, false);
        assertEquals(usuario, store.obter(novo, false).usuarioId);
    }

    @Test
    void desafiosReservamUmaVagaParaConcluirMfaComRevogacaoTransacional() {
        List<String> desafios = new ArrayList<>();
        for (int i = 0; i < 9; i++) {
            desafios.add(store.criar(usuario, 0, true));
        }
        assertThrows(RegraNegocioException.class, () -> store.criar(usuario, 0, true));

        try (var tx = new Transacao()) {
            store.revogar(usuario);
            String acesso = store.criar(usuario, 1, false);
            assertThrows(BadCredentialsException.class, () -> store.obter(acesso, false));
            tx.commit();

            assertEquals(1, store.obter(acesso, false).versao);
            desafios.forEach(token -> assertThrows(
                    BadCredentialsException.class, () -> store.obter(token, true)));
        }
    }

    @Test
    void limiteGlobalPreservaSessoesESeRecuperaDepoisDaExpiracao() {
        String primeiro = null;
        for (int i = 0; i < 1000; i++) {
            UUID id = UUID.randomUUID();
            for (int j = 0; j < 10; j++) {
                String token = store.criar(id, 0, false);
                if (primeiro == null) primeiro = token;
            }
        }
        assertThrows(RegraNegocioException.class,
                () -> store.criar(UUID.randomUUID(), 0, false));
        assertNotNull(store.obter(primeiro, false));
        clock.avancar(Duration.ofMinutes(15));
        assertNotNull(store.obter(store.criar(usuario, 0, false), false));
    }

    @Test
    void tentativaExcedidaPermaneceBloqueadaMesmoAposRollback() {
        String desafio = store.criar(usuario, 0, true);
        for (int i = 0; i < 5; i++) store.tentativa(desafio);
        try (var tx = new Transacao()) {
            assertThrows(BadCredentialsException.class, () -> store.tentativa(desafio));
            tx.rollback();
        }
        assertThrows(BadCredentialsException.class, () -> store.obter(desafio, true));
    }

    @Test
    void segredoPendenteSoPodeSerAcessadoPorDesafioValido() {
        String desafio = store.criar(usuario, 0, true);
        String acesso = store.criar(usuario, 0, false);
        store.pendente(desafio, "cifrado-teste");
        assertEquals("cifrado-teste", store.pendente(desafio));
        assertThrows(BadCredentialsException.class, () -> store.pendente(acesso));
        assertThrows(BadCredentialsException.class, () -> TokenStore.hash(null));
        assertThrows(BadCredentialsException.class, () -> TokenStore.hash("x".repeat(1025)));
        assertEquals(64, TokenStore.hash(TokenStore.aleatorio()).length());
    }

    private static final class Relogio extends Clock {
        private Instant atual = Instant.parse("2026-10-28T12:00:00Z");

        void avancar(Duration tempo) { atual = atual.plus(tempo); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return Clock.fixed(atual, zone); }
        @Override public Instant instant() { return atual; }
    }

    private static final class Transacao implements AutoCloseable {
        private boolean concluida;

        Transacao() {
            assertFalse(TransactionSynchronizationManager.isSynchronizationActive());
            TransactionSynchronizationManager.initSynchronization();
            TransactionSynchronizationManager.setActualTransactionActive(true);
        }

        void commit() {
            var callbacks = TransactionSynchronizationManager.getSynchronizations();
            callbacks.forEach(TransactionSynchronization::afterCommit);
            callbacks.forEach(c -> c.afterCompletion(TransactionSynchronization.STATUS_COMMITTED));
            concluida = true;
        }

        void rollback() {
            TransactionSynchronizationManager.getSynchronizations().forEach(
                    c -> c.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
            concluida = true;
        }

        @Override
        public void close() {
            if (!concluida) rollback();
            TransactionSynchronizationManager.clear();
        }
    }
}
