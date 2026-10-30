package neocore.Integracao;

import jakarta.persistence.EntityManager;

import neocore.DTO.contato.ContatoResponse;
import neocore.DTO.segmento.SegmentoRequest;
import neocore.DTO.segmentocontato.SegmentoContatoRequest;
import neocore.Exception.ConflitoException;
import neocore.Exception.RegraNegocioException;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Repository.SegmentoContatoRepository;
import neocore.Service.SegmentoService;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.transaction.AfterTransaction;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@ContextConfiguration(
        initializers = IntegracaoBancoTest.BancoSeguro.class
)
@Transactional(isolation = Isolation.REPEATABLE_READ)
public class SegmentacaoIntegracaoTest {

    @Autowired
    private EntityManager em;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private SegmentoService service;

    @Autowired
    private SegmentoContatoRepository membros;

    private Usuario autor;
    private FinalidadeTratamento finalidade;
    private Empresa empresaAlvo;

    private Contato primeiro;
    private Contato segundo;
    private Contato terceiro;
    private Contato fora;

    private String setorAlvo;
    private String cidadeAlvo;

    private final List<UUID> segmentosCriados = new ArrayList<>();

    @BeforeEach
    void prepararDados() {
        assertEquals(
                "neocore_test",
                jdbc.queryForObject(
                        "select current_database()",
                        String.class
                )
        );

        segmentosCriados.clear();

        autor = new Usuario();
        autor.setNome("Analista de teste");
        autor.setEmail(UUID.randomUUID() + "@example.test");
        autor.setPerfil(PerfilUsuario.ANALISTA);
        autor.setStatus(StatusUsuario.ATIVO);
        autor.setCriadoEm(OffsetDateTime.now());
        autor.setAtualizadoEm(autor.getCriadoEm());

        em.persist(autor);

        var autenticacao = new UsernamePasswordAuthenticationToken(
                autor.getId(),
                null,
                List.of(
                        new SimpleGrantedAuthority("ROLE_ANALISTA")
                )
        );

        var contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(autenticacao);
        SecurityContextHolder.setContext(contexto);

        finalidade = finalidade();

        // Valores exclusivos para não misturar registros de outros testes.
        setorAlvo = "Setor-" + UUID.randomUUID();
        cidadeAlvo = "Cidade-" + UUID.randomUUID();

        // Atende ao setor E à cidade.
        empresaAlvo = empresa(setorAlvo, cidadeAlvo, "SP");

        primeiro = contato(
                empresaAlvo,
                StatusIdentidade.VERIFICADA,
                false
        );

        // Atende somente ao setor.
        segundo = contato(
                empresa(
                        setorAlvo,
                        "Outra-" + UUID.randomUUID(),
                        "RJ"
                ),
                StatusIdentidade.VERIFICADA,
                false
        );

        // Atende somente à cidade.
        terceiro = contato(
                empresa(
                        "Outro-" + UUID.randomUUID(),
                        cidadeAlvo,
                        "MG"
                ),
                StatusIdentidade.VERIFICADA,
                false
        );

        // Não atende ao setor nem à cidade.
        fora = contato(
                empresa(
                        "Outro-" + UUID.randomUUID(),
                        "Outra-" + UUID.randomUUID(),
                        "BA"
                ),
                StatusIdentidade.VERIFICADA,
                false
        );

        em.flush();
    }

    @AfterEach
    void limparAutenticacao() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void andExigeTodosOsFiltrosEPreviaNaoGravaParticipantes() {
        UUID segmentoId = segmento(filtros("AND"));

        assertEquals(
                StatusSegmento.RASCUNHO,
                service.buscarPorId(segmentoId).status()
        );

        assertEquals(
                Set.of(primeiro.getId()),
                previa(segmentoId)
        );

        // Consultar a prévia não deve salvar a composição.
        assertTrue(
                membros.findAllBySegmentoId(segmentoId).isEmpty()
        );
    }

    @Test
    void orAceitaQualquerUmDosFiltrosSemRepetirContato() {
        UUID segmentoId = segmento(filtros("OR"));

        assertEquals(
                Set.of(
                        primeiro.getId(),
                        segundo.getId(),
                        terceiro.getId()
                ),
                previa(segmentoId)
        );
    }

    @Test
    void previaPaginadaNaoPerdeNemRepeteContatos() {
        UUID segmentoId = segmento(filtros("OR"));

        var paginaUm = service.previa(segmentoId, 0, 2);
        var paginaDois = service.previa(segmentoId, 1, 2);

        assertEquals(3L, paginaUm.getTotalElements());
        assertEquals(3L, paginaDois.getTotalElements());

        assertEquals(2, paginaUm.getNumberOfElements());
        assertEquals(1, paginaDois.getNumberOfElements());

        Set<UUID> encontrados = paginaUm.getContent()
                .stream()
                .map(ContatoResponse::id)
                .collect(Collectors.toSet());

        for (var contato : paginaDois.getContent()) {
            assertTrue(
                    encontrados.add(contato.id()),
                    "O contato não pode aparecer em duas páginas."
            );
        }

        assertEquals(
                Set.of(
                        primeiro.getId(),
                        segundo.getId(),
                        terceiro.getId()
                ),
                encontrados
        );
    }

    @Test
    void recalcularDuasVezesMantemUmaAssociacaoPorContato() {
        UUID segmentoId = segmento(filtros("OR"));

        assertEquals(3L, service.recalcular(segmentoId));

        em.flush();
        em.clear();

        assertEquals(3L, service.recalcular(segmentoId));

        em.flush();
        em.clear();

        var participantes =
                membros.findAllBySegmentoId(segmentoId);

        assertEquals(3, participantes.size());

        Set<UUID> contatos = participantes.stream()
                .map(membro -> membro.getContato().getId())
                .collect(Collectors.toSet());

        assertEquals(
                Set.of(
                        primeiro.getId(),
                        segundo.getId(),
                        terceiro.getId()
                ),
                contatos
        );
    }

    @Test
    void contatosNaoVerificadosRejeitadosOuExpiradosNaoEntram() {
        contato(
                empresaAlvo,
                StatusIdentidade.NAO_VERIFICADA,
                false
        );

        contato(
                empresaAlvo,
                StatusIdentidade.REJEITADA,
                false
        );

        contato(
                empresaAlvo,
                StatusIdentidade.VERIFICADA,
                true
        );

        em.flush();

        UUID segmentoId = segmento(
                Map.of(
                        "empresaId",
                        empresaAlvo.getId().toString()
                )
        );

        assertEquals(
                Set.of(primeiro.getId()),
                previa(segmentoId)
        );

        assertEquals(1L, service.recalcular(segmentoId));
    }

    @Test
    void restricoesAtivasAplicaveisBloqueiamMasInativasOuDeOutraFinalidadeNao() {
        var bloqueado = contato(
                empresaAlvo,
                StatusIdentidade.VERIFICADA,
                false
        );

        var liberado = contato(
                empresaAlvo,
                StatusIdentidade.VERIFICADA,
                false
        );

        var outraFinalidade = contato(
                empresaAlvo,
                StatusIdentidade.VERIFICADA,
                false
        );

        // Restrição global ativa: bloqueia o primeiro contato.
        restricao(
                primeiro,
                EscopoRestricao.TODOS,
                null,
                true
        );

        // Restrição ativa para a finalidade deste segmento.
        restricao(
                bloqueado,
                EscopoRestricao.CAMPANHA,
                finalidade,
                true
        );

        // Restrição encerrada não deve bloquear.
        restricao(
                liberado,
                EscopoRestricao.TODOS,
                null,
                false
        );

        // Restrição específica de outra finalidade não deve bloquear.
        restricao(
                outraFinalidade,
                EscopoRestricao.CAMPANHA,
                finalidade(),
                true
        );

        em.flush();

        UUID segmentoId = segmento(
                Map.of(
                        "empresaId",
                        empresaAlvo.getId().toString()
                )
        );

        assertEquals(
                Set.of(
                        liberado.getId(),
                        outraFinalidade.getId()
                ),
                previa(segmentoId)
        );

        assertEquals(2L, service.recalcular(segmentoId));
    }

    @Test
    void associacaoManualNaoPermiteRepetirContato() {
        UUID segmentoId = segmento(filtros("AND"));

        var request = new SegmentoContatoRequest(
                segmentoId,
                primeiro.getId(),
                "Inclusao de teste"
        );

        service.associar(request);
        em.flush();

        assertEquals(
                1,
                membros.findAllBySegmentoId(segmentoId).size()
        );

        assertThrows(
                ConflitoException.class,
                () -> service.associar(request)
        );
    }

    @Test
    void associacaoManualRejeitaContatoForaDosCriterios() {
        UUID segmentoId = segmento(filtros("AND"));

        var request = new SegmentoContatoRequest(
                segmentoId,
                fora.getId(),
                "Tentativa de teste"
        );

        assertThrows(
                RegraNegocioException.class,
                () -> service.associar(request)
        );
    }

    private Map<String, Object> filtros(String modo) {
        return Map.of(
                "modo", modo,
                "setor", setorAlvo,
                "cidade", cidadeAlvo
        );
    }

    private UUID segmento(Map<String, Object> criterios) {
        var request = new SegmentoRequest(
                "Segmento de teste",
                "Cenario automatizado",
                criterios,
                finalidade.getId(),
                StatusSegmento.RASCUNHO
        );

        UUID segmentoId = service.cadastrar(request).id();

        segmentosCriados.add(segmentoId);

        em.flush();

        return segmentoId;
    }

    private Set<UUID> previa(UUID segmentoId) {
        return service.previa(segmentoId, 0, 100)
                .getContent()
                .stream()
                .map(ContatoResponse::id)
                .collect(Collectors.toSet());
    }

    private FinalidadeTratamento finalidade() {
        var entidade = new FinalidadeTratamento();

        entidade.setNome("Finalidade de teste");
        entidade.setDescricao(
                "Fixture exclusiva do teste automatizado"
        );
        entidade.setBaseLegal(
                "Base de teste, sem uso operacional"
        );
        entidade.setRetencaoDias(90);
        entidade.setHabilitada(true);
        entidade.setCriadoEm(OffsetDateTime.now());

        em.persist(entidade);

        return entidade;
    }

    private Empresa empresa(
            String setor,
            String cidade,
            String uf) {

        var entidade = new Empresa();

        entidade.setNome("Empresa de teste");
        entidade.setSlug("teste-" + UUID.randomUUID());

        entidade.setCnpj(
                Long.toString(
                        ThreadLocalRandom.current().nextLong(
                                10_000_000_000_000L,
                                100_000_000_000_000L
                        )
                )
        );

        entidade.setSetor(setor);
        entidade.setCidade(cidade);
        entidade.setUf(uf);
        entidade.setCriadoEm(OffsetDateTime.now());
        entidade.setAtualizadoEm(entidade.getCriadoEm());

        em.persist(entidade);

        return entidade;
    }

    private Contato contato(
            Empresa empresa,
            StatusIdentidade status,
            boolean expirado) {

        var entidade = new Contato();

        entidade.setEmpresa(empresa);
        entidade.setNomeExibicao("Contato de teste");
        entidade.setStatusIdentidade(status);
        entidade.setCriadoEm(OffsetDateTime.now());
        entidade.setAtualizadoEm(entidade.getCriadoEm());

        entidade.setRevisarAte(
                expirado
                        ? OffsetDateTime.now().minusDays(1)
                        : OffsetDateTime.now().plusDays(30)
        );

        em.persist(entidade);

        return entidade;
    }

    private void restricao(
            Contato contato,
            EscopoRestricao escopo,
            FinalidadeTratamento finalidade,
            boolean ativa) {

        var entidade = new RestricaoUso();

        entidade.setContato(contato);
        entidade.setEscopo(escopo);
        entidade.setFinalidade(finalidade);
        entidade.setAtiva(ativa);
        entidade.setMotivo("Restricao criada pelo teste");
        entidade.setRegistradaPor(autor);
        entidade.setCriadaEm(OffsetDateTime.now());

        if (!ativa) {
            entidade.setEncerradaEm(OffsetDateTime.now());
        }

        em.persist(entidade);
    }

    @AfterTransaction
    void confirmarRollbackDosSegmentos() {
        for (UUID segmentoId : segmentosCriados) {
            assertEquals(
                    0L,
                    jdbc.queryForObject(
                            "select count(*) from segmentos where id = ?",
                            Long.class,
                            segmentoId
                    ).longValue()
            );

            assertEquals(
                    0L,
                    jdbc.queryForObject(
                            "select count(*) from segmento_contatos "
                                    + "where segmento_id = ?",
                            Long.class,
                            segmentoId
                    ).longValue()
            );
        }
    }
}