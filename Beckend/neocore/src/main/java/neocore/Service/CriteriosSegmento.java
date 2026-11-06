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
            "empresaId",
            "cnaePrincipal",
            "porte",
            "municipioIbge",
            "situacaoCadastral"
    );

    public Map<String, Object> validar(
            Map<String, Object> criterios
    ) {
        ServiceSupport.exigir(
                criterios != null && !criterios.isEmpty(),
                "Informe ao menos um filtro."
        );

        Map<String, Object> mapa = new LinkedHashMap<>();

        for (var entrada : criterios.entrySet()) {
            String campo = entrada.getKey();

            ServiceSupport.exigir(
                    campo != null && CAMPOS.contains(campo),
                    "Filtro desconhecido: " + campo
            );

            ServiceSupport.exigir(
                    entrada.getValue() instanceof String,
                    "Filtro deve conter texto: " + campo
            );

            String valor =
                    ((String) entrada.getValue()).strip();

            ServiceSupport.exigir(
                    !valor.isEmpty(),
                    "Filtro vazio: " + campo
            );

            ServiceSupport.exigir(
                    valor.length()
                            <= (campo.equals("cidade") ? 100 : 80),
                    "Filtro excede tamanho permitido."
            );

            switch (campo) {
                case "modo" -> {
                    valor = valor.toUpperCase(Locale.ROOT);

                    ServiceSupport.exigir(
                            valor.equals("AND")
                                    || valor.equals("OR"),
                            "Modo deve ser AND ou OR."
                    );
                }

                case "uf" -> {
                    ServiceSupport.exigir(
                            valor.matches("[A-Za-z]{2}"),
                            "UF inválida."
                    );

                    valor = valor.toUpperCase(Locale.ROOT);
                }

                case "empresaId" -> {
                    try {
                        valor = UUID.fromString(valor)
                                .toString();

                    } catch (IllegalArgumentException exception) {
                        throw new RegraNegocioException(
                                "empresaId inválido."
                        );
                    }
                }

                case "cnaePrincipal", "municipioIbge" ->
                        ServiceSupport.exigir(
                                valor.matches("[0-9]{7}"),
                                campo + " deve conter sete dígitos."
                        );

                case "situacaoCadastral" -> {
                    ServiceSupport.exigir(
                            valor.matches("[0-9]{1,2}"),
                            "Situação cadastral inválida."
                    );

                    valor = Integer.toString(
                            Integer.parseInt(valor)
                    );
                }

                case "porte" ->
                        valor = valor.toUpperCase(Locale.ROOT);

                default -> {
                }
            }

            mapa.put(campo, valor);
        }

        ServiceSupport.exigir(
                mapa.keySet().stream()
                        .anyMatch(campo ->
                                !campo.equals("modo")
                        ),
                "Informe ao menos um filtro."
        );

        mapa.putIfAbsent("modo", "AND");

        return mapa;
    }

    private Predicate filtroEmpresa(
            CriteriaBuilder cb,
            From<?, Empresa> empresa,
            Map<String, Object> criterios
    ) {
        var mapa = validar(criterios);

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

            } else if (campo.equals("situacaoCadastral")) {
                filtros.add(
                        cb.equal(
                                empresa.get("situacaoCadastral"),
                                Integer.valueOf(valor)
                        )
                );

            } else {
                filtros.add(
                        cb.equal(
                                cb.lower(
                                        empresa.<String>get(campo)
                                ),
                                valor.toLowerCase(Locale.ROOT)
                        )
                );
            }
        }

        return "OR".equals(mapa.get("modo"))
                ? cb.or(
                filtros.toArray(Predicate[]::new)
        )
                : cb.and(
                filtros.toArray(Predicate[]::new)
        );
    }

    private Predicate filtro(
            CriteriaBuilder cb,
            CriteriaQuery<?> query,
            Root<Contato> contato,
            Map<String, Object> criterios,
            UUID finalidadeId
    ) {
        Join<Contato, Empresa> empresa =
                contato.join("empresa");

        Predicate combinados = filtroEmpresa(
                cb,
                empresa,
                criterios
        );

        Subquery<Integer> bloqueio =
                query.subquery(Integer.class);

        var restricao = bloqueio.from(
                RestricaoUso.class
        );

        bloqueio.select(cb.literal(1)).where(
                cb.equal(
                        restricao.get("contato").get("id"),
                        contato.get("id")
                ),

                cb.isTrue(
                        restricao.get("ativa")
                ),

                cb.or(
                        cb.isNull(
                                restricao.get("finalidade")
                        ),
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

                cb.not(
                        cb.exists(bloqueio)
                )
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
                .orderBy(
                        cb.asc(contato.get("id"))
                );

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

        return em.createQuery(query)
                .getSingleResult();
    }

    public boolean corresponde(
            Contato contato,
            Segmento segmento
    ) {
        var cb = em.getCriteriaBuilder();

        var query = cb.createQuery(Long.class);
        var root = query.from(Contato.class);

        query.select(cb.count(root)).where(
                cb.equal(
                        root.get("id"),
                        contato.getId()
                ),
                filtro(
                        cb,
                        query,
                        root,
                        segmento.getCriterios(),
                        segmento.getFinalidade().getId()
                )
        );

        return em.createQuery(query)
                .getSingleResult() > 0;
    }

    public List<Empresa> buscarEmpresas(
            Map<String, Object> criterios,
            int offset,
            int limite
    ) {
        ServiceSupport.exigir(
                offset >= 0 && limite >= 1 && limite <= 100,
                "Paginação inválida."
        );

        var cb = em.getCriteriaBuilder();

        var query = cb.createQuery(Empresa.class);
        var empresa = query.from(Empresa.class);

        query.select(empresa)
                .where(
                        filtroEmpresa(
                                cb,
                                empresa,
                                criterios
                        )
                )
                .orderBy(
                        cb.asc(empresa.get("id"))
                );

        return em.createQuery(query)
                .setFirstResult(offset)
                .setMaxResults(limite)
                .getResultList();
    }

    public long contarEmpresas(
            Map<String, Object> criterios
    ) {
        var cb = em.getCriteriaBuilder();

        var query = cb.createQuery(Long.class);
        var empresa = query.from(Empresa.class);

        query.select(cb.count(empresa))
                .where(
                        filtroEmpresa(
                                cb,
                                empresa,
                                criterios
                        )
                );

        return em.createQuery(query)
                .getSingleResult();
    }
}