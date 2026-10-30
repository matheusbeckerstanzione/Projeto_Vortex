package neocore.Service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;

import lombok.RequiredArgsConstructor;

import neocore.Exception.RegraNegocioException;
import neocore.Model.*;
import neocore.Model.Enum.*;

import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class CriteriosSegmento {

    private final EntityManager em;

    private static final Set<String> CAMPOS = Set.of(
            "modo",
            "setor",
            "cidade",
            "uf",
            "empresaId"
    );

    public Map<String, Object> validar(
            Map<String, Object> criterios
    ) {
        ServiceSupport.exigir(
                criterios != null && !criterios.isEmpty(),
                "Informe ao menos um filtro."
        );

        Map<String, Object> normalizado = new LinkedHashMap<>();

        for (var entrada : criterios.entrySet()) {
            String campo = entrada.getKey();

            ServiceSupport.exigir(
                    CAMPOS.contains(campo),
                    "Filtro desconhecido: " + campo
            );

            ServiceSupport.exigir(
                    entrada.getValue() instanceof String,
                    "Filtro deve conter texto: " + campo
            );

            String valor = ((String) entrada.getValue()).strip();

            ServiceSupport.exigir(
                    !valor.isEmpty(),
                    "Filtro vazio: " + campo
            );

            int maximo = campo.equals("cidade") ? 100 : 80;

            ServiceSupport.exigir(
                    valor.length() <= maximo,
                    "Filtro excede tamanho permitido."
            );

            if (campo.equals("modo")) {
                valor = valor.toUpperCase(Locale.ROOT);

                ServiceSupport.exigir(
                        valor.equals("AND") || valor.equals("OR"),
                        "Modo deve ser AND ou OR."
                );
            } else if (campo.equals("uf")) {
                ServiceSupport.exigir(
                        valor.matches("[A-Za-z]{2}"),
                        "UF inválida."
                );

                valor = valor.toUpperCase(Locale.ROOT);
            } else if (campo.equals("empresaId")) {
                try {
                    valor = UUID.fromString(valor).toString();
                } catch (IllegalArgumentException exception) {
                    throw new RegraNegocioException(
                            "empresaId inválido."
                    );
                }
            }

            normalizado.put(campo, valor);
        }

        ServiceSupport.exigir(
                normalizado.keySet().stream()
                        .anyMatch(chave -> !chave.equals("modo")),
                "Informe ao menos um filtro."
        );

        normalizado.putIfAbsent("modo", "AND");

        return normalizado;
    }

    private Predicate filtro(
            CriteriaBuilder cb,
            CriteriaQuery<?> query,
            Root<Contato> contato,
            Map<String, Object> criterios,
            UUID finalidadeId
    ) {
        var mapa = validar(criterios);
        var empresa = contato.join("empresa");

        List<Predicate> filtros = new ArrayList<>();

        for (var entrada : mapa.entrySet()) {
            String campo = entrada.getKey();
            String valor = (String) entrada.getValue();

            if (campo.equals("modo")) {
                continue;
            }

            if (campo.equals("empresaId")) {
                filtros.add(
                        cb.equal(
                                empresa.get("id"),
                                UUID.fromString(valor)
                        )
                );
            } else {
                filtros.add(
                        cb.equal(
                                cb.lower(empresa.get(campo)),
                                valor.toLowerCase(Locale.ROOT)
                        )
                );
            }
        }

        Predicate combinados = "OR".equals(mapa.get("modo"))
                ? cb.or(filtros.toArray(Predicate[]::new))
                : cb.and(filtros.toArray(Predicate[]::new));

        Subquery<Integer> bloqueio = query.subquery(Integer.class);
        var restricao = bloqueio.from(RestricaoUso.class);

        bloqueio.select(cb.literal(1)).where(
                cb.equal(
                        restricao.get("contato").get("id"),
                        contato.get("id")
                ),
                cb.isTrue(restricao.get("ativa")),
                cb.or(
                        cb.isNull(restricao.get("finalidade")),
                        cb.equal(
                                restricao.get("finalidade").get("id"),
                                finalidadeId
                        )
                ),
                cb.or(
                        cb.equal(
                                restricao.get("escopo"),
                                EscopoRestricao.TODOS
                        ),
                        cb.equal(
                                restricao.get("escopo"),
                                EscopoRestricao.CAMPANHA
                        )
                )
        );

        return cb.and(
                combinados,
                cb.equal(
                        contato.get("statusIdentidade"),
                        StatusIdentidade.VERIFICADA
                ),
                cb.greaterThan(
                        contato.get("revisarAte"),
                        OffsetDateTime.now()
                ),
                cb.not(cb.exists(bloqueio))
        );
    }

    public List<Contato> buscar(
            Map<String, Object> criterios,
            UUID finalidadeId,
            int offset,
            int limite
    ) {
        var cb = em.getCriteriaBuilder();
        var query = cb.createQuery(Contato.class);
        var contato = query.from(Contato.class);

        query.select(contato)
                .where(
                        filtro(
                                cb,
                                query,
                                contato,
                                criterios,
                                finalidadeId
                        )
                )
                .orderBy(cb.asc(contato.get("id")));

        return em.createQuery(query)
                .setFirstResult(offset)
                .setMaxResults(limite)
                .getResultList();
    }

    public long contar(
            Map<String, Object> criterios,
            UUID finalidadeId
    ) {
        var cb = em.getCriteriaBuilder();
        var query = cb.createQuery(Long.class);
        var contato = query.from(Contato.class);

        query.select(cb.count(contato))
                .where(
                        filtro(
                                cb,
                                query,
                                contato,
                                criterios,
                                finalidadeId
                        )
                );

        return em.createQuery(query).getSingleResult();
    }

    public boolean corresponde(
            Contato contato,
            Segmento segmento
    ) {
        var cb = em.getCriteriaBuilder();
        var query = cb.createQuery(Long.class);
        var root = query.from(Contato.class);

        query.select(cb.count(root)).where(
                cb.equal(root.get("id"), contato.getId()),
                filtro(
                        cb,
                        query,
                        root,
                        segmento.getCriterios(),
                        segmento.getFinalidade().getId()
                )
        );

        return em.createQuery(query).getSingleResult() > 0;
    }
}