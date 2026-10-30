package neocore.Service;

import jakarta.persistence.*;
import jakarta.validation.*;
import lombok.RequiredArgsConstructor;

import neocore.Exception.*;
import neocore.Model.*;
import neocore.Model.Enum.*;

import org.springframework.data.domain.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.math.*;
import java.time.OffsetDateTime;
import java.util.*;

@Component
@RequiredArgsConstructor
public class ServiceSupport {

    private final EntityManager em;
    private final Validator validator;

    public <T> T validar(T request) {
        if (request == null) {
            throw new RegraNegocioException("Informe os dados.");
        }

        var erros = validator.validate(request);

        if (!erros.isEmpty()) {
            throw new ConstraintViolationException(erros);
        }

        return request;
    }

    public <T> T obter(Class<T> tipo, Object id) {
        if (id == null) {
            throw new RegraNegocioException("Informe o identificador.");
        }

        T entity = em.find(tipo, id);

        if (entity == null) {
            throw new RecursoNaoEncontradoException(
                    tipo.getSimpleName() + " não encontrado."
            );
        }

        return entity;
    }

    public <T> T bloquear(Class<T> tipo, Object id) {
        T entity = obter(tipo, id);

        em.refresh(entity, LockModeType.PESSIMISTIC_WRITE);

        return entity;
    }

    public Usuario atual() {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null
                || !auth.isAuthenticated()
                || !(auth.getPrincipal() instanceof UUID id)) {

            throw new AcessoNegadoException(
                    "Autenticação NeoCore necessária."
            );
        }

        Usuario usuario = obter(Usuario.class, id);

        exigir(
                usuario.getStatus() == StatusUsuario.ATIVO,
                "Usuário inativo."
        );

        return usuario;
    }

    public Usuario admin() {
        Usuario usuario = atual();

        if (usuario.getPerfil() != PerfilUsuario.ADMINISTRADOR) {
            throw new AcessoNegadoException(
                    "Somente administrador."
            );
        }

        return usuario;
    }

    public void dono(Usuario autor) {
        Usuario usuario = atual();

        if (usuario.getPerfil() != PerfilUsuario.ADMINISTRADOR
                && !usuario.getId().equals(autor.getId())) {

            throw new AcessoNegadoException(
                    "Operação não permitida para este registro."
            );
        }
    }

    public FinalidadeTratamento finalidade(UUID id) {
        var finalidade = obter(FinalidadeTratamento.class, id);

        exigir(
                Boolean.TRUE.equals(finalidade.getHabilitada()),
                "Finalidade desabilitada."
        );

        exigir(
                finalidade.getBaseLegal() != null
                        && !finalidade.getBaseLegal().isBlank(),
                "Informe a base legal da finalidade."
        );

        return finalidade;
    }

    public FonteDados fonte(UUID id) {
        var fonte = obter(FonteDados.class, id);

        exigir(
                Boolean.TRUE.equals(fonte.getHabilitada()),
                "Fonte desabilitada."
        );

        exigir(
                fonte.getAvaliadaEm() != null
                        && !fonte.getAvaliadaEm().isAfter(OffsetDateTime.now()),
                "Fonte ainda não avaliada."
        );

        exigir(
                fonte.getValidaAte() != null
                        && fonte.getValidaAte().isAfter(OffsetDateTime.now()),
                "Fonte sem validade vigente."
        );

        return fonte;
    }

    public void retencao(
            OffsetDateTime validade,
            FinalidadeTratamento finalidade
    ) {
        exigir(
                validade != null && validade.isAfter(OffsetDateTime.now()),
                "Validade deve ser futura."
        );

        exigir(
                !validade.isAfter(
                        OffsetDateTime.now()
                                .plusDays(finalidade.getRetencaoDias())
                ),
                "Validade excede a retenção da finalidade."
        );
    }

    public boolean restrito(
            UUID contatoId,
            UUID finalidadeId,
            EscopoRestricao escopo,
            CanalCampanha canal
    ) {
        var restricoes = em.createQuery(
                        """
                        select r from RestricaoUso r
                        where r.contato.id = :id
                          and r.ativa = true
                        """,
                        RestricaoUso.class
                )
                .setParameter("id", contatoId)
                .getResultList();

        return restricoes.stream().anyMatch(restricao ->
                (
                        restricao.getFinalidade() == null
                                || restricao.getFinalidade()
                                .getId().equals(finalidadeId)
                )
                        && (
                        restricao.getEscopo() == EscopoRestricao.TODOS
                                || restricao.getEscopo() == escopo
                )
                        && (
                        canal == null
                                || restricao.getCanal() == null
                                || restricao.getCanal() == canal
                )
        );
    }

    public void permitir(
            UUID contatoId,
            UUID finalidadeId,
            EscopoRestricao escopo,
            CanalCampanha canal
    ) {
        exigir(
                !restrito(contatoId, finalidadeId, escopo, canal),
                "Contato possui restrição de uso."
        );
    }

    public Pageable pagina(int pagina, int tamanho) {
        exigir(
                pagina >= 0 && tamanho >= 1 && tamanho <= 100,
                "Página inválida; tamanho entre 1 e 100."
        );

        return PageRequest.of(
                pagina,
                tamanho,
                Sort.by("id").ascending()
        );
    }

    public static void exigir(boolean condicao, String mensagem) {
        if (!condicao) {
            throw new RegraNegocioException(mensagem);
        }
    }

    public static String email(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    public static String cnpj(String cnpj) {
        return cnpj.strip()
                .toUpperCase(Locale.ROOT)
                .replace(".", "")
                .replace("/", "")
                .replace("-", "");
    }

    public static void dinheiro(BigDecimal valor) {
        if (valor == null) {
            return;
        }

        exigir(
                valor.signum() >= 0,
                "Valor monetário não pode ser negativo."
        );

        try {
            valor.setScale(2, RoundingMode.UNNECESSARY);
        } catch (ArithmeticException exception) {
            throw new RegraNegocioException(
                    "Use no máximo duas casas decimais."
            );
        }

        exigir(
                valor.compareTo(new BigDecimal("9999999999.99")) <= 0,
                "Valor monetário excede o limite."
        );
    }

    public <T> boolean duplicado(
            Class<T> tipo,
            String campo,
            String valor,
            UUID exceto
    ) {
        // Tipo e campo são constantes do código, nunca dados do frontend.
        String jpql = "select count(x) from "
                + tipo.getSimpleName()
                + " x where lower(x."
                + campo
                + ") = :valor";

        if (exceto != null) {
            jpql += " and x.id <> :id";
        }

        var query = em.createQuery(jpql, Long.class)
                .setParameter("valor", valor.toLowerCase(Locale.ROOT));

        if (exceto != null) {
            query.setParameter("id", exceto);
        }

        return query.getSingleResult() > 0;
    }
}