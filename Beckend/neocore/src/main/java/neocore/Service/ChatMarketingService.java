package neocore.Service;

import neocore.Client.TendenciasYouTubeClient;

import neocore.DTO.ia.ChatMarketingRequest;
import neocore.DTO.ia.ChatMarketingResponse;
import neocore.DTO.ia.ChatMarketingResponse.*;

import neocore.Exception.*;

import neocore.Model.Enum.PerfilUsuario;
import neocore.Security.LimitadorRequisicoes;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.*;
import java.util.*;
import java.util.concurrent.Semaphore;
import java.util.regex.Pattern;

import static neocore.DTO.ia.OperacaoMarketingIa.*;

@Service
public class ChatMarketingService {

    private static final Pattern BLOQUEADO =
            Pattern.compile(
                    "(?i)@|https?://|www\\.|\\bBearer\\s"
                            + "|AIza|ghp_|github_pat_"
                            + "|(?<![\\p{L}\\d])"
                            + "(?:\\+?\\d[\\s()./-]*){10,}"
                            + "(?![\\p{L}\\d])"
            );

    private final ServiceSupport suporte;
    private final ChatMarketingProvider provider;
    private final TendenciasYouTubeClient youtube;
    private final LimitadorRequisicoes limites;

    private final Semaphore vagas = new Semaphore(2);

    public ChatMarketingService(

            ServiceSupport suporte,

            ChatMarketingProvider provider,

            TendenciasYouTubeClient youtube,

            LimitadorRequisicoes limites

    ) {
        this.suporte = suporte;
        this.provider = provider;
        this.youtube = youtube;
        this.limites = limites;
    }

    @Transactional(
            propagation = Propagation.NOT_SUPPORTED
    )
    public ChatMarketingResponse responder(
            ChatMarketingRequest request
    ) {
        var usuario = suporte.atual();

        if (usuario.getPerfil()
                != PerfilUsuario.ADMINISTRADOR

                && usuario.getPerfil()
                != PerfilUsuario.ANALISTA) {

            throw new AcessoNegadoException(
                    "Acesso não permitido ao chat."
            );
        }

        suporte.validar(request);

        String dados = limpar(
                request.dadosPublicos()
        );

        seguro(request.pergunta());
        seguro(dados);
        seguro(limpar(request.tema()));

        if (!dados.isBlank()) {
            ServiceSupport.exigir(
                    request.finalidadeId() != null,
                    "Informe a finalidade habilitada "
                            + "para usar dados do sistema."
            );

            var finalidade = suporte.finalidade(
                    request.finalidadeId()
            );

            ServiceSupport.exigir(
                    finalidade.getRetencaoDias() != null
                            && finalidade.getRetencaoDias() > 0,

                    "A finalidade precisa de retenção positiva."
            );
        }

        var referencias = request.referencias() == null
                ? List.<ChatMarketingRequest.Referencia>of()
                : request.referencias();

        ServiceSupport.exigir(
                request.operacao() != RESUMIR
                        || !dados.isBlank()
                        || !referencias.isEmpty(),

                "Envie dados agregados ou referências "
                        + "públicas para resumir."
        );

        boolean tendencia = request.operacao()
                == ANALISAR_TENDENCIAS;

        ServiceSupport.exigir(
                !tendencia
                        || !limpar(request.tema()).isBlank()
                        || !referencias.isEmpty(),

                "Informe um tema ou referências "
                        + "para analisar tendências."
        );

        if (!limites.permitir(
                "ia:usuario:" + usuario.getId(),
                5
        )
                || !limites.permitir(
                "ia:global",
                10
        )) {
            throw new IntegracaoExternaException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Limite do chat atingido. "
                            + "Aguarde um minuto."
            );
        }

        if (!vagas.tryAcquire()) {
            throw new IntegracaoExternaException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Chat ocupado. "
                            + "Tente novamente em instantes."
            );
        }

        try {
            var agora = OffsetDateTime.now(
                    ZoneOffset.UTC
            );

            int dias = request.dias() == null
                    ? 30
                    : request.dias();

            var inicio = agora.minusDays(dias);

            String regiao = request.regiao() == null
                    ? "GLOBAL"
                    : request.regiao();

            String recorte = tendencia
                    ? "Publicações entre "
                    + inicio
                    + " e "
                    + agora
                    + "; região solicitada: "
                    + regiao

                    : "Somente dados e referências desta "
                    + "requisição; sem busca na web.";

            List<Fonte> fontes = new ArrayList<>();

            List<ChatMarketingProvider.Evidencia> evidencias =
                    new ArrayList<>();

            for (var referencia : referencias) {
                seguro(referencia.titulo());
                seguro(referencia.trechoPublico());

                validarUrl(referencia.url());

                ServiceSupport.exigir(
                        !referencia.publicadoEm().isAfter(agora),
                        "Uma referência tem data futura."
                );

                ServiceSupport.exigir(
                        !tendencia
                                || !referencia.publicadoEm()
                                .isBefore(inicio),

                        "A referência está fora do período "
                                + "solicitado para tendências."
                );

                adicionar(
                        fontes,
                        evidencias,
                        "USUARIO_NAO_VERIFICADA",
                        referencia.titulo(),
                        referencia.url(),
                        referencia.publicadoEm(),
                        referencia.trechoPublico()
                );
            }

            if (tendencia
                    && !limpar(request.tema()).isBlank()) {

                var videos = youtube.buscar(
                        request.tema().strip(),
                        regiao,
                        inicio,
                        agora
                );

                for (var video : videos) {
                    // Descarta alguns formatos de contatos.
                    // Este filtro não comprova anonimização.
                    if (!BLOQUEADO
                            .matcher(video.titulo())
                            .find()) {

                        adicionar(
                                fontes,
                                evidencias,
                                "YOUTUBE_API",
                                video.titulo(),
                                video.url(),
                                video.publicadoEm(),

                                "Apenas título e data; conteúdo "
                                        + "do vídeo não foi assistido "
                                        + "ou transcrito."
                        );
                    }
                }
            }

            ServiceSupport.exigir(
                    !tendencia || !fontes.isEmpty(),
                    "Nenhuma referência recente foi encontrada. "
                            + "Ajuste o tema ou o período."
            );

            var entrada =
                    new ChatMarketingProvider.Entrada(
                            request.operacao(),
                            request.pergunta().strip(),
                            dados,
                            recorte,
                            List.copyOf(evidencias)
                    );

            var conteudo = provider.gerar(entrada);

            validarSaida(
                    request,
                    conteudo,
                    fontes
            );

            return new ChatMarketingResponse(
                    request.operacao(),
                    conteudo,
                    List.copyOf(fontes),
                    recorte,
                    Instant.now(),

                    List.of(
                            "Conteúdo gerado por IA: "
                                    + "revise antes de usar ou publicar.",

                            "Cada mensagem é independente; "
                                    + "o histórico não é enviado ao modelo.",

                            "Os dados informados pela equipe "
                                    + "e suas referências não foram "
                                    + "verificados automaticamente.",

                            "A busca do YouTube é uma amostra "
                                    + "de publicações, não mede crescimento "
                                    + "de interesse, intenção de compra "
                                    + "ou tendência mundial.",

                            "Nenhuma campanha é disparada automaticamente."
                    )
            );

        } finally {
            vagas.release();
        }
    }

    private void validarSaida(

            ChatMarketingRequest request,

            Conteudo conteudo,

            List<Fonte> fontes

    ) {
        try {
            suporte.validar(conteudo);

            if (
                    (
                            request.operacao()
                                    == PROPOR_CAMPANHA
                    )
                            != (
                            conteudo.campanha() != null
                    )
            ) {
                throw new RegraNegocioException(
                        "Campanha incompatível com a operação."
                );
            }

            if (
                    (
                            request.operacao()
                                    == ANALISAR_TENDENCIAS
                    )
                            != (
                            !conteudo.tendencias().isEmpty()
                    )
            ) {
                throw new RegraNegocioException(
                        "Tendências incompatíveis com a operação."
                );
            }

            Set<String> permitidas = new HashSet<>();

            fontes.forEach(
                    fonte -> permitidas.add(fonte.id())
            );

            for (var tendencia : conteudo.tendencias()) {
                ServiceSupport.exigir(
                        permitidas.containsAll(
                                tendencia.fontesIds()
                        ),
                        "A IA citou uma referência inexistente."
                );
            }

        } catch (
                jakarta.validation.ConstraintViolationException
                | RegraNegocioException exception
        ) {
            throw new IntegracaoExternaException(
                    HttpStatus.BAD_GATEWAY,
                    "A IA devolveu uma resposta fora "
                            + "do formato esperado. Tente novamente."
            );
        }
    }

    private static void adicionar(

            List<Fonte> fontes,

            List<ChatMarketingProvider.Evidencia> evidencias,

            String origem,

            String titulo,

            String url,

            OffsetDateTime data,

            String trecho

    ) {
        if (fontes.stream().anyMatch(
                fonte -> fonte.url().equals(url)
        )) {
            return;
        }

        String id = "F" + (fontes.size() + 1);

        fontes.add(
                new Fonte(
                        id,
                        origem,
                        titulo,
                        url,
                        data
                )
        );

        evidencias.add(
                new ChatMarketingProvider.Evidencia(
                        id,
                        origem,
                        titulo,
                        trecho,
                        data
                )
        );
    }

    private static String limpar(String valor) {
        return valor == null
                ? ""
                : valor.strip();
    }

    private static void seguro(String texto) {
        ServiceSupport.exigir(
                !BLOQUEADO.matcher(texto).find(),

                "Retire dados pessoais, contatos, documentos, "
                        + "links e credenciais do texto. "
                        + "Use o campo de referências "
                        + "para links públicos."
        );
    }

    private static void validarUrl(String texto) {
        try {
            URI uri = URI.create(texto);

            ServiceSupport.exigir(
                    "https".equalsIgnoreCase(
                            uri.getScheme()
                    )
                            && uri.getHost() != null
                            && uri.getRawUserInfo() == null,

                    "A referência precisa de uma URL HTTPS "
                            + "válida, sem usuário ou senha."
            );

        } catch (IllegalArgumentException exception) {
            throw new RegraNegocioException(
                    "URL de referência inválida."
            );
        }
    }
}