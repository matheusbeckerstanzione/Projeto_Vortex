package neocore.Security;

import neocore.Service.MfaService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import java.time.Instant;
import java.util.Base64;
import static org.junit.jupiter.api.Assertions.*;

class MfaCriptografiaTest {
    private static final String SEGREDO = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
    private MfaService servico(byte valor) {
        byte[] chave = new byte[32];
        java.util.Arrays.fill(chave, valor);
        return new MfaService(Base64.getEncoder().encodeToString(chave));
    }
    @Test void vetorRfc4226EValidacaoImpedemReuso() {
        assertEquals("755224", MfaService.codigo(SEGREDO, 0));
        MfaService service = servico((byte) 7);
        long contador = Instant.now().getEpochSecond() / 30;
        String codigo = MfaService.codigo(SEGREDO, contador);
        String cifrado = service.cifrar(SEGREDO);
        assertEquals(contador, service.validar(cifrado, codigo, 0));
        assertThrows(BadCredentialsException.class, () -> service.validar(cifrado, codigo, contador));
    }
    @Test void GcmUsaNonceNovoERejeitaChaveDiferenteOuAdulteracao() {
        var service = servico((byte) 7);
        String cifrado = service.cifrar(SEGREDO);
        assertNotEquals(cifrado, service.cifrar(SEGREDO));
        byte[] bytes = Base64.getDecoder().decode(cifrado);
        bytes[bytes.length - 1] ^= 1;
        String adulterado = Base64.getEncoder().encodeToString(bytes);
        assertThrows(IllegalStateException.class, () -> service.validar(adulterado, "123456", 0));
        assertThrows(IllegalStateException.class, () -> servico((byte) 9).validar(cifrado, "123456", 0));
    }
    @Test void chaveInvalidaNaoInicializa() {
        assertThrows(IllegalStateException.class, () -> new MfaService(""));
        assertThrows(IllegalStateException.class, () -> new MfaService("invalida"));
    }
}
