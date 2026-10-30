package neocore.Controller;

import neocore.DTO.autenticacao.LoginRequest;
import neocore.DTO.autenticacao.LoginResponse;
import neocore.DTO.autenticacao.MfaRequest;
import neocore.Exception.GlobalExceptionHandler;
import neocore.Service.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Testes HTTP da camada MVC com services simulados; não iniciam banco nem autenticação. */
class ControllersTest {
    private static final UUID SEGMENTO = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID CONTATO = UUID.fromString("22222222-2222-2222-2222-222222222222");

    private MockMvc mvc(Object... controllers) {
        return MockMvcBuilders.standaloneSetup(controllers)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void loginDelegaDtoERespostaComTokenNaoPodeSerArmazenadaEmCache() throws Exception {
        var service = mock(AutenticacaoService.class);
        var request = new LoginRequest("operador@example.test", "senha-de-teste");
        when(service.login(request)).thenReturn(new LoginResponse(false, true, "desafio-teste", "Confirme MFA"));

        var resposta = mvc(new AutenticacaoController(service)).perform(post("/autenticacao/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"operador@example.test\",\"senha\":\"senha-de-teste\"}"))
                .andReturn().getResponse();

        assertEquals(200, resposta.getStatus());
        assertEquals("no-store", resposta.getHeader(HttpHeaders.CACHE_CONTROL));
        assertTrue(resposta.getContentAsString().contains("\"tokenTemporario\":\"desafio-teste\""));
        assertTrue(resposta.getContentAsString().contains("\"mfaNecessario\":true"));
        verify(service).login(request);
        verifyNoMoreInteractions(service);
    }

    @Test
    void configuracaoMfaRecebeDesafioNoCorpoSemHeaderBearer() throws Exception {
        var service = mock(AutenticacaoService.class);
        when(service.iniciarConfiguracaoMfa("desafio-teste"))
                .thenReturn(new MfaService.Configuracao("SEGREDO_DE_TESTE", "otpauth://totp/teste"));

        var resposta = mvc(new AutenticacaoController(service)).perform(post("/autenticacao/mfa/configuracao")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tokenTemporario\":\"desafio-teste\"}"))
                .andReturn().getResponse();

        assertEquals(200, resposta.getStatus());
        assertEquals("no-store", resposta.getHeader(HttpHeaders.CACHE_CONTROL));
        assertTrue(resposta.getContentAsString().contains("SEGREDO_DE_TESTE"));
        verify(service).iniciarConfiguracaoMfa("desafio-teste");
        verifyNoMoreInteractions(service);
    }

    @Test
    void configuracaoMfaRejeitaDesafioAusenteOuVazioAntesDoService() throws Exception {
        var service = mock(AutenticacaoService.class);
        var mvc = mvc(new AutenticacaoController(service));
        for (String corpo : List.of("{}", "{\"tokenTemporario\":\" \"}")) {
            var resposta = mvc.perform(post("/autenticacao/mfa/configuracao")
                            .contentType(MediaType.APPLICATION_JSON).content(corpo))
                    .andReturn().getResponse();
            assertEquals(400, resposta.getStatus(), corpo);
        }
        verifyNoInteractions(service);
    }

    @Test
    void confirmacaoMfaValidaCodigoAntesDeDelegar() throws Exception {
        var service = mock(AutenticacaoService.class);
        var mvc = mvc(new AutenticacaoController(service));
        var invalida = mvc.perform(post("/autenticacao/mfa/confirmar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tokenTemporario\":\"desafio-teste\",\"codigo\":\"abc\"}"))
                .andReturn().getResponse();
        assertEquals(400, invalida.getStatus());
        verifyNoInteractions(service);

        var valida = mvc.perform(post("/autenticacao/mfa/confirmar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tokenTemporario\":\"desafio-teste\",\"codigo\":\"123456\"}"))
                .andReturn().getResponse();
        assertEquals(200, valida.getStatus());
        assertEquals("no-store", valida.getHeader(HttpHeaders.CACHE_CONTROL));
        verify(service).confirmarMfa(new MfaRequest("desafio-teste", "123456"));
        verifyNoMoreInteractions(service);
    }

    @Test
    void logoutExtraiApenasTokenBearerERetorna204() throws Exception {
        var service = mock(AutenticacaoService.class);
        var resposta = mvc(new AutenticacaoController(service)).perform(post("/autenticacao/logout")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer token-definitivo"))
                .andReturn().getResponse();

        assertEquals(204, resposta.getStatus());
        assertEquals("", resposta.getContentAsString());
        assertEquals("no-store", resposta.getHeader(HttpHeaders.CACHE_CONTROL));
        verify(service).logout("token-definitivo");
        verifyNoMoreInteractions(service);
    }

    @Test
    void logoutAusenteOuComEsquemaInvalidoRetorna401SemDelegar() throws Exception {
        var service = mock(AutenticacaoService.class);
        var mvc = mvc(new AutenticacaoController(service));
        assertEquals(401, mvc.perform(post("/autenticacao/logout")).andReturn().getResponse().getStatus());
        for (String header : List.of("Basic credencial", "Bearer ")) {
            assertEquals(401, mvc.perform(post("/autenticacao/logout")
                    .header(HttpHeaders.AUTHORIZATION, header)).andReturn().getResponse().getStatus());
        }
        verifyNoInteractions(service);
    }

    @Test
    void statusDeSegmentoAusenteOuDesconhecidoRetorna400() throws Exception {
        var service = mock(SegmentoService.class);
        var mvc = mvc(new SegmentoController(service));
        for (String corpo : List.of("{}", "{\"status\":\"DESCONHECIDO\"}")) {
            assertEquals(400, mvc.perform(patch("/segmentos/" + SEGMENTO + "/status")
                    .contentType(MediaType.APPLICATION_JSON).content(corpo)).andReturn().getResponse().getStatus());
        }
        verifyNoInteractions(service);
    }

    @Test
    void statusDeCampanhaAusenteOuDesconhecidoRetorna400() throws Exception {
        var service = mock(CampanhaService.class);
        var mvc = mvc(new CampanhaController(service));
        for (String corpo : List.of("{}", "{\"status\":\"DESCONHECIDO\"}")) {
            assertEquals(400, mvc.perform(patch("/campanhas/" + SEGMENTO + "/status")
                    .contentType(MediaType.APPLICATION_JSON).content(corpo)).andReturn().getResponse().getStatus());
        }
        verifyNoInteractions(service);
    }

    @Test
    void importacaoValidaListaEElementosAntesDeAbrirOperacaoNoService() throws Exception {
        var service = mock(ImportacaoCnpjService.class);
        var mvc = mvc(new ImportacaoCnpjController(service));
        for (String corpo : List.of("{}", "{\"empresas\":null}", "{\"empresas\":[]}",
                "{\"empresas\":[null]}", "{\"empresas\":[{}]}")) {
            var resposta = mvc.perform(post("/importacoes/cnpj")
                    .contentType(MediaType.APPLICATION_JSON).content(corpo)).andReturn().getResponse();
            assertEquals(400, resposta.getStatus(), "Corpo inválido não rejeitado: " + corpo);
        }
        verifyNoInteractions(service);
    }

    @Test
    void exportacaoPreservaBytesCsvEInstruiDownloadSemCache() throws Exception {
        var service = mock(ExportacaoService.class);
        byte[] csv = "nome;cidade\r\nEmpresa de Teste;São Paulo\r\n".getBytes(StandardCharsets.UTF_8);
        when(service.exportarSegmento(SEGMENTO)).thenReturn(csv);

        var resposta = mvc(new ExportacaoController(service))
                .perform(get("/exportacoes/segmentos/" + SEGMENTO)).andReturn().getResponse();

        assertEquals(200, resposta.getStatus());
        assertArrayEquals(csv, resposta.getContentAsByteArray());
        assertEquals(MediaType.parseMediaType("text/csv;charset=UTF-8"),
                MediaType.parseMediaType(resposta.getContentType()));
        assertEquals("no-store", resposta.getHeader(HttpHeaders.CACHE_CONTROL));
        assertEquals("attachment; filename=\"segmento-" + SEGMENTO + ".csv\"",
                resposta.getHeader(HttpHeaders.CONTENT_DISPOSITION));
        verify(service).exportarSegmento(SEGMENTO);
        verifyNoMoreInteractions(service);
    }

    @Test
    void previaDelegaPaginacaoSemRecalcularSegmento() throws Exception {
        var service = mock(SegmentoService.class);
        when(service.previa(SEGMENTO, 2, 15)).thenReturn(
                Page.empty(org.springframework.data.domain.PageRequest.of(2, 15)));

        var resultado = mvc(new SegmentoController(service))
                .perform(get("/segmentos/" + SEGMENTO + "/previa").param("pagina", "2").param("tamanho", "15"))
                .andReturn();
        var resposta = resultado.getResponse();

        assertEquals(200, resposta.getStatus(), () -> String.valueOf(resultado.getResolvedException()));
        verify(service).previa(SEGMENTO, 2, 15);
        verifyNoMoreInteractions(service);
    }

    @Test
    void recalculoExplicitoRetornaQuantidadeCalculada() throws Exception {
        var service = mock(SegmentoService.class);
        when(service.recalcular(SEGMENTO)).thenReturn(37L);

        var resposta = mvc(new SegmentoController(service))
                .perform(post("/segmentos/" + SEGMENTO + "/recalculo")).andReturn().getResponse();

        assertEquals(200, resposta.getStatus());
        assertEquals("{\"quantidadeContatos\":37}", resposta.getContentAsString());
        verify(service).recalcular(SEGMENTO);
        verifyNoMoreInteractions(service);
    }

    @Test
    void remocaoDaAssociacaoUsaSegmentoEContatoDoCaminhoNaOrdemCorreta() throws Exception {
        var service = mock(SegmentoService.class);
        var resposta = mvc(new SegmentoContatoController(service))
                .perform(delete("/segmento-contatos/" + SEGMENTO + "/" + CONTATO)).andReturn().getResponse();

        assertEquals(204, resposta.getStatus());
        assertEquals("", resposta.getContentAsString());
        verify(service).removerContato(SEGMENTO, CONTATO);
        verifyNoMoreInteractions(service);
    }
}
