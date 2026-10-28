package neocore.Mapper;

import neocore.DTO.finalidadetratamento.FinalidadeTratamentoRequest;
import neocore.DTO.finalidadetratamento.FinalidadeTratamentoResponse;
import neocore.Model.FinalidadeTratamento;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class FinalidadeTratamentoMapper {

    public FinalidadeTratamento toEntity(
            FinalidadeTratamentoRequest request
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        FinalidadeTratamento entity = new FinalidadeTratamento();

        atualizarEntidade(request, entity);

        return entity;
    }

    public void atualizarEntidade(
            FinalidadeTratamentoRequest request,
            FinalidadeTratamento entity
    ) {
        Objects.requireNonNull(request, "request deve ser informado");
        Objects.requireNonNull(entity, "entity deve ser informada");

        entity.setNome(request.nome());
        entity.setDescricao(request.descricao());
        entity.setBaseLegal(request.baseLegal());
        entity.setReferenciaAvaliacao(request.referenciaAvaliacao());
        entity.setRetencaoDias(request.retencaoDias());
        entity.setHabilitada(request.habilitada());
    }

    public FinalidadeTratamentoResponse toResponse(
            FinalidadeTratamento entity
    ) {
        if (entity == null) {
            return null;
        }

        return new FinalidadeTratamentoResponse(
                entity.getId(),
                entity.getNome(),
                entity.getDescricao(),
                entity.getBaseLegal(),
                entity.getReferenciaAvaliacao(),
                entity.getRetencaoDias(),
                entity.getHabilitada(),
                entity.getCriadoEm()
        );
    }
}