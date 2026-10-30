package neocore.Security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.HashMap;
import java.util.Map;

@Component
public class LimitadorRequisicoes {

    private final Clock clock;
    private final Map<String, Integer> contadores = new HashMap<>();

    private long janela = Long.MIN_VALUE;

    public LimitadorRequisicoes() {
        this(Clock.systemUTC());
    }

    LimitadorRequisicoes(Clock clock) {
        this.clock = clock;
    }

    public synchronized boolean permitir(
            String chave,
            int limite) {

        long minuto = Math.floorDiv(
                clock.instant().getEpochSecond(),
                60
        );

        if (minuto != janela) {
            contadores.clear();
            janela = minuto;
        }

        if (!contadores.containsKey(chave)
                && contadores.size() >= 10000) {

            return false;
        }

        int quantidade = contadores.getOrDefault(chave, 0);

        if (quantidade >= limite) {
            return false;
        }

        contadores.put(chave, quantidade + 1);
        return true;
    }

    public long segundosAteRenovar() {
        return 60 - Math.floorMod(
                clock.instant().getEpochSecond(),
                60
        );
    }
}