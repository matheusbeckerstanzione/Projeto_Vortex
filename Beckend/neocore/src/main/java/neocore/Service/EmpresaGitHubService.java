package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.Client.GitHubClient;
import neocore.DTO.github.*;
import neocore.DTO.sinais.SinaisGitHubResponse;
import neocore.Exception.*;
import neocore.Model.*;
import neocore.Model.Enum.ResultadoAuditoria;
import neocore.Repository.EmpresaGitHubRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.NEVER)
public class EmpresaGitHubService {

    private final EmpresaGitHubRepository repository;
    private final GitHubClient client;
    private final SinaisGitHubService sinais;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;
    private final PlatformTransactionManager transactionManager;

    private static final Duration VALIDADE =
            Duration.ofHours(24);

    public EmpresaGitHubResponse vincular(
            UUID empresaId,
            EmpresaGitHubVinculoRequest request
    ) {
        suporte.validar(request);

        String login = request.organizacao()
                .strip()
                .toLowerCase(Locale.ROOT);

        ServiceSupport.exigir(
                login.matches(
                        "[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?"
                ) && !login.contains("--"),
                "Informe o login da organização, sem a URL."
        );

        String referencia = referenciaHttps(
                request.referenciaVinculo()
        );

        String justificativa =
                request.justificativaVinculo().strip();

        ServiceSupport.exigir(
                justificativa.length() >= 20,
                "Explique como o vínculo foi conferido, "
                        + "com ao menos 20 caracteres."
        );

        transacao(true, () -> {
            suporte.admin();

            suporte.obter(Empresa.class, empresaId);

            conferirVersao(
                    repository.findById(empresaId).orElse(null),
                    request.versaoEsperada()
            );

            return true;
        });

        // Consulta externa sem manter uma transação
        // ou conexão do banco aberta.
        var organizacao = client.organizacao(login);

        return transacao(false, () -> {
            Usuario autor = suporte.admin();

            Empresa empresa = suporte.bloquear(
                    Empresa.class,
                    empresaId
            );

            EmpresaGitHub vinculo = repository
                    .findById(empresaId)
                    .orElse(null);

            conferirVersao(
                    vinculo,
                    request.versaoEsperada()
            );

            if (vinculo == null) {
                vinculo = new EmpresaGitHub();
                vinculo.setEmpresa(empresa);
            }

            vinculo.setOrganizacaoId(organizacao.id());

            vinculo.setOrganizacao(
                    organizacao.login()
                            .toLowerCase(Locale.ROOT)
            );

            vinculo.setReferenciaVinculo(referencia);

            vinculo.setJustificativaVinculo(
                    justificativa
            );

            vinculo.setConfirmadoPor(autor);
            vinculo.setConfirmadoEm(Instant.now());
            vinculo.setAtivo(true);

            limparAmostra(vinculo);

            var salvo = repository.saveAndFlush(vinculo);

            auditoria.registrar(
                    autor,
                    "VINCULAR_GITHUB",
                    "Empresa",
                    empresaId,
                    ResultadoAuditoria.SUCESSO
            );

            return resposta(salvo);
        });
    }

    public EmpresaGitHubResponse coletar(
            UUID empresaId,
            EmpresaGitHubColetaRequest request
    ) {
        suporte.validar(request);

        Contexto contexto = transacao(true, () -> {
            suporte.atual();

            var vinculo = obter(empresaId);

            exigirAtivo(vinculo);

            conferirVersao(
                    vinculo,
                    request.versaoEsperada()
            );

            return new Contexto(
                    vinculo.getOrganizacaoId(),
                    vinculo.getOrganizacao()
            );
        });

        // Primeira página: até 20 repositórios.
        // Reutiliza o cache do serviço existente.
        SinaisGitHubResponse amostra = sinais.consultar(
                contexto.login(),
                1
        );

        if (!Objects.equals(
                contexto.organizacaoId(),
                amostra.organizacaoId()
        )) {
            throw new ConflitoException(
                    "A identidade da organização mudou. "
                            + "Confira e confirme o vínculo novamente."
            );
        }

        Instant agora = Instant.now();

        if (amostra.consultadoEm() == null
                || amostra.consultadoEm()
                .isAfter(agora.plusSeconds(60))
                || !amostra.consultadoEm()
                .plus(VALIDADE)
                .isAfter(agora)) {

            throw new ConflitoException(
                    "A amostra está vencida. Consulte novamente."
            );
        }

        return transacao(false, () -> {
            Usuario autor = suporte.atual();

            suporte.bloquear(Empresa.class, empresaId);

            var vinculo = obter(empresaId);

            exigirAtivo(vinculo);

            conferirVersao(
                    vinculo,
                    request.versaoEsperada()
            );

            vinculo.setAmostra(amostra);

            vinculo.setConsultadoEm(
                    amostra.consultadoEm()
            );

            vinculo.setValidoAte(
                    amostra.consultadoEm().plus(VALIDADE)
            );

            vinculo.getLinguagens().clear();

            for (var repositorio : amostra.repositorios()) {
                String linguagem =
                        repositorio.linguagemPrincipal();

                if (!repositorio.fork()
                        && !repositorio.arquivado()
                        && linguagem != null
                        && !linguagem.isBlank()
                        && linguagem.strip().length() <= 100) {

                    vinculo.getLinguagens().add(
                            linguagem.strip()
                                    .toLowerCase(Locale.ROOT)
                    );
                }
            }

            var salvo = repository.saveAndFlush(vinculo);

            auditoria.registrar(
                    autor,
                    "COLETAR_SINAIS_GITHUB",
                    "Empresa",
                    empresaId,
                    ResultadoAuditoria.SUCESSO
            );

            return resposta(salvo);
        });
    }

    public EmpresaGitHubResponse buscar(UUID empresaId) {
        return transacao(true, () -> {
            suporte.atual();

            suporte.obter(Empresa.class, empresaId);

            return resposta(obter(empresaId));
        });
    }

    public EmpresaGitHubResponse revogar(
            UUID empresaId,
            Long versaoEsperada
    ) {
        ServiceSupport.exigir(
                versaoEsperada != null
                        && versaoEsperada >= 0,
                "Informe a versão atual do vínculo."
        );

        return transacao(false, () -> {
            Usuario autor = suporte.admin();

            suporte.bloquear(Empresa.class, empresaId);

            var vinculo = obter(empresaId);

            exigirAtivo(vinculo);

            conferirVersao(vinculo, versaoEsperada);

            vinculo.setAtivo(false);

            limparAmostra(vinculo);

            var salvo = repository.saveAndFlush(vinculo);

            auditoria.registrar(
                    autor,
                    "REVOGAR_VINCULO_GITHUB",
                    "Empresa",
                    empresaId,
                    ResultadoAuditoria.SUCESSO
            );

            return resposta(salvo);
        });
    }

    private EmpresaGitHub obter(UUID empresaId) {
        return repository.findById(empresaId)
                .orElseThrow(() ->
                        new RecursoNaoEncontradoException(
                                "Vínculo GitHub não encontrado."
                        )
                );
    }

    private static void conferirVersao(
            EmpresaGitHub vinculo,
            Long esperada
    ) {
        if (vinculo == null
                ? esperada != null
                : esperada == null
                || !Objects.equals(
                vinculo.getVersao(),
                esperada
        )) {

            throw new ConflitoException(
                    "O vínculo mudou. Consulte a versão atual "
                            + "antes de continuar."
            );
        }
    }

    private static void exigirAtivo(
            EmpresaGitHub vinculo
    ) {
        if (!vinculo.isAtivo()) {
            throw new ConflitoException(
                    "O vínculo GitHub foi revogado."
            );
        }
    }

    private static void limparAmostra(
            EmpresaGitHub vinculo
    ) {
        vinculo.setAmostra(null);
        vinculo.setConsultadoEm(null);
        vinculo.setValidoAte(null);
        vinculo.getLinguagens().clear();
    }

    private static String referenciaHttps(
            String valor
    ) {
        String texto = valor.strip();

        try {
            URI uri = URI.create(texto);

            if ("https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null
                    && uri.getUserInfo() == null) {

                return texto;
            }

        } catch (IllegalArgumentException ignored) {
        }

        throw new RegraNegocioException(
                "Informe uma referência válida com HTTPS."
        );
    }

    private EmpresaGitHubResponse resposta(
            EmpresaGitHub vinculo
    ) {
        String situacao = !vinculo.isAtivo()
                ? "REVOGADO"
                : vinculo.getAmostra() == null
                ? "SEM_COLETA"
                : vinculo.getValidoAte()
                .isAfter(Instant.now())
                ? "VIGENTE"
                : "EXPIRADO";

        return new EmpresaGitHubResponse(
                vinculo.getEmpresaId(),
                vinculo.getVersao(),
                vinculo.getOrganizacaoId(),
                vinculo.getOrganizacao(),
                "https://github.com/"
                        + vinculo.getOrganizacao(),
                vinculo.getReferenciaVinculo(),
                vinculo.getJustificativaVinculo(),
                vinculo.getConfirmadoPor().getId(),
                vinculo.getConfirmadoEm(),
                vinculo.isAtivo(),
                situacao,
                vinculo.getValidoAte(),
                vinculo.getAmostra()
        );
    }

    private <T> T transacao(
            boolean somenteLeitura,
            Supplier<T> operacao
    ) {
        var template = new TransactionTemplate(
                transactionManager
        );

        template.setReadOnly(somenteLeitura);

        return template.execute(
                status -> operacao.get()
        );
    }

    private record Contexto(
            Long organizacaoId,
            String login
    ) {
    }
}