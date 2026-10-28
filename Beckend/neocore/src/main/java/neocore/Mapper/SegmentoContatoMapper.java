package neocore.Mapper;

import neocore.DTO.segmentocontato.SegmentoContatoRequest;
import neocore.DTO.segmentocontato.SegmentoContatoResponse;
import neocore.Model.Contato;
import neocore.Model.Segmento;
import neocore.Model.SegmentoContato;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class SegmentoContatoMapper {

    public SegmentoContato toEntity(
            SegmentoContatoRequest request,
            Segmento segmento,
            Contato contato
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        SegmentoContato entity = new SegmentoContato();

        entity.setSegmento(
                Objects.requireNonNull(segmento, "segmento deve ser informado")
        );
        entity.setContato(
                Objects.requireNonNull(contato, "contato deve ser informado")
        );

        entity.setMotivoInclusao(request.motivoInclusao());

        return entity;
    }

    public SegmentoContatoResponse toResponse(SegmentoContato entity) {
        if (entity == null) {
            return null;
        }

        Segmento segmento = entity.getSegmento();
        Contato contato = entity.getContato();

        return new SegmentoContatoResponse(
                entity.getId(),
                segmento != null ? segmento.getId() : null,
                segmento != null ? segmento.getNome() : null,
                contato != null ? contato.getId() : null,
                contato != null ? contato.getNomeExibicao() : null,
                entity.getMotivoInclusao(),
                entity.getAvaliadoEm()
        );
    }
}