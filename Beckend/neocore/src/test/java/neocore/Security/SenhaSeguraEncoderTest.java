package neocore.Security;

import neocore.Exception.RegraNegocioException;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

class SenhaSeguraEncoderTest {

    @Test
    void bcryptUsaCusto12SaltNovoEConfereSenha() {
        var encoder = new SenhaSeguraEncoder("", false);
        String senha = "Minha frase de acesso 123";

        String primeiro = encoder.encode(senha);
        String segundo = encoder.encode(senha);

        assertTrue(primeiro.startsWith("$2a$12$"));
        assertNotEquals(primeiro, segundo);
        assertTrue(encoder.matches(senha, primeiro));
        assertTrue(encoder.matches(senha, segundo));
        assertFalse(encoder.matches("Outra frase de acesso 456", primeiro));
    }

    @Test
    void politicaContaCaracteresEBytesUtf8SemTruncar() {
        var encoder = new SenhaSeguraEncoder("", false);

        assertThrows(RegraNegocioException.class, () -> encoder.encode("a".repeat(11)));
        assertThrows(RegraNegocioException.class, () -> encoder.encode(" ".repeat(12)));
        assertThrows(RegraNegocioException.class, () -> encoder.encode("a".repeat(73)));
        assertThrows(RegraNegocioException.class, () -> encoder.encode("á".repeat(37)));
        assertThrows(RegraNegocioException.class, () -> encoder.encode("😀".repeat(11)));
        assertThrows(RegraNegocioException.class, () -> encoder.encode("\uD800".repeat(12)));

        String limiteUtf8 = "á".repeat(36);
        assertTrue(encoder.matches(limiteUtf8, encoder.encode(limiteUtf8)));
        String dozeCodePoints = "😀".repeat(12);
        assertTrue(encoder.matches(dozeCodePoints, encoder.encode(dozeCodePoints)));
    }

    @Test
    void listaOfflineComHashesBloqueiaSenhaPreservandoMaiusculas() throws Exception {
        String senha = "SenhaVazada123!";
        String hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(senha.getBytes(StandardCharsets.UTF_8)));
        Path lista = Files.createTempFile("neocore-senhas-teste-", ".txt");
        try {
            Files.writeString(lista, "# SHA-256 UTF-8\n\n" + hash.toUpperCase() + "\n");
            var encoder = new SenhaSeguraEncoder(lista.toString(), true);

            assertThrows(RegraNegocioException.class, () -> encoder.encode(senha));
            assertDoesNotThrow(() -> encoder.encode("senhaVazada123!"));
        } finally {
            Files.deleteIfExists(lista);
        }
    }

    @Test
    void listaObrigatoriaAusenteVaziaOuInvalidaInterrompeInicializacao() throws Exception {
        assertThrows(IllegalStateException.class, () -> new SenhaSeguraEncoder("", true));
        assertThrows(IllegalStateException.class, () -> new SenhaSeguraEncoder(null, true));

        Path lista = Files.createTempFile("neocore-lista-teste-", ".txt");
        try {
            assertThrows(IllegalStateException.class,
                    () -> new SenhaSeguraEncoder(lista.toString(), true));
            Files.writeString(lista, "# somente comentario\n\n");
            assertThrows(IllegalStateException.class,
                    () -> new SenhaSeguraEncoder(lista.toString(), true));
            Files.writeString(lista, "isto-nao-e-um-hash\n");
            assertThrows(IllegalStateException.class,
                    () -> new SenhaSeguraEncoder(lista.toString(), false));
        } finally {
            Files.deleteIfExists(lista);
        }
        assertThrows(IllegalStateException.class,
                () -> new SenhaSeguraEncoder(lista.toString(), true));
    }

    @Test
    void matchesLegadoNaoAplicaMinimoNovoEUpgradeReconheceCustoAntigo() {
        var encoder = new SenhaSeguraEncoder("", false);
        String legado = new BCryptPasswordEncoder(4).encode("curta");

        assertTrue(encoder.matches("curta", legado));
        assertTrue(encoder.upgradeEncoding(legado));
        assertFalse(encoder.upgradeEncoding(encoder.encode("Uma senha nova 123")));
    }

    @Test
    void matchesRejeitaEntradasInvalidasSemExporSenha() {
        var encoder = new SenhaSeguraEncoder("", false);
        String legado = new BCryptPasswordEncoder(4).encode("curta");

        assertFalse(encoder.matches(null, legado));
        assertFalse(encoder.matches("", legado));
        assertFalse(encoder.matches("á".repeat(37), legado));
        assertFalse(encoder.matches("a".repeat(73), legado));
        assertFalse(encoder.matches("curta", null));
        assertFalse(encoder.matches("curta", "senha-em-texto"));
        assertFalse(encoder.matches("curta", "$2a$99$" + "a".repeat(53)));
        assertFalse(encoder.matches("\uD800", legado));
    }
}
