package neocore.Security;

import jakarta.servlet.Filter;
import neocore.Config.SegurancaConfig;
import neocore.Controller.ChatMarketingController;
import neocore.DTO.ia.ChatMarketingResponse;
import neocore.DTO.ia.OperacaoMarketingIa;
import neocore.Exception.GlobalExceptionHandler;
import neocore.Model.Enum.*;
import neocore.Model.Usuario;
import neocore.Repository.UsuarioRepository;
import neocore.Service.ChatMarketingService;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.core.env.MapPropertySource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class ChatMarketingHttpTest {
    private static final String JSON = """
            {"operacao":"PROPOR_CAMPANHA","pergunta":"Proponha uma campanha B2B."}
            """;

    @Test void endpointExigeBearerERejeitaTokenTemporario() throws Exception {
        try (var app = new App()) {
            assertEquals(401, app.enviar(null, JSON).getResponse().getStatus());
            assertEquals(401, app.enviar(app.tokens.criar(UUID.randomUUID(), 0, true), JSON).getResponse().getStatus());
            verifyNoInteractions(app.service);
        }
    }

    @Test void aceitaPerfisDoNeoCoreERespondeSemCache() throws Exception {
        try (var app = new App()) {
            for (var perfil : PerfilUsuario.values()) {
                var resposta = app.enviar(app.token(perfil), JSON).getResponse();
                assertEquals(200, resposta.getStatus());
                assertTrue(resposta.getHeader("Cache-Control").contains("no-store"));
            }
            verify(app.service, times(2)).responder(any());
        }
    }

    @Test void operacaoOuPerguntaInvalidaNaoChegaAoService() throws Exception {
        try (var app = new App()) {
            String token = app.token(PerfilUsuario.ANALISTA);
            assertEquals(400, app.enviar(token, "{\"operacao\":\"OUTRA\",\"pergunta\":\"Teste\"}").getResponse().getStatus());
            assertEquals(400, app.enviar(token, "{\"operacao\":\"RESUMIR\",\"pergunta\":\"\"}").getResponse().getStatus());
            verifyNoInteractions(app.service);
        }
    }

    private static class App implements AutoCloseable {
        final AnnotationConfigWebApplicationContext ctx = new AnnotationConfigWebApplicationContext();
        final MockMvc mvc;
        final TokenStore tokens;
        final ChatMarketingService service;
        App() {
            ctx.setServletContext(new MockServletContext());
            ctx.getEnvironment().getPropertySources().addFirst(new MapPropertySource("teste", Map.of(
                    "neocore.seguranca.exigir-https", "false", "neocore.seguranca.exigir-lista-senhas", "false")));
            ctx.register(SegurancaConfig.class, Config.class, ChatMarketingController.class, GlobalExceptionHandler.class);
            ctx.refresh();
            tokens = ctx.getBean(TokenStore.class);
            service = ctx.getBean(ChatMarketingService.class);
            when(service.responder(any())).thenReturn(new ChatMarketingResponse(OperacaoMarketingIa.PROPOR_CAMPANHA,
                    new ChatMarketingResponse.Conteudo("Proposta.", List.of(), null, List.of(), List.of()),
                    List.of(), "Teste HTTP com service simulado", Instant.now(), List.of()));
            mvc = MockMvcBuilders.webAppContextSetup(ctx)
                    .addFilters(ctx.getBean("springSecurityFilterChain", Filter.class)).build();
        }
        String token(PerfilUsuario perfil) {
            var usuario = new Usuario();
            usuario.setId(UUID.randomUUID());
            usuario.setPerfil(perfil);
            usuario.setStatus(StatusUsuario.ATIVO);
            usuario.setVersaoAcesso(0);
            usuario.setSegredoMfaCriptografado("ficticio");
            when(ctx.getBean(UsuarioRepository.class).findById(usuario.getId())).thenReturn(Optional.of(usuario));
            return tokens.criar(usuario.getId(), 0, false);
        }
        MvcResult enviar(String token, String json) throws Exception {
            var request = post("/ia/chat").contentType(MediaType.APPLICATION_JSON).content(json);
            if (token != null) request.header("Authorization", "Bearer " + token);
            return mvc.perform(request).andReturn();
        }
        public void close() { ctx.close(); SecurityContextHolder.clearContext(); }
    }

    @Configuration @EnableWebMvc
    static class Config {
        @Bean UsuarioRepository usuarios() { return mock(UsuarioRepository.class); }
        @Bean ChatMarketingService chat() { return mock(ChatMarketingService.class); }
        @Bean TokenStore tokens() { return new TokenStore(); }
        @Bean LimitadorRequisicoes limites() { return new LimitadorRequisicoes(); }
    }
}
