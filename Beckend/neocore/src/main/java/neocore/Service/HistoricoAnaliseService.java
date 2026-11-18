package neocore.Service;

import com.mongodb.MongoException;
import neocore.DTO.ia.ChatMarketingResponse;
import neocore.DTO.ia.HistoricoAnaliseResponse;
import neocore.Exception.AcessoNegadoException;
import neocore.Exception.IntegracaoExternaException;
import neocore.Model.Enum.PerfilUsuario;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static com.mongodb.client.model.Filters.and;
import static com.mongodb.client.model.Filters.eq;
import static com.mongodb.client.model.Filters.gt;
import static com.mongodb.client.model.Filters.or;
import static com.mongodb.client.model.Sorts.descending;

@Service
public class HistoricoAnaliseService {

    private static final Logger log =
            LoggerFactory.getLogger(HistoricoAnaliseService.class);
    private static final String COLECAO = "historico_analises";
    private static final int LIMITE = 20;

    private final MongoTemplate mongo;
    private final ObjectMapper mapper;
    private final ServiceSupport suporte;

    public HistoricoAnaliseService(
            MongoTemplate mongo,
            ObjectMapper mapper,
            ServiceSupport suporte
    ) {
        this.mongo = mongo;
        this.mapper = mapper;
        this.suporte = suporte;
    }

    public boolean salvarExemplo(UUID usuarioId, ChatMarketingResponse resposta) {
        return salvar(usuarioId, resposta, null, null);
    }

    public boolean salvarReal(
            UUID usuarioId,
            ChatMarketingResponse resposta,
            UUID finalidadeId,
            int retencaoDias
    ) {
        Instant expiraEm = resposta.geradoEm().plus(retencaoDias, ChronoUnit.DAYS);
        return salvar(usuarioId, resposta, finalidadeId, expiraEm);
    }

    private boolean salvar(
            UUID usuarioId,
            ChatMarketingResponse resposta,
            UUID finalidadeId,
            Instant expiraEm
    ) {
        try {
            String id = UUID.randomUUID().toString();

            Document documento = new Document("_id", id)
                    .append("usuarioId", usuarioId.toString())
                    .append("operacao", resposta.operacao().name())
                    .append("ficticio", expiraEm == null)
                    .append("criadoEm", Date.from(resposta.geradoEm()))
                    .append("resposta", Document.parse(mapper.writeValueAsString(resposta)));

            if (expiraEm != null) {
                documento.append("finalidadeId", finalidadeId.toString())
                        .append("expiraEm", Date.from(expiraEm));
            }

            var colecao = mongo.getCollection(COLECAO);
            var resultado = colecao.insertOne(documento);

            if (!resultado.wasAcknowledged()) {
                log.warn("MongoDB não confirmou a gravação do histórico em {}.",
                        colecao.getNamespace().getFullName());
                return false;
            }

            log.info("Histórico gravado em {}. ID: {}",
                    colecao.getNamespace().getFullName(), id);
            return true;
        } catch (MongoException | DataAccessException | JacksonException e) {
            log.warn("Falha ao salvar a análise no histórico: {}",
                    e.getClass().getSimpleName());
            return false;
        }
    }

    public List<HistoricoAnaliseResponse> listarMeuHistorico() {
        var usuario = suporte.atual();

        if (usuario.getPerfil() != PerfilUsuario.ADMINISTRADOR
                && usuario.getPerfil() != PerfilUsuario.ANALISTA) {
            throw new AcessoNegadoException("Acesso não permitido ao histórico.");
        }

        List<Document> documentos;
        try {
            documentos = mongo.getCollection(COLECAO)
                    .find(and(
                            eq("usuarioId", usuario.getId().toString()),
                            or(
                                    eq("ficticio", true),
                                    gt("expiraEm", Date.from(Instant.now()))
                            )
                    ))
                    .sort(descending("criadoEm", "_id"))
                    .limit(LIMITE)
                    .into(new ArrayList<>());
        } catch (MongoException | DataAccessException e) {
            log.warn("Falha ao consultar o histórico: {}", e.getClass().getSimpleName());
            throw new IntegracaoExternaException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "O histórico de análises está temporariamente indisponível."
            );
        }

        return documentos.stream()
                .map(documento -> new HistoricoAnaliseResponse(
                        documento.getString("_id"),
                        documento.getString("operacao"),
                        documento.getBoolean("ficticio", false),
                        documento.getDate("criadoEm").toInstant(),
                        mapper.readTree(documento.get("resposta", Document.class).toJson())
                ))
                .toList();
    }
}