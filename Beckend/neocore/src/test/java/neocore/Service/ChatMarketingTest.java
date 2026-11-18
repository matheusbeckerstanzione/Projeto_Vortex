package neocore.Service;

import jakarta.persistence.EntityManager;
import jakarta.validation.Validation;
import jakarta.validation.ValidatorFactory;
import neocore.Client.TendenciasYouTubeClient;
import neocore.DTO.ia.*;
import neocore.DTO.ia.ChatMarketingResponse.*;
import neocore.DTO.integracao.YouTubeVideoResponse;
import neocore.Exception.*;
import neocore.Model.FinalidadeTratamento;
import neocore.Model.Usuario;
import neocore.Model.Enum.*;
import neocore.Security.LimitadorRequisicoes;
import org.junit.jupiter.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.time.OffsetDateTime;
import java.util.*;
import static neocore.DTO.ia.OperacaoMarketingIa.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ChatMarketingTest {
    final EntityManager em = mock(EntityManager.class);
    final ChatMarketingProvider provider = mock(ChatMarketingProvider.class);
    final TendenciasYouTubeClient youtube = mock(TendenciasYouTubeClient.class);
    final UUID finalidadeId = UUID.randomUUID();
    ValidatorFactory validadores;
    FinalidadeTratamento finalidade;
    ChatMarketingService service;

    @BeforeEach void preparar() {
        validadores = Validation.buildDefaultValidatorFactory();
        var suporte = new ServiceSupport(em, validadores.getValidator());
        service = new ChatMarketingService(suporte, provider, youtube, new LimitadorRequisicoes());
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setPerfil(PerfilUsuario.ANALISTA);
        usuario.setStatus(StatusUsuario.ATIVO);
        when(em.find(Usuario.class, usuario.getId())).thenReturn(usuario);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(usuario.getId(), null, List.of()));
        finalidade = new FinalidadeTratamento();
        finalidade.setHabilitada(true);
        finalidade.setBaseLegal("Somente fixture fictícia de teste");
        finalidade.setRetencaoDias(30);
        when(em.find(FinalidadeTratamento.class, finalidadeId)).thenReturn(finalidade);
    }

    @AfterEach void limpar() {
        SecurityContextHolder.clearContext();
        validadores.close();
    }

    @Test void resumoComDadosUsaFinalidadeENaoBuscaYoutube() {
        when(provider.gerar(any())).thenReturn(resumo());
        var resposta = service.responder(request(RESUMIR, "Segmento agregado de empresas.", finalidadeId, null, null));
        assertEquals("Resumo baseado no material recebido.", resposta.conteudo().resumo());
        verify(em).find(FinalidadeTratamento.class, finalidadeId);
        verifyNoInteractions(youtube);
        verify(provider).gerar(argThat(e -> e.dadosPublicos().equals("Segmento agregado de empresas.")));
    }

    @Test void finalidadeDesabilitadaImpedeEnvioDeDados() {
        finalidade.setHabilitada(false);
        assertThrows(RegraNegocioException.class, () -> service.responder(
                request(RESUMIR, "Dados agregados.", finalidadeId, null, null)));
        verifyNoInteractions(provider, youtube);
    }

    @Test void dadosDoSistemaExigemFinalidade() {
        assertThrows(RegraNegocioException.class, () -> service.responder(
                request(RESUMIR, "Dados agregados.", null, null, null)));
        verifyNoInteractions(provider);
    }

    @Test void resumoSemMaterialERejeitado() {
        assertThrows(RegraNegocioException.class, () -> service.responder(
                request(RESUMIR, null, null, null, null)));
    }

    @Test void campanhaGeralTemEstruturaCompleta() {
        when(provider.gerar(any())).thenReturn(new Conteudo("Proposta hipotética.", List.of(),
                new Campanha("Piloto B2B", "Avaliar mensagens", "Empresas de serviços",
                        "Organize o financeiro", List.of("Conteúdo orgânico"), List.of("Conheça uma abordagem."),
                        List.of("Taxa de conversão da página"), List.of("Validar o canal com a equipe")),
                List.of(), List.of("Sem histórico de campanhas")));
        assertNotNull(service.responder(request(PROPOR_CAMPANHA, null, null, null, null)).conteudo().campanha());
        verifyNoInteractions(youtube);
    }

    @Test void operacaoCampanhaExigeCampanhaNaResposta() {
        when(provider.gerar(any())).thenReturn(resumo());
        assertEquals(HttpStatus.BAD_GATEWAY, assertThrows(IntegracaoExternaException.class,
                () -> service.responder(request(PROPOR_CAMPANHA, null, null, null, null))).getStatus());
    }

    @Test void tendenciasBuscamFontesRecentesENaoEnviamUrlOuIdsInternosAoModelo() {
        when(youtube.buscar(eq("automação financeira"), eq("GLOBAL"), any(), any()))
                .thenReturn(List.of(new YouTubeVideoResponse("Automação financeira B2B",
                        "https://www.youtube.com/watch?v=abcdefghijk", OffsetDateTime.now().minusDays(1))));
        when(provider.gerar(any())).thenReturn(tendencias("F1"));
        var resposta = service.responder(request(ANALISAR_TENDENCIAS, null, null, "automação financeira", null));
        assertEquals(1, resposta.fontes().size());
        assertEquals("YOUTUBE_API", resposta.fontes().get(0).origem());
        var captor = org.mockito.ArgumentCaptor.forClass(ChatMarketingProvider.Entrada.class);
        verify(provider).gerar(captor.capture());
        String json = new tools.jackson.databind.ObjectMapper().writeValueAsString(captor.getValue());
        assertFalse(json.contains("https://"));
        assertFalse(json.contains("finalidadeId"));
        assertFalse(json.contains("usuarioId"));
    }

    @Test void referenciaInventadaPelaIaERejeitada() {
        when(provider.gerar(any())).thenReturn(tendencias("F999"));
        assertEquals(HttpStatus.BAD_GATEWAY, assertThrows(IntegracaoExternaException.class,
                () -> service.responder(request(ANALISAR_TENDENCIAS, null, null, null,
                        List.of(referencia(OffsetDateTime.now().minusDays(1)))))).getStatus());
    }

    @Test void referenciasPublicasPermitemTendenciasSemChaveYoutube() {
        when(provider.gerar(any())).thenReturn(tendencias("F1"));
        var resultado = service.responder(request(ANALISAR_TENDENCIAS, null, null, null,
                List.of(referencia(OffsetDateTime.now().minusDays(1)))));
        assertEquals("USUARIO_NAO_VERIFICADA", resultado.fontes().get(0).origem());
        verifyNoInteractions(youtube);
    }

    @Test void datasFuturasEReferenciasAntigasNaoSustentamTendencias() {
        for (var data : List.of(OffsetDateTime.now().plusDays(1), OffsetDateTime.now().minusDays(40))) {
            assertThrows(RegraNegocioException.class, () -> service.responder(
                    request(ANALISAR_TENDENCIAS, null, null, null, List.of(referencia(data)))));
        }
        verifyNoInteractions(provider);
    }

    @Test void rejeitaContatosEChavesAntesDasIntegracoes() {
        for (String texto : List.of("ana@example.test", "CPF 123.456.789-00", "+55 (11) 90000-0000", "Bearer segredo")) {
            assertThrows(RegraNegocioException.class, () -> service.responder(
                    request(RESUMIR, texto, finalidadeId, null, null)));
        }
        verifyNoInteractions(provider, youtube);
    }

    @Test void semLoginNaoUsaIa() {
        SecurityContextHolder.clearContext();
        assertThrows(AcessoNegadoException.class, () -> service.responder(
                request(PROPOR_CAMPANHA, null, null, null, null)));
        verifyNoInteractions(provider, youtube);
    }

    @Test void validaTamanhoOperacaoEDias() {
        var invalida = new ChatMarketingRequest(null, "x".repeat(1001), null, null,
                null, "ZZ", 100, null);
        assertThrows(jakarta.validation.ConstraintViolationException.class, () -> service.responder(invalida));
        verifyNoInteractions(provider, youtube);
    }

    @Test void sextaPerguntaRetorna429() {
        when(provider.gerar(any())).thenReturn(tendencias("F1"));
        var entrada = request(ANALISAR_TENDENCIAS, null, null, null,
                List.of(referencia(OffsetDateTime.now().minusDays(1))));
        for (int i = 0; i < 5; i++) service.responder(entrada);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, assertThrows(IntegracaoExternaException.class,
                () -> service.responder(entrada)).getStatus());
        verify(provider, times(5)).gerar(any());
    }

    private ChatMarketingRequest request(OperacaoMarketingIa op, String dados, UUID finalidade,
                                         String tema, List<ChatMarketingRequest.Referencia> referencias) {
        return new ChatMarketingRequest(op, "Ajude no planejamento de marketing B2B.", dados,
                finalidade, tema, "GLOBAL", 30, referencias);
    }
    private ChatMarketingRequest.Referencia referencia(OffsetDateTime data) {
        return new ChatMarketingRequest.Referencia("Publicação de teste", "https://example.test/artigo", data,
                "Material fictício para validar a leitura de referências.");
    }
    private Conteudo resumo() {
        return new Conteudo("Resumo baseado no material recebido.", List.of(), null, List.of(), List.of());
    }
    private Conteudo tendencias(String id) {
        return new Conteudo("Sinal temático na amostra.", List.of(), null,
                List.of(new Tendencia("Automação", "Título menciona automação", "Avaliar conteúdo educativo", List.of(id))),
                List.of("Amostra insuficiente para medir crescimento."));
    }
}
