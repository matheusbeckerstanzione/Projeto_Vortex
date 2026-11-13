package neocore.Service;

import neocore.DTO.enriquecimento.CampoEnriquecimentoEmpresa;
import neocore.DTO.integracao.BrasilApiCnpjResponse;

import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static neocore.DTO.enriquecimento.CampoEnriquecimentoEmpresa.*;

public final class ContatosEmpresaSupport {

    private static final Set<String> DDDS = Set.of(
            "11", "12", "13", "14", "15", "16", "17", "18", "19",
            "21", "22", "24", "27", "28",
            "31", "32", "33", "34", "35", "37", "38",
            "41", "42", "43", "44", "45", "46", "47", "48", "49",
            "51", "53", "54", "55",
            "61", "62", "63", "64", "65", "66", "67", "68", "69",
            "71", "73", "74", "75", "77", "79",
            "81", "82", "83", "84", "85", "86", "87", "88", "89",
            "91", "92", "93", "94", "95", "96", "97", "98", "99"
    );

    private ContatosEmpresaSupport() {
    }

    public static String email(String valor) {
        if (valor == null
                || valor.chars().anyMatch(Character::isISOControl)) {
            return null;
        }

        String texto = valor.strip();

        if (texto.length() > 254) {
            return null;
        }

        int arroba = texto.indexOf('@');

        if (arroba <= 0
                || arroba != texto.lastIndexOf('@')
                || arroba > 64) {
            return null;
        }

        String local = texto.substring(0, arroba);

        String dominio = texto.substring(arroba + 1)
                .toLowerCase(Locale.ROOT);

        if (!local.matches("[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+")
                || local.startsWith(".")
                || local.endsWith(".")
                || local.contains("..")) {
            return null;
        }

        if (!dominio.contains(".") || dominio.length() > 253) {
            return null;
        }

        for (String parte : dominio.split("\\.", -1)) {
            if (parte.length() > 63
                    || !parte.matches(
                    "[a-z0-9](?:[a-z0-9-]*[a-z0-9])?"
            )) {
                return null;
            }
        }

        return local + "@" + dominio;
    }

    public static String telefone(String valor) {
        if (valor == null
                || valor.chars().anyMatch(Character::isISOControl)) {
            return null;
        }

        valor = valor.strip();

        if (valor.length() > 40
                || !valor.matches("\\+?[0-9() .-]+")) {
            return null;
        }

        String digitos = valor.replaceAll("[^0-9]", "");

        if (digitos.length() == 12 || digitos.length() == 13) {
            if (!digitos.startsWith("55")) {
                return null;
            }

            digitos = digitos.substring(2);

        } else if (valor.startsWith("+")) {
            return null;
        }

        if (!digitos.matches(
                "[0-9]{2}(?:[2-5][0-9]{7}|9[0-9]{8})"
        ) || !DDDS.contains(digitos.substring(0, 2))) {
            return null;
        }

        return "+55" + digitos;
    }

    public static Map<CampoEnriquecimentoEmpresa, String> extrair(
            BrasilApiCnpjResponse resposta,
            List<String> avisos
    ) {
        var contatos =
                new EnumMap<CampoEnriquecimentoEmpresa, String>(
                        CampoEnriquecimentoEmpresa.class
                );

        adicionar(
                contatos,
                avisos,
                EMAIL_CONTATO,
                resposta.email(),
                email(resposta.email())
        );

        adicionar(
                contatos,
                avisos,
                TELEFONE_PRINCIPAL,
                resposta.dddTelefone1(),
                telefone(resposta.dddTelefone1())
        );

        String segundo = telefone(resposta.dddTelefone2());

        if (segundo == null
                || !segundo.equals(contatos.get(TELEFONE_PRINCIPAL))) {

            adicionar(
                    contatos,
                    avisos,
                    TELEFONE_SECUNDARIO,
                    resposta.dddTelefone2(),
                    segundo
            );
        }

        return contatos;
    }

    private static void adicionar(
            Map<CampoEnriquecimentoEmpresa, String> contatos,
            List<String> avisos,
            CampoEnriquecimentoEmpresa campo,
            String original,
            String normalizado
    ) {
        if (normalizado != null) {
            contatos.put(campo, normalizado);

        } else if (original != null && !original.isBlank()) {
            avisos.add(
                    campo
                            + " com formato inválido na BrasilAPI; "
                            + "campo ignorado."
            );
        }
    }
}