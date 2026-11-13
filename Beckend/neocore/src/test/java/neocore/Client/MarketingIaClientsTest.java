package neocore.Client;

import neocore.DTO.ia.OperacaoMarketingIa;
import neocore.Exception.IntegracaoExternaException;
import neocore.Service.ChatMarketingProvider;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class MarketingIaClientsTest {
    @Test void geminiRecebeOperacaoEsquemaEChaveSomenteNoHeader() {
        var builder = RestClient.builder().baseUrl("https://generativelanguage.googleapis.com");
        var servidor = MockRestServiceServer.bindTo(builder).build();
        var mapper = new ObjectMapper();
        String resposta = mapper.writeValueAsString(Map.of("candidates", List.of(Map.of(
                "finishReason", "STOP", "content", Map.of("parts", List.of(
                        Map.of("thought", true, "text", "não devolver"), Map.of("text", """
                                {"resumo":"Resumo do material.","observacoes":[],"campanha":null,"tendencias":[],"limitacoes":[]}
                                """)))))));
        servidor.expect(requestTo("https://generativelanguage.googleapis.com/v1beta/models/modelo:generateContent"))
                .andExpect(header("x-goog-api-key", "chave-ficticia"))
                .andExpect(request -> {
                    String corpo = ((org.springframework.mock.http.client.MockClientHttpRequest) request).getBodyAsString();
                    assertFalse(corpo.contains("chave-ficticia"));
                    var json = mapper.readTree(corpo);
                    assertFalse(json.has("tools"));
                    assertEquals("null", json.path("generationConfig").path("responseJsonSchema")
                            .path("properties").path("campanha").path("type").asText());
                }).andRespond(withSuccess(resposta, MediaType.APPLICATION_JSON));
        var provider = new GeminiChatMarketingProvider(builder.build(), mapper, "chave-ficticia", "modelo");
        assertEquals("Resumo do material.", provider.gerar(entrada()).resumo());
        servidor.verify();
    }

    @Test void falhaDeCotaNaoRepeteChamada() {
        var builder = RestClient.builder().baseUrl("https://generativelanguage.googleapis.com");
        var servidor = MockRestServiceServer.bindTo(builder).build();
        servidor.expect(anything()).andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        var provider = new GeminiChatMarketingProvider(builder.build(), new ObjectMapper(), "ficticia", "modelo");
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(IntegracaoExternaException.class, () -> provider.gerar(entrada())).getStatus());
        servidor.verify();
    }

    @Test void saidaInterrompidaERejeitada() {
        var builder = RestClient.builder().baseUrl("https://generativelanguage.googleapis.com");
        var servidor = MockRestServiceServer.bindTo(builder).build();
        servidor.expect(anything()).andRespond(withSuccess("{\"candidates\":[{\"finishReason\":\"MAX_TOKENS\"}]}",
                MediaType.APPLICATION_JSON));
        var provider = new GeminiChatMarketingProvider(builder.build(), new ObjectMapper(), "ficticia", "modelo");
        assertEquals(HttpStatus.BAD_GATEWAY,
                assertThrows(IntegracaoExternaException.class, () -> provider.gerar(entrada())).getStatus());
    }

    @Test void youtubeUsaJanelaRealEGlobalSemFiltroDePais() {
        var builder = RestClient.builder().baseUrl("https://www.googleapis.com");
        var servidor = MockRestServiceServer.bindTo(builder).build();
        servidor.expect(request -> {
                    String url = request.getURI().toString();
                    assertTrue(url.contains("publishedAfter="));
                    assertTrue(url.contains("publishedBefore="));
                    assertTrue(url.contains("order=date"));
                    assertTrue(url.contains("q=automacao%20financeira"));
                    assertFalse(url.contains("regionCode="));
                    assertFalse(url.contains("chave-ficticia"));
                }).andExpect(header("x-goog-api-key", "chave-ficticia"))
                .andRespond(withSuccess("""
                        {"items":[{"id":{"videoId":"abcdefghijk"},"snippet":{"title":"Automação financeira","publishedAt":"2026-11-12T12:00:00Z"}}]}
                        """, MediaType.APPLICATION_JSON));
        var client = new TendenciasYouTubeClient(builder.build(), "chave-ficticia");
        assertEquals(1, client.buscar("automacao financeira", "GLOBAL",
                OffsetDateTime.parse("2026-11-01T00:00:00Z"), OffsetDateTime.parse("2026-11-13T00:00:00Z")).size());
        servidor.verify();
    }

    @Test void fornecedorSemChaveRetorna503() {
        var client = new TendenciasYouTubeClient(RestClient.create(), "");
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, assertThrows(IntegracaoExternaException.class,
                () -> client.buscar("marketing", "BR", OffsetDateTime.now().minusDays(1), OffsetDateTime.now())).getStatus());
        var provider = new GeminiChatMarketingProvider(RestClient.create(), new ObjectMapper(), "", "modelo");
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                assertThrows(IntegracaoExternaException.class, () -> provider.gerar(entrada())).getStatus());
    }

    private ChatMarketingProvider.Entrada entrada() {
        return new ChatMarketingProvider.Entrada(OperacaoMarketingIa.RESUMIR, "Resuma.",
                "Dados fictícios de teste.", "Teste sem navegação", List.of());
    }
}
