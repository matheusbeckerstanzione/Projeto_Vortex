package neocore.Mapper;

import neocore.DTO.tarefacoleta.TarefaColetaRequest;
import neocore.DTO.tarefacoleta.TarefaColetaResponse;
import neocore.Model.FonteDados;
import neocore.Model.PesquisaEnriquecimento;
import neocore.Model.TarefaColeta;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class TarefaColetaMapper {

    public TarefaColeta toEntity(
            TarefaColetaRequest request,
            PesquisaEnriquecimento pesquisa,
            FonteDados fonte
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        TarefaColeta entity = new TarefaColeta();

        entity.setPesquisa(
                Objects.requireNonNull(pesquisa, "pesquisa deve ser informada")
        );
        entity.setFonte(
                Objects.requireNonNull(fonte, "fonte deve ser informada")
        );

        entity.setUrlPagina(request.urlPagina());
        entity.setChaveIdempotencia(request.chaveIdempotencia());
        entity.setDisponivelEm(request.disponivelEm());

        return entity;
    }

    public TarefaColetaResponse toResponse(TarefaColeta entity) {
        if (entity == null) {
            return null;
        }

        PesquisaEnriquecimento pesquisa = entity.getPesquisa();
        FonteDados fonte = entity.getFonte();

        return new TarefaColetaResponse(
                entity.getId(),
                pesquisa != null ? pesquisa.getId() : null,
                fonte != null ? fonte.getId() : null,
                fonte != null ? fonte.getNome() : null,
                entity.getUrlPagina(),
                entity.getChaveIdempotencia(),
                entity.getStatus(),
                entity.getTentativas(),
                entity.getDisponivelEm(),
                entity.getReservadaEm(),
                entity.getCodigoErro(),
                entity.getCriadaEm(),
                entity.getFinalizadaEm()
        );
    }
}