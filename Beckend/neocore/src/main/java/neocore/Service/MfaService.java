package neocore.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import javax.crypto.*;
import javax.crypto.spec.*;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;

@Service
public class MfaService {

    private static final String ALFABETO =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final SecretKeySpec chave;

    public MfaService(
            @Value("${NEOCORE_MFA_KEY:}") String chaveBase64
    ) {
        byte[] bytes;

        try {
            bytes = Base64.getDecoder().decode(chaveBase64);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "NEOCORE_MFA_KEY deve ser Base64.",
                    exception
            );
        }

        if (bytes.length != 32) {
            throw new IllegalStateException(
                    "Configure NEOCORE_MFA_KEY com "
                            + "32 bytes aleatórios em Base64."
            );
        }

        chave = new SecretKeySpec(bytes, "AES");
    }

    public record Configuracao(
            String segredo,
            String uriOtpauth
    ) {
    }

    public Configuracao gerar(String email) {
        byte[] bytes = new byte[20];

        RANDOM.nextBytes(bytes);

        String segredo = base32(bytes);

        String rotulo = URLEncoder.encode(
                "NeoCore:" + email,
                StandardCharsets.UTF_8
        ).replace("+", "%20");

        String uri = "otpauth://totp/"
                + rotulo
                + "?secret="
                + segredo
                + "&issuer=NeoCore"
                + "&algorithm=SHA1"
                + "&digits=6"
                + "&period=30";

        return new Configuracao(segredo, uri);
    }

    public String cifrar(String segredo) {
        try {
            byte[] iv = new byte[12];

            RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");

            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    chave,
                    new GCMParameterSpec(128, iv)
            );

            byte[] dados = cipher.doFinal(
                    segredo.getBytes(StandardCharsets.UTF_8)
            );

            byte[] resultado = ByteBuffer
                    .allocate(iv.length + dados.length)
                    .put(iv)
                    .put(dados)
                    .array();

            return Base64.getEncoder().encodeToString(resultado);

        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(
                    "Falha ao proteger MFA.",
                    exception
            );
        }
    }

    private String decifrar(String texto) {
        try {
            byte[] bytes = Base64.getDecoder().decode(texto);

            if (bytes.length < 28) {
                throw new GeneralSecurityException(
                        "Conteúdo inválido."
                );
            }

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");

            cipher.init(
                    Cipher.DECRYPT_MODE,
                    chave,
                    new GCMParameterSpec(
                            128,
                            Arrays.copyOfRange(bytes, 0, 12)
                    )
            );

            byte[] segredo = cipher.doFinal(
                    Arrays.copyOfRange(bytes, 12, bytes.length)
            );

            return new String(segredo, StandardCharsets.UTF_8);

        } catch (GeneralSecurityException
                 | IllegalArgumentException exception) {

            throw new IllegalStateException(
                    "Segredo MFA ilegível.",
                    exception
            );
        }
    }

    public long validar(
            String cifrado,
            String codigo,
            long ultimoContador
    ) {
        if (codigo == null || !codigo.matches("[0-9]{6}")) {
            throw new BadCredentialsException(
                    "Código inválido."
            );
        }

        long atual = Instant.now().getEpochSecond() / 30;

        String segredo = decifrar(cifrado);

        for (long contador = atual - 1;
             contador <= atual + 1;
             contador++) {

            boolean corresponde = MessageDigest.isEqual(
                    codigo(segredo, contador)
                            .getBytes(StandardCharsets.US_ASCII),
                    codigo.getBytes(StandardCharsets.US_ASCII)
            );

            if (contador > ultimoContador && corresponde) {
                return contador;
            }
        }

        throw new BadCredentialsException(
                "Código inválido ou já utilizado."
        );
    }

    public static String codigo(String segredo, long contador) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");

            mac.init(
                    new SecretKeySpec(
                            decode32(segredo),
                            "HmacSHA1"
                    )
            );

            byte[] hash = mac.doFinal(
                    ByteBuffer.allocate(8)
                            .putLong(contador)
                            .array()
            );

            int offset = hash[hash.length - 1] & 15;

            int numero = ((hash[offset] & 127) << 24)
                    | ((hash[offset + 1] & 255) << 16)
                    | ((hash[offset + 2] & 255) << 8)
                    | (hash[offset + 3] & 255);

            return String.format(
                    Locale.ROOT,
                    "%06d",
                    numero % 1000000
            );

        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private static String base32(byte[] bytes) {
        StringBuilder resultado = new StringBuilder();

        int buffer = 0;
        int bits = 0;

        for (byte valor : bytes) {
            buffer = (buffer << 8) | (valor & 255);
            bits += 8;

            while (bits >= 5) {
                bits -= 5;

                resultado.append(
                        ALFABETO.charAt((buffer >> bits) & 31)
                );
            }
        }

        if (bits > 0) {
            resultado.append(
                    ALFABETO.charAt((buffer << (5 - bits)) & 31)
            );
        }

        return resultado.toString();
    }

    private static byte[] decode32(String segredo) {
        ByteArrayOutputStream resultado =
                new ByteArrayOutputStream();

        int buffer = 0;
        int bits = 0;

        for (char caractere : segredo.toCharArray()) {
            int valor = ALFABETO.indexOf(caractere);

            if (valor < 0) {
                throw new IllegalArgumentException(
                        "Segredo Base32 inválido."
                );
            }

            buffer = (buffer << 5) | valor;
            bits += 5;

            if (bits >= 8) {
                bits -= 8;
                resultado.write((buffer >> bits) & 255);
            }
        }

        return resultado.toByteArray();
    }
}