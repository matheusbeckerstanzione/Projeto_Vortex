package neocore.Security;

import jakarta.servlet.Filter;
import jakarta.servlet.http.Cookie;
import neocore.Config.SegurancaConfig;
import neocore.Model.Enum.PerfilUsuario;
import neocore.Model.Enum.StatusUsuario;
import neocore.Model.Usuario;
import neocore.Repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.MapPropertySource;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

class SegurancaHttpTest {

    @Test
    void loginPublicoPassaSemTokenNemCsrf() throws Exception {
        try (var app = new AplicacaoTeste()) {
            var resposta = app.mvc.perform(post("/autenticacao/login"))
                    .andReturn().getResponse();
            assertEquals(200, resposta.getStatus());
            assertEquals("ok", resposta.getContentAsString());
            verifyNoInteractions(app.usuarios);
        }
    }

    @Test
    void rotaProtegidaSemCredencialRetorna401() throws Exception {
        try (var app = new AplicacaoTeste()) {
            var resposta = app.mvc.perform(get("/empresas"))
                    .andReturn().getResponse();
            assertEquals(401, resposta.getStatus());
            assertTrue(resposta.getHeader(HttpHeaders.CACHE_CONTROL).contains("no-store"));
            assertFalse(resposta.getContentAsString().contains("Exception"));
            verifyNoInteractions(app.usuarios);
        }
    }

    @Test
    void analistaNaoListaUsuariosMasAdministradorPode() throws Exception {
        try (var app = new AplicacaoTeste()) {
            String analista = app.credencial(PerfilUsuario.ANALISTA, false);
            String administrador = app.credencial(PerfilUsuario.ADMINISTRADOR, false);

            assertEquals(403, app.mvc.perform(get("/usuarios")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + analista))
                    .andReturn().getResponse().getStatus());
            assertEquals(200, app.mvc.perform(get("/usuarios")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + administrador))
                    .andReturn().getResponse().getStatus());
            assertNull(SecurityContextHolder.getContext().getAuthentication());
        }
    }

    @Test
    void versaoDeAcessoDivergenteInvalidaCredencial() throws Exception {
        try (var app = new AplicacaoTeste()) {
            Usuario usuario = app.usuario(PerfilUsuario.ANALISTA);
            String token = app.tokens.criar(usuario.getId(), 0, false);
            usuario.setVersaoAcesso(1);

            assertEquals(401, app.mvc.perform(get("/empresas")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andReturn().getResponse().getStatus());
            assertNull(SecurityContextHolder.getContext().getAuthentication());
        }
    }

    @Test
    void perfilAusenteInvalidaCredencial() throws Exception {
        try (var app = new AplicacaoTeste()) {
            Usuario usuario = app.usuario(null);
            String token = app.tokens.criar(usuario.getId(), 0, false);

            assertEquals(401, app.mvc.perform(get("/empresas")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andReturn().getResponse().getStatus());
        }
    }

    @Test
    void rotaForaDaListaEProibidaMesmoParaAdministrador() throws Exception {
        try (var app = new AplicacaoTeste()) {
            String token = app.credencial(PerfilUsuario.ADMINISTRADOR, false);

            assertEquals(403, app.mvc.perform(get("/rota-nao-cadastrada")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andReturn().getResponse().getStatus());
        }
    }

    @Test
    void desafioMfaNaoEUmTokenDeAcesso() throws Exception {
        try (var app = new AplicacaoTeste()) {
            String desafio = app.tokens.criar(UUID.randomUUID(), 0, true);

            assertEquals(401, app.mvc.perform(get("/empresas")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + desafio))
                    .andReturn().getResponse().getStatus());
            verifyNoInteractions(app.usuarios);
        }
    }

    @Test
    void cookieNaoSubstituiHeaderBearer() throws Exception {
        try (var app = new AplicacaoTeste()) {
            String token = app.credencial(PerfilUsuario.ANALISTA, false);

            assertEquals(401, app.mvc.perform(get("/empresas")
                            .cookie(new Cookie("access_token", token)))
                    .andReturn().getResponse().getStatus());
        }
    }

    @Test
    void HttpsRecebeHstsCspEHeadersDeProtecaoSemCache() throws Exception {
        try (var app = new AplicacaoTeste()) {
            var resposta = app.mvc.perform(post("/autenticacao/login").secure(true))
                    .andReturn().getResponse();

            assertEquals(200, resposta.getStatus());
            assertEquals("max-age=31536000", resposta.getHeader("Strict-Transport-Security"));
            assertEquals("default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
                    resposta.getHeader("Content-Security-Policy"));
            assertEquals("nosniff", resposta.getHeader("X-Content-Type-Options"));
            assertEquals("DENY", resposta.getHeader("X-Frame-Options"));
            assertEquals("no-referrer", resposta.getHeader("Referrer-Policy"));
            assertTrue(resposta.getHeader(HttpHeaders.CACHE_CONTROL).contains("no-store"));
        }
    }

    @Test
    void CorsAceitaOrigemConfiguradaSemLiberarCookies() throws Exception {
        try (var app = new AplicacaoTeste()) {
            var preflight = app.mvc.perform(options("/empresas")
                            .header(HttpHeaders.ORIGIN, "https://frontend.example")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization"))
                    .andReturn().getResponse();
            assertEquals(200, preflight.getStatus());
            assertEquals("https://frontend.example",
                    preflight.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
            assertNull(preflight.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS));

            String token = app.credencial(PerfilUsuario.ANALISTA, false);
            var resposta = app.mvc.perform(get("/empresas")
                            .header(HttpHeaders.ORIGIN, "https://frontend.example")
                            .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                    .andReturn().getResponse();
            assertEquals(200, resposta.getStatus());
            assertEquals("https://frontend.example",
                    resposta.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
        }
    }

    @Test
    void CorsRejeitaOrigemNaoAutorizada() throws Exception {
        try (var app = new AplicacaoTeste()) {
            var resposta = app.mvc.perform(options("/empresas")
                            .header(HttpHeaders.ORIGIN, "https://origem-nao-permitida.example")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                    .andReturn().getResponse();

            assertEquals(403, resposta.getStatus());
            assertNull(resposta.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
        }
    }

    @Test
    void DecimaPrimeiraChamadaPublicaRetorna429ComRetryAfter() throws Exception {
        try (var app = new AplicacaoTeste()) {
            for (int i = 0; i < 10; i++) {
                assertEquals(200, app.mvc.perform(post("/autenticacao/login"))
                        .andReturn().getResponse().getStatus());
            }
            var resposta = app.mvc.perform(post("/autenticacao/login"))
                    .andReturn().getResponse();
            assertEquals(429, resposta.getStatus());
            assertEquals("60", resposta.getHeader(HttpHeaders.RETRY_AFTER));
            assertEquals("no-store", resposta.getHeader(HttpHeaders.CACHE_CONTROL));
        }
    }

    private static final class AplicacaoTeste implements AutoCloseable {
        private final AnnotationConfigWebApplicationContext contexto;
        private final MockMvc mvc;
        private final UsuarioRepository usuarios;
        private final TokenStore tokens;

        private AplicacaoTeste() {
            contexto = new AnnotationConfigWebApplicationContext();
            contexto.setServletContext(new MockServletContext());
            contexto.getEnvironment().getPropertySources().addFirst(new MapPropertySource(
                    "seguranca-teste", Map.of(
                    "neocore.seguranca.exigir-https", "false",
                    "neocore.seguranca.exigir-lista-senhas", "false",
                    "neocore.seguranca.cors-origins", "https://frontend.example"
            )));
            contexto.register(SegurancaConfig.class, ConfigTeste.class);
            contexto.refresh();
            usuarios = contexto.getBean(UsuarioRepository.class);
            tokens = contexto.getBean(TokenStore.class);
            mvc = MockMvcBuilders.webAppContextSetup(contexto)
                    .addFilters(contexto.getBean("springSecurityFilterChain", Filter.class))
                    .build();
        }

        private Usuario usuario(PerfilUsuario perfil) {
            var usuario = new Usuario();
            usuario.setId(UUID.randomUUID());
            usuario.setPerfil(perfil);
            usuario.setStatus(StatusUsuario.ATIVO);
            usuario.setVersaoAcesso(0);
            usuario.setSegredoMfaCriptografado("segredo-cifrado-simulado");
            when(usuarios.findById(usuario.getId())).thenReturn(Optional.of(usuario));
            return usuario;
        }

        private String credencial(PerfilUsuario perfil, boolean desafio) {
            return tokens.criar(usuario(perfil).getId(), 0, desafio);
        }

        @Override
        public void close() {
            contexto.close();
            SecurityContextHolder.clearContext();
        }
    }

    @Configuration
    @EnableWebMvc
    public static class ConfigTeste {
        @Bean
        public UsuarioRepository usuarios() {
            return mock(UsuarioRepository.class);
        }

        @Bean
        public TokenStore tokens() {
            return new TokenStore();
        }

        @Bean
        public LimitadorRequisicoes limitador() {
            return new LimitadorRequisicoes(Clock.fixed(
                    Instant.parse("2026-10-28T12:00:00Z"), ZoneOffset.UTC));
        }

        @Bean
        public RotasTeste rotasTeste() {
            return new RotasTeste();
        }
    }

    @RestController
    public static class RotasTeste {
        @PostMapping("/autenticacao/login")
        public String login() {
            return "ok";
        }

        @GetMapping({"/usuarios", "/empresas", "/rota-nao-cadastrada"})
        public String recurso() {
            return "ok";
        }
    }
}
