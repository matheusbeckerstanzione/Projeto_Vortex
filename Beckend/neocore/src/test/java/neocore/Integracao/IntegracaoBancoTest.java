package neocore.Integracao;

import jakarta.persistence.EntityManager;
import neocore.DTO.empresa.EmpresaRequest;
import neocore.Exception.ConflitoException;
import neocore.Model.Empresa;
import neocore.Model.Usuario;
import neocore.Model.Enum.PerfilUsuario;
import neocore.Model.Enum.StatusUsuario;
import neocore.Repository.EmpresaRepository;
import neocore.Service.EmpresaService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.transaction.AfterTransaction;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@ContextConfiguration(initializers = IntegracaoBancoTest.BancoSeguro.class)
@Transactional
public class IntegracaoBancoTest {
    @Autowired EntityManager em;
    @Autowired EmpresaService service;
    @Autowired EmpresaRepository empresas;
    @Autowired JdbcTemplate jdbc;
    private UUID empresaCriada;

    // Executado antes da criação do DataSource e do Hibernate.
    public static class BancoSeguro implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override
        public void initialize(ConfigurableApplicationContext context) {
            String url = "jdbc:postgresql://127.0.0.1:5432/neocore_test";
            String jndi = context.getEnvironment().getProperty("spring.datasource.jndi-name");
            if (jndi != null && !jndi.isBlank()) {
                throw new IllegalStateException("Estes testes nao permitem DataSource JNDI.");
            }
            context.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("bancoExclusivoDosTestes", Map.of(
                            "spring.datasource.url", url,
                            "spring.datasource.hikari.jdbc-url", url,
                            "spring.datasource.type", "com.zaxxer.hikari.HikariDataSource",
                            "spring.jpa.hibernate.ddl-auto", "update",
                            "spring.flyway.enabled", "false",
                            "neocore.bootstrap.enabled", "false"
                    )));
        }
    }

    @BeforeEach
    void prepararUsuarioDeTeste() {
        assertEquals("neocore_test", jdbc.queryForObject("select current_database()", String.class));
        empresaCriada = null;
        var usuario = new Usuario();
        usuario.setNome("Administrador de teste");
        usuario.setEmail(UUID.randomUUID() + "@example.test");
        usuario.setPerfil(PerfilUsuario.ADMINISTRADOR);
        usuario.setStatus(StatusUsuario.ATIVO);
        usuario.setCriadoEm(OffsetDateTime.now());
        usuario.setAtualizadoEm(usuario.getCriadoEm());
        em.persist(usuario);
        em.flush();
        var auth = new UsernamePasswordAuthenticationToken(usuario.getId(), null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR")));
        var contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(auth);
        SecurityContextHolder.setContext(contexto);
    }

    @AfterEach
    void limparAutenticacao() {
        SecurityContextHolder.clearContext();
    }

    private EmpresaRequest cadastro(String cnpj) {
        return new EmpresaRequest("Empresa de teste", "teste-" + UUID.randomUUID(),
                cnpj, "Tecnologia", "Sao Paulo", "sp", null, null);
    }

    private String novoCnpj() {
        return Long.toString(ThreadLocalRandom.current()
                .nextLong(10_000_000_000_000L, 100_000_000_000_000L));
    }

    @Test
    void cadastrarEConsultarEmpresaNoPostgres() {
        String cnpj = novoCnpj();
        var resultado = service.cadastrar(cadastro(cnpj));
        empresaCriada = resultado.id();
        em.flush();
        em.clear();
        var encontrada = service.buscarPorId(empresaCriada);
        assertEquals(cnpj, encontrada.cnpj());
        assertEquals("SP", encontrada.uf());
        assertTrue(empresas.existsById(empresaCriada));
    }

    @Test
    void serviceRejeitaCnpjDuplicado() {
        String cnpj = novoCnpj();
        empresaCriada = service.cadastrar(cadastro(cnpj)).id();
        em.flush();
        assertThrows(ConflitoException.class, () -> service.cadastrar(cadastro(cnpj)));
    }

    @Test
    void bancoTambemImpedeDuplicacaoSemPassarPeloService() {
        String cnpj = novoCnpj();
        empresaCriada = service.cadastrar(cadastro(cnpj)).id();
        em.flush();
        var duplicada = new Empresa();
        duplicada.setNome("Duplicada de teste");
        duplicada.setSlug("outra-" + UUID.randomUUID());
        duplicada.setCnpj(cnpj);
        duplicada.setSetor("Tecnologia");
        duplicada.setCidade("Sao Paulo");
        duplicada.setUf("SP");
        duplicada.setCriadoEm(OffsetDateTime.now());
        duplicada.setAtualizadoEm(duplicada.getCriadoEm());
        assertThrows(DataIntegrityViolationException.class, () -> empresas.saveAndFlush(duplicada));
    }

    @Test
    void cadastroGravaAuditoriaNaMesmaTransacao() {
        empresaCriada = service.cadastrar(cadastro(novoCnpj())).id();
        em.flush();
        Long quantidade = em.createQuery(
                        "select count(l) from LogAuditoria l where l.recursoId = :id and l.acao = :acao", Long.class)
                .setParameter("id", empresaCriada).setParameter("acao", "CADASTRAR").getSingleResult();
        assertEquals(1L, quantidade.longValue());
    }

    @AfterTransaction
    void confirmarQueOTesteNaoDeixouEmpresaGravada() {
        if (empresaCriada != null) assertFalse(empresas.existsById(empresaCriada));
    }
}
