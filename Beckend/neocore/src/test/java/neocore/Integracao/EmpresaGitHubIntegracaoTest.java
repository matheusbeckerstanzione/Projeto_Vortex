package neocore.Integracao;

import jakarta.persistence.EntityManager;
import jakarta.validation.ConstraintViolationException;
import neocore.Client.GitHubClient;
import neocore.DTO.github.*;
import neocore.DTO.integracao.GitHubOrganizacaoResponse;
import neocore.DTO.segmento.SegmentacaoEmpresasRequest;
import neocore.DTO.sinais.SinaisGitHubResponse;
import neocore.Exception.*;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.EmpresaGitHubRepository;
import neocore.Service.*;
import neocore.Security.TokenStore;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.*;
import org.springframework.core.env.MapPropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.http.MediaType;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@ContextConfiguration(initializers = EmpresaGitHubIntegracaoTest.BancoSeguro.class)
class EmpresaGitHubIntegracaoTest {

    @Autowired EntityManager em;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired EmpresaGitHubService service;
    @Autowired CriteriosSegmento criterios;
    @Autowired ExportacaoService exportacao;
    @MockitoBean GitHubClient client;
    @MockitoBean SinaisGitHubService sinais;
    @Autowired EmpresaGitHubRepository repository;
    @Autowired ServiceSupport suporte;
    @Autowired WebApplicationContext webContext;
    @Autowired TokenStore tokens;
    @Autowired MfaService mfa;

    private UUID usuarioId;
    private UUID finalidadeId;
    private UUID empresaId;
    private UUID outraEmpresaId;
    private String linguagem;

    // Alvo fixo: banco local de testes. Não aceita nomes de bancos pessoais/nuvem.
    public static class BancoSeguro implements ApplicationContextInitializer<ConfigurableApplicationContext> {
        @Override
        public void initialize(ConfigurableApplicationContext context) {
            String porta = System.getProperty("neocore.github.test.port", "5432");
            if (!porta.matches("[0-9]{1,5}")
                    || context.getEnvironment().getProperty("spring.datasource.jndi-name") != null) {
                throw new IllegalStateException("Configuração de banco de testes inválida.");
            }
            String url = "jdbc:postgresql://127.0.0.1:" + porta + "/neocore_test";
            context.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("githubBancoExclusivoTestes", Map.of(
                            "spring.datasource.url", url,
                            "spring.datasource.hikari.jdbc-url", url,
                            "spring.jpa.hibernate.ddl-auto", System.getProperty("neocore.github.test.ddl", "update"),
                            "spring.flyway.enabled", "false",
                            "neocore.bootstrap.enabled", "false"
                    )));
        }
    }

    @BeforeEach
    void preparar() {
        assertEquals("neocore_test", jdbc.queryForObject("select current_database()", String.class));
        linguagem = "linguagem-" + UUID.randomUUID();
        tx(() -> {
            Usuario usuario = new Usuario();
            usuario.setNome("Administrador da fixture GitHub");
            usuario.setEmail(UUID.randomUUID() + "@example.test");
            usuario.setPerfil(PerfilUsuario.ADMINISTRADOR);
            usuario.setStatus(StatusUsuario.ATIVO);
            usuario.setSegredoMfaCriptografado(mfa.cifrar("JBSWY3DPEHPK3PXP"));
            usuario.setCriadoEm(OffsetDateTime.now());
            usuario.setAtualizadoEm(usuario.getCriadoEm());
            em.persist(usuario);
            usuarioId = usuario.getId();

            FinalidadeTratamento finalidade = new FinalidadeTratamento();
            finalidade.setNome("Fixture GitHub " + UUID.randomUUID());
            finalidade.setDescricao("Finalidade exclusiva para verificar a integração em banco de testes.");
            finalidade.setBaseLegal("Avaliação exclusiva da fixture de testes");
            finalidade.setRetencaoDias(30);
            finalidade.setHabilitada(true);
            finalidade.setCriadoEm(OffsetDateTime.now());
            em.persist(finalidade);
            finalidadeId = finalidade.getId();
            empresaId = empresa("Alvo GitHub da fixture").getId();
            outraEmpresaId = empresa("Outra empresa da fixture").getId();
        });
        autenticar("ADMINISTRADOR");
        when(client.organizacao("fixture-org")).thenAnswer(invocation -> {
            assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
            return new GitHubOrganizacaoResponse(123L, "fixture-org", "Fixture", "Organization", 30);
        });
        when(sinais.consultar("fixture-org", 1)).thenAnswer(invocation -> {
            assertFalse(TransactionSynchronizationManager.isActualTransactionActive());
            return amostra(123L);
        });
    }

    @AfterEach
    void limpar() {
        // Somente os IDs criados por este teste; nunca limpa tabelas inteiras.
        tx(() -> {
            if (empresaId != null) {
                jdbc.update("delete from empresa_github_linguagens where empresa_id = ?", empresaId);
                jdbc.update("delete from empresa_github where empresa_id = ?", empresaId);
                jdbc.update("delete from restricoes_uso where contato_id in (select id from contatos where empresa_id = ?)", empresaId);
                jdbc.update("delete from contatos where empresa_id = ?", empresaId);
            }
            if (usuarioId != null) {
                jdbc.update("delete from logs_auditoria where usuario_id = ?", usuarioId);
            }
            if (empresaId != null) jdbc.update("delete from empresas where id = ?", empresaId);
            if (outraEmpresaId != null) jdbc.update("delete from empresas where id = ?", outraEmpresaId);
            if (finalidadeId != null) jdbc.update("delete from finalidades_tratamento where id = ?", finalidadeId);
            if (usuarioId != null) jdbc.update("delete from usuarios where id = ?", usuarioId);
        });
        SecurityContextHolder.clearContext();
    }

    @Test
    void persisteJsonDatasLinguagensEVersaoComAuditoria() {
        var vinculo = service.vincular(empresaId, request(null));
        assertEquals("SEM_COLETA", vinculo.situacao());
        assertEquals(0L, vinculo.versao());
        var coleta = service.coletar(empresaId, new EmpresaGitHubColetaRequest(vinculo.versao()));
        var salvo = service.buscar(empresaId);
        assertEquals("VIGENTE", salvo.situacao());
        assertEquals(1L, salvo.versao());
        assertEquals(coleta.amostra(), salvo.amostra());
        assertEquals(3, salvo.amostra().repositorios().size());
        assertEquals(2L, jdbc.queryForObject(
                "select count(*) from logs_auditoria where recurso_id = ?", Long.class, empresaId));
        assertEquals(List.of(linguagem), jdbc.queryForList(
                "select linguagem from empresa_github_linguagens where empresa_id = ?", String.class, empresaId));
    }

    @Test
    void analistaNaoPodeConfirmarVinculo() {
        tx(() -> em.find(Usuario.class, usuarioId).setPerfil(PerfilUsuario.ANALISTA));
        autenticar("ANALISTA");
        assertThrows(AcessoNegadoException.class, () -> service.vincular(empresaId, request(null)));
        verifyNoInteractions(client);
    }

    @Test
    void exigeConfirmacaoExplicitaEReferenciaHttps() {
        var semConfirmacao = new EmpresaGitHubVinculoRequest("fixture-org",
                "https://example.test/tecnologia", "Conferência manual realizada pelo administrador.", false, null);
        assertThrows(ConstraintViolationException.class, () -> service.vincular(empresaId, semConfirmacao));
        var referenciaInvalida = new EmpresaGitHubVinculoRequest("fixture-org",
                "javascript:alert(1)", "Conferência manual realizada pelo administrador.", true, null);
        assertThrows(RegraNegocioException.class, () -> service.vincular(empresaId, referenciaInvalida));
        verifyNoInteractions(client);
    }

    @Test
    void versaoAntigaNaoSobrescreveConfirmacao() {
        service.vincular(empresaId, request(null));
        assertThrows(ConflitoException.class, () -> service.vincular(empresaId, request(null)));
        assertThrows(ConflitoException.class,
                () -> service.coletar(empresaId, new EmpresaGitHubColetaRequest(99L)));
        verifyNoInteractions(sinais);
    }

    @Test
    void trocaDeIdentidadeDaOrganizacaoNaoGravaSinais() {
        var vinculo = service.vincular(empresaId, request(null));
        when(sinais.consultar("fixture-org", 1)).thenReturn(amostra(999L));
        assertThrows(ConflitoException.class,
                () -> service.coletar(empresaId, new EmpresaGitHubColetaRequest(vinculo.versao())));
        assertNull(service.buscar(empresaId).amostra());
    }

    @Test
    void revogacaoDuranteConsultaImpedeGravacaoTardia() {
        var vinculo = service.vincular(empresaId, request(null));
        when(sinais.consultar("fixture-org", 1)).thenAnswer(invocation -> {
            service.revogar(empresaId, vinculo.versao());
            return amostra(123L);
        });
        assertThrows(ConflitoException.class,
                () -> service.coletar(empresaId, new EmpresaGitHubColetaRequest(vinculo.versao())));
        assertEquals("REVOGADO", service.buscar(empresaId).situacao());
        assertNull(service.buscar(empresaId).amostra());
    }

    @Test
    void filtroCombinaAndOrEExcluiSinaisVencidos() {
        var vinculo = service.vincular(empresaId, request(null));
        service.coletar(empresaId, new EmpresaGitHubColetaRequest(vinculo.versao()));
        var somenteLinguagem = Map.<String, Object>of("linguagemGitHub", linguagem.toUpperCase(Locale.ROOT));
        assertEquals(1, criterios.contarEmpresas(somenteLinguagem));
        var outroEJava = Map.<String, Object>of("modo", "AND", "empresaId", outraEmpresaId.toString(), "linguagemGitHub", linguagem);
        var outroOuJava = Map.<String, Object>of("modo", "OR", "empresaId", outraEmpresaId.toString(), "linguagemGitHub", linguagem);
        assertEquals(0, criterios.contarEmpresas(outroEJava));
        assertEquals(2, criterios.contarEmpresas(outroOuJava));
        tx(() -> {
            var registro = em.find(EmpresaGitHub.class, empresaId);
            registro.setConsultadoEm(Instant.now().minus(Duration.ofHours(25)));
            registro.setValidoAte(Instant.now().minusSeconds(60));
        });
        assertEquals(0, criterios.contarEmpresas(somenteLinguagem));
        assertEquals(1, criterios.contarEmpresas(outroOuJava));
        assertEquals("EXPIRADO", service.buscar(empresaId).situacao());
    }

    @Test
    void csvUsaFiltroNovoERevogacaoRetiraEmpresa() {
        var vinculo = service.vincular(empresaId, request(null));
        var coleta = service.coletar(empresaId, new EmpresaGitHubColetaRequest(vinculo.versao()));
        var filtro = new SegmentacaoEmpresasRequest(finalidadeId,
                Map.of("linguagemGitHub", linguagem));
        String csv = new String(exportacao.exportarEmpresas(filtro), StandardCharsets.UTF_8);
        assertTrue(csv.contains("Alvo GitHub da fixture"));
        assertFalse(csv.contains("Outra empresa da fixture"));
        service.revogar(empresaId, coleta.versao());
        assertEquals(0, criterios.contarEmpresas(filtro.criterios()));
        assertNull(service.buscar(empresaId).amostra());
    }

    @Test
    void falhaNaAuditoriaDesfazVinculo() {
        AuditoriaService auditoria = mock(AuditoriaService.class);
        doThrow(new IllegalStateException("Falha controlada da fixture"))
                .when(auditoria).registrar(any(), eq("VINCULAR_GITHUB"), anyString(), any(), any());
        var comFalha = new EmpresaGitHubService(repository, client, sinais, suporte, auditoria, transactionManager);
        assertThrows(IllegalStateException.class, () -> comFalha.vincular(empresaId, request(null)));
        assertEquals(0, jdbc.queryForObject("select count(*) from empresa_github where empresa_id = ?", Integer.class, empresaId));
    }

    @Test
    void filtroDeContatoMantemIdentidadeValidadeERestricoes() {
        var vinculo = service.vincular(empresaId, request(null));
        service.coletar(empresaId, new EmpresaGitHubColetaRequest(vinculo.versao()));
        tx(() -> {
            contato(StatusIdentidade.VERIFICADA, false, false);
            contato(StatusIdentidade.NAO_VERIFICADA, false, false);
            contato(StatusIdentidade.VERIFICADA, true, false);
            contato(StatusIdentidade.VERIFICADA, false, true);
        });
        Map<String, Object> filtro = Map.of("linguagemGitHub", linguagem);
        assertEquals(1, criterios.contar(filtro, finalidadeId));
        assertEquals(1, criterios.buscar(filtro, finalidadeId, 0, 20).size());
    }

    @Test
    void httpPermiteFluxoCompletoDoAdministrador() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(webContext).apply(springSecurity()).build();
        String token = tokens.criar(usuarioId, 0, false);
        String rota = "/empresas/" + empresaId + "/github";
        mvc.perform(put(rota + "/vinculo").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                    {"organizacao":"fixture-org","referenciaVinculo":"https://example.test/tecnologia",
                    "justificativaVinculo":"Conferência manual realizada pelo administrador da fixture.",
                    "confirmado":true,"versaoEsperada":null}
                    """))
                .andExpect(status().isOk()).andExpect(jsonPath("$.situacao").value("SEM_COLETA"));
        mvc.perform(post(rota + "/coleta").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"versaoEsperada\":0}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.situacao").value("VIGENTE"));
        mvc.perform(get(rota).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.amostra.organizacaoId").value(123));
        mvc.perform(delete(rota + "/vinculo").param("versao", "1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.situacao").value("REVOGADO"));
    }

    @Test
    void httpNaoPermiteAlteracaoPorAnalista() throws Exception {
        tx(() -> em.find(Usuario.class, usuarioId).setPerfil(PerfilUsuario.ANALISTA));
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(webContext).apply(springSecurity()).build();
        String token = tokens.criar(usuarioId, 0, false);
        mvc.perform(put("/empresas/" + empresaId + "/github/vinculo")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(client);
    }

    private EmpresaGitHubVinculoRequest request(Long versao) {
        return new EmpresaGitHubVinculoRequest("fixture-org", "https://example.test/tecnologia",
                "Conferência manual realizada pelo administrador da fixture.", true, versao);
    }

    private SinaisGitHubResponse amostra(long id) {
        return new SinaisGitHubResponse(id, "fixture-org", "Fixture", "https://github.com/fixture-org",
                30, 1, 20, List.of(
                new SinaisGitHubResponse.Repositorio(1L, "projeto", "https://github.com/fixture-org/projeto", linguagem, false, false, OffsetDateTime.now(ZoneOffset.UTC)),
                new SinaisGitHubResponse.Repositorio(2L, "fork", "https://github.com/fixture-org/fork", "NaoIndexarFork", true, false, null),
                new SinaisGitHubResponse.Repositorio(3L, "arquivo", "https://github.com/fixture-org/arquivo", "NaoIndexarArquivado", false, true, null)
        ), List.of(new SinaisGitHubResponse.Linguagem(linguagem, 1)), Instant.now(), "Amostra de testes.");
    }

    private Empresa empresa(String nome) {
        var empresa = new Empresa();
        empresa.setNome(nome);
        empresa.setSlug("fixture-github-" + UUID.randomUUID());
        empresa.setCnpj(Long.toString(ThreadLocalRandom.current().nextLong(10_000_000_000_000L, 100_000_000_000_000L)));
        empresa.setSetor("Tecnologia");
        empresa.setCidade("São Paulo");
        empresa.setUf("SP");
        empresa.setCriadoEm(OffsetDateTime.now());
        empresa.setAtualizadoEm(empresa.getCriadoEm());
        em.persist(empresa);
        return empresa;
    }

    private void contato(StatusIdentidade status, boolean vencido, boolean restrito) {
        var contato = new Contato();
        contato.setEmpresa(em.find(Empresa.class, empresaId));
        contato.setNomeExibicao("Contato exclusivo da fixture");
        contato.setStatusIdentidade(status);
        contato.setCriadoEm(OffsetDateTime.now());
        contato.setAtualizadoEm(contato.getCriadoEm());
        contato.setRevisarAte(OffsetDateTime.now().plusDays(vencido ? -1 : 1));
        em.persist(contato);
        if (restrito) {
            var restricao = new RestricaoUso();
            restricao.setContato(contato);
            restricao.setFinalidade(em.find(FinalidadeTratamento.class, finalidadeId));
            restricao.setRegistradaPor(em.find(Usuario.class, usuarioId));
            restricao.setEscopo(EscopoRestricao.CAMPANHA);
            restricao.setMotivo("Restrição exclusiva da fixture");
            restricao.setCriadaEm(OffsetDateTime.now());
            em.persist(restricao);
        }
    }

    private void autenticar(String perfil) {
        var contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(new UsernamePasswordAuthenticationToken(usuarioId, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + perfil))));
        SecurityContextHolder.setContext(contexto);
    }

    private void tx(Runnable operacao) {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> operacao.run());
    }
}
