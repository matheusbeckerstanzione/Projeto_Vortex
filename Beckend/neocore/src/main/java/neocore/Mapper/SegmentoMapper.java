package neocore.Mapper;

import neocore.DTO.segmento.SegmentoRequest;
import neocore.DTO.segmento.SegmentoResponse;
import neocore.Model.FinalidadeTratamento;
import neocore.Model.Segmento;
import neocore.Model.Usuario;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class SegmentoMapper {

    public Segmento toEntity(
            SegmentoRequest request,
            FinalidadeTratamento finalidade,
            Usuario criadoPor
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        Segmento entity = new Segmento();

        atualizarEntidade(request, entity, finalidade);

        entity.setCriadoPor(
                Objects.requireNonNull(criadoPor, "criadoPor deve ser informado")
        );

        return entity;
    }

    public void atualizarEntidade(
            SegmentoRequest request,
            Segmento entity,
            FinalidadeTratamento finalidade
    ) {
        Objects.requireNonNull(request, "request deve ser informado");
        Objects.requireNonNull(entity, "entity deve ser informada");

        entity.setFinalidade(
                Objects.requireNonNull(finalidade, "finalidade deve ser informada")
        );

        entity.setNome(request.nome());
        entity.setDescricao(request.descricao());
        entity.setCriterios(JsonMapperSupport.copiar(request.criterios()));
        entity.setStatus(request.status());
    }

    public SegmentoResponse toResponse(Segmento entity) {
        if (entity == null) {
            return null;
        }

        FinalidadeTratamento finalidade = entity.getFinalidade();
        Usuario autor = entity.getCriadoPor();

        return new SegmentoResponse(
                entity.getId(),
                entity.getNome(),
                entity.getDescricao(),
                JsonMapperSupport.copiar(entity.getCriterios()),
                finalidade != null ? finalidade.getId() : null,
                finalidade != null ? finalidade.getNome() : null,
                entity.getStatus(),
                autor != null ? autor.getId() : null,
                autor != null ? autor.getNome() : null,
                entity.getCriadoEm(),
                entity.getAtualizadoEm()
        );
    }
}