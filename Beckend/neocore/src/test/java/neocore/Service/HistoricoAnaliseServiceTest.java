package neocore.Service;

import com.mongodb.MongoTimeoutException;
import com.mongodb.MongoNamespace;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.result.InsertOneResult;
import neocore.DTO.ia.ChatMarketingResponse;
import neocore.DTO.ia.OperacaoMarketingIa;
import neocore.Exception.IntegracaoExternaException;
import neocore.Model.Enum.PerfilUsuario;
import neocore.Model.Usuario;
import org.bson.Document;
import org.bson.BsonString;
import org.bson.conversions.Bson;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static com.mongodb.client.model.Sorts.descending;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class HistoricoAnaliseServiceTest {

    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final ServiceSupport suporte = mock(ServiceSupport.class);
    private final HistoricoAnaliseService service =
            new HistoricoAnaliseService(mongo, new ObjectMapper(), suporte);

    @Test
    @SuppressWarnings("unchecked")
    void filtraPeloUsuarioAutenticadoELimitaAConsulta() {
        var usuario = autenticar(PerfilUsuario.ANALISTA);
        MongoCollection<Document> colecao = mock(MongoCollection.class);
        FindIterable<Document> consulta = mock(FindIterable.class, RETURNS_SELF);
        var criadoEm = Instant.parse("2026-11-18T13:09:56.656Z");
        var documento = new Document("_id", "analise")
                .append("operacao", "RESUMIR")
                .append("ficticio", true)
                .append("criadoEm", Date.from(criadoEm))
                .append("resposta", new Document("conteudo", new Document("resumo", "Teste")));

        when(mongo.getCollection("historico_analises")).thenReturn(colecao);
        when(colecao.find(any(Bson.class))).thenReturn(consulta);
        when(consulta.into(anyList())).thenAnswer(invocacao -> {
            List<Document> encontrados = invocacao.getArgument(0);
            encontrados.add(documento);
            return encontrados;
        });

        var historico = service.listarMeuHistorico();
        var filtro = ArgumentCaptor.forClass(Bson.class);
        verify(colecao).find(filtro.capture());

        var partes = filtro.getValue().toBsonDocument().getArray("$and");
        assertEquals(usuario.getId().toString(), partes.get(0).asDocument().getString("usuarioId").getValue());
        var opcoes = partes.get(1).asDocument().getArray("$or");
        assertEquals(true, opcoes.get(0).asDocument().getBoolean("ficticio").getValue());
        long data = opcoes.get(1).asDocument().getDocument("expiraEm").getDateTime("$gt").getValue();

        assertTrue(Math.abs(System.currentTimeMillis() - data) < 5000);
        verify(consulta).sort(descending("criadoEm", "_id"));
        verify(consulta).limit(20);
        assertEquals(1, historico.size());
        assertEquals("analise", historico.get(0).id());
        assertEquals(criadoEm, historico.get(0).criadoEm());
        assertEquals("Teste", historico.get(0).resposta().path("conteudo").path("resumo").asString());
    }

    @Test
    @SuppressWarnings("unchecked")
    void gravaRespostaRealComFinalidadeEExpiracao() {
        MongoCollection<Document> colecao = mock(MongoCollection.class);
        when(mongo.getCollection("historico_analises")).thenReturn(colecao);
        when(colecao.getNamespace()).thenReturn(new MongoNamespace("neocore_historico", "historico_analises"));
        when(colecao.insertOne(any(Document.class))).thenReturn(InsertOneResult.acknowledged(new BsonString("id")));

        var geradoEm = Instant.parse("2026-11-18T14:12:29.703Z");
        var usuarioId = UUID.randomUUID();
        var finalidadeId = UUID.randomUUID();
        var resposta = new ChatMarketingResponse(OperacaoMarketingIa.RESUMIR, null,
                List.of(), "Teste", geradoEm, List.of());

        assertTrue(service.salvarReal(usuarioId, resposta, finalidadeId, 7));

        var documento = ArgumentCaptor.forClass(Document.class);
        verify(colecao).insertOne(documento.capture());
        var gravado = documento.getValue();

        assertEquals(false, gravado.getBoolean("ficticio"));
        assertEquals(usuarioId.toString(), gravado.getString("usuarioId"));
        assertEquals(finalidadeId.toString(), gravado.getString("finalidadeId"));
        assertEquals(geradoEm.plus(7, ChronoUnit.DAYS), gravado.getDate("expiraEm").toInstant());
        assertEquals("RESUMIR", gravado.get("resposta", Document.class).getString("operacao"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void salvaExemploSemDataDeExpiracao() {
        MongoCollection<Document> colecao = mock(MongoCollection.class);
        when(mongo.getCollection("historico_analises")).thenReturn(colecao);
        when(colecao.getNamespace()).thenReturn(new MongoNamespace("neocore_historico", "historico_analises"));
        when(colecao.insertOne(any(Document.class))).thenReturn(InsertOneResult.acknowledged(new BsonString("id")));

        var resposta = new ChatMarketingResponse(OperacaoMarketingIa.RESUMIR, null,
                List.of(), "Teste", Instant.now(), List.of());

        assertTrue(service.salvarExemplo(usuarioId(), resposta));

        var documento = ArgumentCaptor.forClass(Document.class);
        verify(colecao).insertOne(documento.capture());
        assertEquals(true, documento.getValue().getBoolean("ficticio"));
        assertFalse(documento.getValue().containsKey("expiraEm"));
    }

    @Test
    void devolve503QuandoOMongoFalha() {
        autenticar(PerfilUsuario.ADMINISTRADOR);
        when(mongo.getCollection("historico_analises"))
                .thenThrow(new MongoTimeoutException("Tempo esgotado"));

        var falha = assertThrows(IntegracaoExternaException.class, service::listarMeuHistorico);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, falha.getStatus());
    }

    private Usuario autenticar(PerfilUsuario perfil) {
        var usuario = new Usuario();
        usuario.setId(UUID.randomUUID());
        usuario.setPerfil(perfil);
        when(suporte.atual()).thenReturn(usuario);
        return usuario;
    }

    private UUID usuarioId() {
        return UUID.randomUUID();
    }
}