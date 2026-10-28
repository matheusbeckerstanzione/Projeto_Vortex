package neocore.Mapper;

import neocore.DTO.atributocontato.AtributoContatoRequest;
import neocore.DTO.atributocontato.AtributoContatoResponse;
import neocore.Model.*;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class AtributoContatoMapper {

    public AtributoContato toEntity(
          AtributoContatoRequest request,
          Contato contato,
          FonteDados fonteDados,
          FinalidadeTratamento finalidade
    ){
        Objects.requireNonNull(request, "request deve ser informado");

        AtributoContato entity = new AtributoContato();

        entity.setContato(
                Objects.requireNonNull(contato, "contato deve ser informado")
        );
        entity.setFonteDados(
                Objects.requireNonNull(fonteDados, "fonteDados deve ser informada")
        );
        entity.setFinalidade(
                Objects.requireNonNull(finalidade, "finalidade deve ser informada")
        );

        entity.setCampo(request.campo());
        entity.setValor(request.valor());
        entity.setReferenciaOrigem(request.referenciaOrigem());
        entity.setTrechoEvidencia(request.trechoEvidencia());
        entity.setMetodoObtencao(request.metodoObtencao());
        entity.setValidoAte(request.validoAte());

        return entity;
    }

    public AtributoContatoResponse toResponse(AtributoContato entity) {
        if (entity == null) {
            return null;
        }

        Contato contato = entity.getContato();
        FonteDados fonte = entity.getFonteDados();
        FinalidadeTratamento finalidade = entity.getFinalidade();
        Usuario revisor = entity.getRevisadoPor();

        return new AtributoContatoResponse(
                entity.getId(),
                contato != null ? contato.getId() : null,
                contato != null ? contato.getNomeExibicao() : null,
                fonte != null ? fonte.getId() : null,
                fonte != null ? fonte.getNome() : null,
                finalidade != null ? finalidade.getId() : null,
                finalidade != null ? finalidade.getNome() : null,
                entity.getCampo(),
                entity.getValor(),
                entity.getReferenciaOrigem(),
                entity.getTrechoEvidencia(),
                entity.getMetodoObtencao(),
                entity.getStatusRevisao(),
                revisor != null ? revisor.getId() : null,
                revisor != null ? revisor.getNome() : null,
                entity.getMotivoRevisao(),
                entity.getColetadoEm(),
                entity.getRevisadoEm(),
                entity.getValidoAte()
        );
    }
}
