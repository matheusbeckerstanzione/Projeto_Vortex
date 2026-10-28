package neocore.Mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

final class JsonMapperSupport {

    private JsonMapperSupport() {
    }

    static Map<String, Object> copiar(Map<String, Object> origem) {
        if (origem == null) {
            return null;
        }

        Map<String, Object> copia = new LinkedHashMap<>();

        origem.forEach(
                (chave, valor) -> copia.put(chave, copiarValor(valor))
        );

        return copia;
    }

    private static Object copiarValor(Object valor) {
        if (valor instanceof Map<?, ?> mapa) {
            Map<String, Object> copia = new LinkedHashMap<>();

            mapa.forEach((chave, item) -> {
                if (!(chave instanceof String texto)) {
                    throw new IllegalArgumentException(
                            "Chaves JSON devem ser strings"
                    );
                }

                copia.put(texto, copiarValor(item));
            });

            return copia;
        }

        if (valor instanceof List<?> lista) {
            List<Object> copia = new ArrayList<>();

            lista.forEach(
                    item -> copia.add(copiarValor(item))
            );

            return copia;
        }

        return valor;
    }
}