package neocore.Security;

import jakarta.servlet.Filter;

import neocore.Config.SegurancaConfig;
import neocore.Controller.ConsultaEmpresaCnpjController;

import neocore.DTO.empresa.ConsultaEmpresaCnpjRequest;

import neocore.Exception.GlobalExceptionHandler;

import neocore.Model.Enum.PerfilUsuario;
import neocore.Model.Enum.StatusUsuario;
import neocore.Model.Usuario;

import neocore.Repository.UsuarioRepository;
import neocore.Service.ConsultaEmpresaCnpjService;

import org.junit.jupiter.api.Test;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.MapPropertySource;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import org.springframework.mock.web.MockServletContext;

import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class ConsultaEmpresaCnpjHttpTest {

    private static final String ROTA =
            "/empresas/consulta-cnpj";

    private static final String CORPO =
            "{\"cnpj\":\"00000000000191\"}";

    @Test
    void consultaSemTokenRetorna401SemAcionarService()
            throws Exception {

        try (var app = new Aplicacao()) {
            var resposta = app.mvc.perform(
                    post(ROTA)
                            .contentType(
                                    MediaType.APPLICATION_JSON
                            )
                            .content(CORPO)
            ).andReturn().getResponse();

            assertEquals(401, resposta.getStatus());

            verifyNoInteractions(app.service);
        }
    }

    @Test
    void tokenTemporarioNaoAutorizaConsulta()
            throws Exception {

        try (var app = new Aplicacao()) {
            String token = app.token(
                    PerfilUsuario.ANALISTA,
                    true
            );

            var resposta = app.mvc.perform(
                    post(ROTA)
                            .header(
                                    HttpHeaders.AUTHORIZATION,
                                    "Bearer " + token
                            )
                            .contentType(
                                    MediaType.APPLICATION_JSON
                            )
                            .content(CORPO)
            ).andReturn().getResponse();

            assertEquals(401, resposta.getStatus());

            verifyNoInteractions(app.service);
        }
    }

    @Test
    void administradorPodeConsultar() throws Exception {
        conferirPerfil(PerfilUsuario.ADMINISTRADOR);
    }

    @Test
    void analistaPodeConsultar() throws Exception {
        conferirPerfil(PerfilUsuario.ANALISTA);
    }

    @Test
    void cnpjInvalidoRetorna400AntesDoService()
            throws Exception {

        try (var app = new Aplicacao()) {
            String token = app.token(
                    PerfilUsuario.ANALISTA,
                    false
            );

            var resposta = app.mvc.perform(
                    post(ROTA)
                            .header(
                                    HttpHeaders.AUTHORIZATION,
                                    "Bearer " + token
                            )
                            .contentType(
                                    MediaType.APPLICATION_JSON
                            )
                            .content("{\"cnpj\":\"123\"}")
            ).andReturn().getResponse();

            assertEquals(400, resposta.getStatus());

            verifyNoInteractions(app.service);
        }
    }

    private void conferirPerfil(PerfilUsuario perfil)
            throws Exception {

        try (var app = new Aplicacao()) {
            String token = app.token(perfil, false);

            var resposta = app.mvc.perform(
                    post(ROTA)
                            .header(
                                    HttpHeaders.AUTHORIZATION,
                                    "Bearer " + token
                            )
                            .contentType(
                                    MediaType.APPLICATION_JSON
                            )
                            .content(CORPO)
            ).andReturn().getResponse();

            assertEquals(200, resposta.getStatus());

            verify(app.service).consultar(
                    new ConsultaEmpresaCnpjRequest(
                            "00000000000191"
                    )
            );
        }
    }

    private static class Aplicacao
            implements AutoCloseable {

        final AnnotationConfigWebApplicationContext contexto =
                new AnnotationConfigWebApplicationContext();

        final MockMvc mvc;

        final ConsultaEmpresaCnpjService service;
        final UsuarioRepository usuarios;
        final TokenStore tokens;

        Aplicacao() {
            contexto.setServletContext(
                    new MockServletContext()
            );

            contexto.getEnvironment()
                    .getPropertySources()
                    .addFirst(
                            new MapPropertySource(
                                    "consulta-teste",
                                    Map.of(
                                            "neocore.seguranca.exigir-https",
                                            "false",

                                            "neocore.seguranca.exigir-lista-senhas",
                                            "false"
                                    )
                            )
                    );

            contexto.register(
                    SegurancaConfig.class,
                    ConfigTeste.class
            );

            contexto.refresh();

            service = contexto.getBean(
                    ConsultaEmpresaCnpjService.class
            );

            usuarios = contexto.getBean(
                    UsuarioRepository.class
            );

            tokens = contexto.getBean(
                    TokenStore.class
            );

            mvc = MockMvcBuilders
                    .webAppContextSetup(contexto)
                    .addFilters(
                            contexto.getBean(
                                    "springSecurityFilterChain",
                                    Filter.class
                            )
                    )
                    .build();
        }

        String token(
                PerfilUsuario perfil,
                boolean temporario
        ) {
            var usuario = new Usuario();

            usuario.setId(UUID.randomUUID());
            usuario.setPerfil(perfil);
            usuario.setStatus(StatusUsuario.ATIVO);
            usuario.setVersaoAcesso(0);

            usuario.setSegredoMfaCriptografado(
                    "simulado-para-teste"
            );

            when(usuarios.findById(usuario.getId()))
                    .thenReturn(
                            Optional.of(usuario)
                    );

            return tokens.criar(
                    usuario.getId(),
                    0,
                    temporario
            );
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
            return new LimitadorRequisicoes();
        }

        @Bean
        public ConsultaEmpresaCnpjService service() {
            return mock(
                    ConsultaEmpresaCnpjService.class
            );
        }

        @Bean
        public ConsultaEmpresaCnpjController controller(
                ConsultaEmpresaCnpjService service
        ) {
            return new ConsultaEmpresaCnpjController(
                    service
            );
        }

        @Bean
        public GlobalExceptionHandler erros() {
            return new GlobalExceptionHandler();
        }
    }
}