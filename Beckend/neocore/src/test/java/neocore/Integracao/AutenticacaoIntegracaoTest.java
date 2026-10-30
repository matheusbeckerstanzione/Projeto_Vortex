package neocore.Integracao;

import com.jayway.jsonpath.JsonPath;
import jakarta.persistence.EntityManager;

import neocore.Model.Usuario;
import neocore.Model.Enum.PerfilUsuario;
import neocore.Model.Enum.StatusUsuario;
import neocore.Repository.UsuarioRepository;
import neocore.Security.TokenStore;
import neocore.Service.MfaService;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@ContextConfiguration(
        initializers = IntegracaoBancoTest.BancoSeguro.class
)
public class AutenticacaoIntegracaoTest {

    // Credencial fictícia, exclusiva dos testes.
    private static final String SENHA =
            "Senha-exclusiva-de-teste-123!";

    private static final AtomicInteger NUMERO_IP =
            new AtomicInteger();

    @Autowired
    private WebApplicationContext contexto;

    @Autowired
    private PlatformTransactionManager manager;

    @Autowired
    private EntityManager em;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private TokenStore tokens;

    @Autowired
    private JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    private MockMvc mvc;
    private TransactionTemplate transacao;

    private UUID usuarioId;
    private String email;
    private String ip;

    @BeforeEach
    void preparar() {
        assertEquals(
                "neocore_test",
                jdbc.queryForObject(
                        "select current_database()",
                        String.class
                )
        );

        ip = "127.0.1."
                + (1 + NUMERO_IP.getAndIncrement() % 250);

        email = UUID.randomUUID() + "@example.test";

        transacao = new TransactionTemplate(manager);

        mvc = MockMvcBuilders
                .webAppContextSetup(contexto)
                .apply(springSecurity())
                .build();

        // Confirma a criação para que os endpoints possam consultar o usuário.
        usuarioId = transacao.execute(status -> {
            var usuario = new Usuario();

            usuario.setNome("Analista do teste de autenticacao");
            usuario.setEmail(email);
            usuario.setSenhaHash(encoder.encode(SENHA));
            usuario.setPerfil(PerfilUsuario.ANALISTA);
            usuario.setStatus(StatusUsuario.ATIVO);

            usuario.setCriadoEm(OffsetDateTime.now());
            usuario.setAtualizadoEm(usuario.getCriadoEm());
            usuario.setAtivadoEm(usuario.getCriadoEm());

            return usuarios.saveAndFlush(usuario).getId();
        });
    }

    @AfterEach
    void limparSomenteOUsuarioDesteTeste() {
        try {
            if (usuarioId == null) {
                return;
            }

            assertEquals(
                    "neocore_test",
                    jdbc.queryForObject(
                            "select current_database()",
                            String.class
                    )
            );

            tokens.revogar(usuarioId);

            transacao.executeWithoutResult(status -> {
                em.createQuery(
                                "delete from LogAuditoria l "
                                        + "where l.usuario.id = :id"
                        )
                        .setParameter("id", usuarioId)
                        .executeUpdate();

                usuarios.deleteById(usuarioId);
                usuarios.flush();
            });

        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void loginMfaAcessoProtegidoELogoutFuncionamJuntos()
            throws Exception {

        String desafio = login();

        // O desafio temporário não pode acessar uma rota protegida.
        mvc.perform(
                requisicao(get("/usuarios/" + usuarioId))
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + desafio
                        )
        ).andExpect(status().isUnauthorized());

        String segredo = configurarMfa(desafio);
        String token = confirmar(desafio, codigo(segredo));

        assertNotEquals(desafio, token);

        var usuario = usuarios.findById(usuarioId).orElseThrow();

        assertNotEquals(SENHA, usuario.getSenhaHash());
        assertTrue(
                encoder.matches(SENHA, usuario.getSenhaHash())
        );

        assertNotNull(usuario.getSegredoMfaCriptografado());
        assertNotEquals(
                segredo,
                usuario.getSegredoMfaCriptografado()
        );

        // O token definitivo permite consultar o próprio usuário.
        mvc.perform(
                        requisicao(get("/usuarios/" + usuarioId))
                                .header(
                                        HttpHeaders.AUTHORIZATION,
                                        "Bearer " + token
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.id")
                                .value(usuarioId.toString())
                );

        // ANALISTA não pode listar todos os usuários.
        mvc.perform(
                requisicao(get("/usuarios"))
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
        ).andExpect(status().isForbidden());

        enviar(
                "/autenticacao/logout",
                Map.of(),
                token
        ).andExpect(status().isNoContent());

        // O mesmo token deixa de funcionar após o logout.
        mvc.perform(
                requisicao(get("/usuarios/" + usuarioId))
                        .header(
                                HttpHeaders.AUTHORIZATION,
                                "Bearer " + token
                        )
        ).andExpect(status().isUnauthorized());
    }

    @Test
    void senhaIncorretaRetorna401EGravaTentativa()
            throws Exception {

        enviar(
                "/autenticacao/login",
                Map.of(
                        "email", email,
                        "senha", "Senha-incorreta-123!"
                ),
                null
        ).andExpect(status().isUnauthorized());

        var usuario = usuarios.findById(usuarioId).orElseThrow();

        assertEquals(
                1,
                usuario.getTentativasLogin().intValue()
        );
    }

    @Test
    void codigoMfaIncorretoNaoAtivaSegundoFator()
            throws Exception {

        String desafio = login();
        String segredo = configurarMfa(desafio);

        long contador = Instant.now().getEpochSecond() / 30;

        // Escolhe um código diferente dos códigos próximos do instante atual.
        var validos = new HashSet<String>();

        for (long c = contador - 2; c <= contador + 2; c++) {
            validos.add(MfaService.codigo(segredo, c));
        }

        int numero = 0;

        while (validos.contains(
                String.format(Locale.ROOT, "%06d", numero)
        )) {
            numero++;
        }

        String errado = String.format(
                Locale.ROOT,
                "%06d",
                numero
        );

        enviar(
                "/autenticacao/mfa/confirmar",
                Map.of(
                        "tokenTemporario", desafio,
                        "codigo", errado
                ),
                null
        ).andExpect(status().isUnauthorized());

        var usuario = usuarios.findById(usuarioId).orElseThrow();

        assertNull(usuario.getSegredoMfaCriptografado());

        assertEquals(
                1,
                usuario.getTentativasLogin().intValue()
        );
    }

    @Test
    void rotaProtegidaRecusaAcessoSemToken()
            throws Exception {

        mvc.perform(
                requisicao(get("/usuarios/" + usuarioId))
        ).andExpect(status().isUnauthorized());
    }

    @Test
    void desafioConsumidoNaoPodeEmitirOutroToken()
            throws Exception {

        String desafio = login();
        String codigo = codigo(configurarMfa(desafio));

        confirmar(desafio, codigo);

        // A primeira confirmação já consumiu o desafio.
        enviar(
                "/autenticacao/mfa/confirmar",
                Map.of(
                        "tokenTemporario", desafio,
                        "codigo", codigo
                ),
                null
        ).andExpect(status().isUnauthorized());
    }

    @Test
    void cincoFalhasBloqueiamLoginMesmoComSenhaCorretaDepois()
            throws Exception {

        for (int i = 0; i < 5; i++) {
            enviar(
                    "/autenticacao/login",
                    Map.of(
                            "email", email,
                            "senha", "Senha-incorreta-123!"
                    ),
                    null
            ).andExpect(status().isUnauthorized());
        }

        var usuario = usuarios.findById(usuarioId).orElseThrow();

        assertEquals(
                5,
                usuario.getTentativasLogin().intValue()
        );

        assertNotNull(usuario.getBloqueadoAte());

        assertTrue(
                usuario.getBloqueadoAte()
                        .isAfter(OffsetDateTime.now())
        );

        enviar(
                "/autenticacao/login",
                Map.of(
                        "email", email,
                        "senha", SENHA
                ),
                null
        ).andExpect(status().isUnauthorized());
    }

    private String login() throws Exception {
        var resultado = enviar(
                "/autenticacao/login",
                Map.of(
                        "email", email,
                        "senha", SENHA
                ),
                null
        )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.autenticado").value(false)
                )
                .andExpect(
                        jsonPath("$.mfaNecessario").value(true)
                )
                .andExpect(
                        jsonPath("$.token").doesNotExist()
                )
                .andReturn();

        return campo(resultado, "tokenTemporario");
    }

    private String configurarMfa(String desafio)
            throws Exception {

        var resultado = enviar(
                "/autenticacao/mfa/configuracao",
                Map.of("tokenTemporario", desafio),
                null
        )
                .andExpect(status().isOk())
                .andReturn();

        return campo(resultado, "segredo");
    }

    private String confirmar(
            String desafio,
            String codigo) throws Exception {

        var resultado = enviar(
                "/autenticacao/mfa/confirmar",
                Map.of(
                        "tokenTemporario", desafio,
                        "codigo", codigo
                ),
                null
        )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.tipo").value("Bearer")
                )
                .andReturn();

        return campo(resultado, "token");
    }

    private String codigo(String segredo) {
        return MfaService.codigo(
                segredo,
                Instant.now().getEpochSecond() / 30
        );
    }

    private String campo(
            MvcResult resultado,
            String nome) throws Exception {

        return JsonPath.read(
                resultado.getResponse().getContentAsString(),
                "$." + nome
        );
    }

    private ResultActions enviar(
            String caminho,
            Map<String, String> corpo,
            String token) throws Exception {

        var request = requisicao(post(caminho))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsBytes(corpo));

        if (token != null) {
            request.header(
                    HttpHeaders.AUTHORIZATION,
                    "Bearer " + token
            );
        }

        return mvc.perform(request);
    }

    private MockHttpServletRequestBuilder requisicao(
            MockHttpServletRequestBuilder request) {

        // Isola os contadores por IP entre os cenários.
        // O limitador real continua habilitado.
        return request.with(req -> {
            req.setRemoteAddr(ip);
            return req;
        });
    }
}