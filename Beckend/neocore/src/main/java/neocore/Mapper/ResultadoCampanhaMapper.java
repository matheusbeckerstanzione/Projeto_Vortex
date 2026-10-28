package neocore.Mapper;

import neocore.DTO.resultadocampanha.ResultadoCampanhaRequest;
import neocore.DTO.resultadocampanha.ResultadoCampanhaResponse;
import neocore.Model.Campanha;
import neocore.Model.FonteDados;
import neocore.Model.ResultadoCampanha;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class ResultadoCampanhaMapper {

    public ResultadoCampanha toEntity(
            ResultadoCampanhaRequest request,
            Campanha campanha,
            FonteDados fonte
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        ResultadoCampanha entity = new ResultadoCampanha();

        atualizarEntidade(request, entity, campanha, fonte);

        return entity;
    }

    public void atualizarEntidade(
            ResultadoCampanhaRequest request,
            ResultadoCampanha entity,
            Campanha campanha,
            FonteDados fonte
    ) {
        Objects.requireNonNull(request, "request deve ser informado");
        Objects.requireNonNull(entity, "entity deve ser informada");

        entity.setCampanha(
                Objects.requireNonNull(campanha, "campanha deve ser informada")
        );
        entity.setFonte(
                Objects.requireNonNull(fonte, "fonte deve ser informada")
        );

        entity.setVariante(request.variante());
        entity.setPeriodoInicio(request.periodoInicio());
        entity.setPeriodoFim(request.periodoFim());
        entity.setEnvios(request.envios());
        entity.setEntregues(request.entregues());
        entity.setCliques(request.cliques());
        entity.setConversoes(request.conversoes());
        entity.setCusto(request.custo());
        entity.setReceita(request.receita());
    }

    public ResultadoCampanhaResponse toResponse(ResultadoCampanha entity) {
        if (entity == null) {
            return null;
        }

        Campanha campanha = entity.getCampanha();
        FonteDados fonte = entity.getFonte();

        return new ResultadoCampanhaResponse(
                entity.getId(),
                campanha != null ? campanha.getId() : null,
                campanha != null ? campanha.getNome() : null,
                fonte != null ? fonte.getId() : null,
                fonte != null ? fonte.getNome() : null,
                entity.getVariante(),
                entity.getPeriodoInicio(),
                entity.getPeriodoFim(),
                entity.getEnvios(),
                entity.getEntregues(),
                entity.getCliques(),
                entity.getConversoes(),
                entity.getCusto(),
                entity.getReceita(),
                entity.getRegistradoEm()
        );
    }
}