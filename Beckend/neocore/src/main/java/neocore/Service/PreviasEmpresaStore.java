package neocore.Service;

import neocore.DTO.enriquecimento.*;
import neocore.Exception.ConflitoException;
import neocore.Exception.RecursoNaoEncontradoException;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.*;

@Component
public class PreviasEmpresaStore {

    private final Clock relogio;

    private final Map<UUID, Entrada> entradas =
            new HashMap<>();

    public PreviasEmpresaStore() {
        this(Clock.systemUTC());
    }

    PreviasEmpresaStore(Clock relogio) {
        this.relogio = relogio;
    }

    public record Contexto(
            UUID usuarioId,
            UUID empresaId,
            long versao,
            String cnpj,
            Map<CampoEnriquecimentoEmpresa, String> valores,
            EnriquecimentoPreviaRequest request
    ) {
        public Contexto {
            valores = Map.copyOf(valores);
        }
    }

    public record Dados(
            Contexto contexto,
            EnriquecimentoPreviaResponse resposta,
            Map<CampoEnriquecimentoEmpresa, String> valoresConsultados
    ) {
        public Dados {
            valoresConsultados =
                    Map.copyOf(valoresConsultados);
        }
    }

    private static class Entrada {

        final Dados dados;
        boolean reservada;

        Entrada(Dados dados) {
            this.dados = dados;
        }
    }

    public synchronized EnriquecimentoPreviaResponse guardar(
            Contexto contexto,
            List<CampoEnriquecimentoResponse> campos,
            List<String> avisos
    ) {
        Instant agora = relogio.instant();

        entradas.values().removeIf(entrada ->
                !entrada.reservada
                        && !entrada.dados.resposta()
                        .expiraEm().isAfter(agora)
        );

        long quantidade = entradas.values()
                .stream()
                .filter(entrada ->
                        entrada.dados.contexto()
                                .usuarioId()
                                .equals(contexto.usuarioId())
                )
                .count();

        if (quantidade >= 5 || entradas.size() >= 1000) {
            throw new ConflitoException(
                    "Limite de prévias; confirme uma "
                            + "ou aguarde cinco minutos."
            );
        }

        UUID id = UUID.randomUUID();

        var valoresConsultados =
                new EnumMap<CampoEnriquecimentoEmpresa, String>(
                        CampoEnriquecimentoEmpresa.class
                );

        campos.forEach(campo ->
                valoresConsultados.put(
                        campo.campo(),
                        campo.sugerido()
                )
        );

        var alterados = campos.stream()
                .filter(campo ->
                        !Objects.equals(
                                campo.atual(),
                                campo.sugerido()
                        )
                )
                .toList();

        var resposta = new EnriquecimentoPreviaResponse(
                id,
                contexto.empresaId(),
                contexto.versao(),
                agora.plusSeconds(300),
                alterados,
                List.copyOf(avisos)
        );

        entradas.put(
                id,
                new Entrada(
                        new Dados(
                                contexto,
                                resposta,
                                valoresConsultados
                        )
                )
        );

        return resposta;
    }

    public synchronized Dados reservar(
            UUID id,
            UUID usuarioId,
            UUID empresaId
    ) {
        Entrada entrada = entradas.get(id);

        if (entrada == null
                || !entrada.dados.contexto()
                .usuarioId().equals(usuarioId)
                || !entrada.dados.contexto()
                .empresaId().equals(empresaId)) {

            throw new RecursoNaoEncontradoException(
                    "Prévia não encontrada."
            );
        }

        if (!entrada.dados.resposta()
                .expiraEm().isAfter(relogio.instant())) {

            if (!entrada.reservada) {
                entradas.remove(id);
            }

            throw new ConflitoException(
                    "Prévia expirada. Consulte novamente."
            );
        }

        if (entrada.reservada) {
            throw new ConflitoException(
                    "Prévia já está sendo confirmada."
            );
        }

        entrada.reservada = true;

        return entrada.dados;
    }

    public synchronized void concluir(UUID id) {
        entradas.remove(id);
    }

    public synchronized void liberar(UUID id) {
        Entrada entrada = entradas.get(id);

        if (entrada != null) {
            entrada.reservada = false;
        }
    }
}