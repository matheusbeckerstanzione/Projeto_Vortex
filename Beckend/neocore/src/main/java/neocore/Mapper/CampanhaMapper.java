package neocore.Mapper;

import neocore.DTO.campanha.CampanhaRequest;
import neocore.DTO.campanha.CampanhaResponse;
import neocore.Model.Campanha;
import neocore.Model.FinalidadeTratamento;
import neocore.Model.Segmento;
import neocore.Model.Usuario;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class CampanhaMapper {

    public Campanha toEntity(
            CampanhaRequest request,
            Segmento segmento,
            FinalidadeTratamento finalidade,
            Usuario criadaPor
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        Campanha entity = new Campanha();

        atualizarEntidade(request, entity, segmento, finalidade);

        entity.setCriadaPor(
                Objects.requireNonNull(criadaPor, "criadaPor deve ser informada")
        );

        return entity;
    }

    public void atualizarEntidade(
            CampanhaRequest request,
            Campanha entity,
            Segmento segmento,
            FinalidadeTratamento finalidade
    ) {
        Objects.requireNonNull(request, "request deve ser informado");
        Objects.requireNonNull(entity, "entity deve ser informada");

        entity.setSegmento(
                Objects.requireNonNull(segmento, "segmento deve ser informado")
        );
        entity.setFinalidade(
                Objects.requireNonNull(finalidade, "finalidade deve ser informada")
        );

        entity.setNome(request.nome());
        entity.setObjetivo(request.objetivo());
        entity.setCanal(request.canal());
        entity.setStatus(request.status());

        entity.setCriteriosPublicoSnapshot(
                JsonMapperSupport.copiar(request.criteriosPublicoSnapshot())
        );

        entity.setOrcamento(request.orcamento());
        entity.setInicioEm(request.inicioEm());
        entity.setFimEm(request.fimEm());
    }

    public CampanhaResponse toResponse(Campanha entity) {
        if (entity == null) {
            return null;
        }

        Segmento segmento = entity.getSegmento();
        FinalidadeTratamento finalidade = entity.getFinalidade();
        Usuario autora = entity.getCriadaPor();

        return new CampanhaResponse(
                entity.getId(),
                segmento != null ? segmento.getId() : null,
                segmento != null ? segmento.getNome() : null,
                finalidade != null ? finalidade.getId() : null,
                finalidade != null ? finalidade.getNome() : null,
                entity.getNome(),
                entity.getObjetivo(),
                entity.getCanal(),
                entity.getStatus(),
                JsonMapperSupport.copiar(entity.getCriteriosPublicoSnapshot()),
                entity.getOrcamento(),
                entity.getInicioEm(),
                entity.getFimEm(),
                autora != null ? autora.getId() : null,
                autora != null ? autora.getNome() : null,
                entity.getCriadaEm()
        );
    }
}