package neocore.Mapper;

import neocore.DTO.interacaocontato.InteracaoContatoRequest;
import neocore.DTO.interacaocontato.InteracaoContatoResponse;
import neocore.Model.Campanha;
import neocore.Model.Contato;
import neocore.Model.FinalidadeTratamento;
import neocore.Model.FonteDados;
import neocore.Model.InteracaoContato;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class InteracaoContatoMapper {

    public InteracaoContato toEntity(
            InteracaoContatoRequest request,
            Contato contato,
            Campanha campanha,
            FonteDados fonte,
            FinalidadeTratamento finalidade
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        InteracaoContato entity = new InteracaoContato();

        entity.setContato(
                Objects.requireNonNull(contato, "contato deve ser informado")
        );
        entity.setFonte(
                Objects.requireNonNull(fonte, "fonte deve ser informada")
        );
        entity.setFinalidade(
                Objects.requireNonNull(finalidade, "finalidade deve ser informada")
        );

        entity.setCampanha(campanha);
        entity.setIdentificadorOrigem(request.identificadorOrigem());
        entity.setTipoInteracao(request.tipoInteracao());
        entity.setTema(request.tema());
        entity.setReferenciaOrigem(request.referenciaOrigem());
        entity.setOcorridoEm(request.ocorridoEm());

        return entity;
    }

    public InteracaoContatoResponse toResponse(InteracaoContato entity) {
        if (entity == null) {
            return null;
        }

        Contato contato = entity.getContato();
        Campanha campanha = entity.getCampanha();
        FonteDados fonte = entity.getFonte();
        FinalidadeTratamento finalidade = entity.getFinalidade();

        return new InteracaoContatoResponse(
                entity.getId(),
                contato != null ? contato.getId() : null,
                contato != null ? contato.getNomeExibicao() : null,
                campanha != null ? campanha.getId() : null,
                campanha != null ? campanha.getNome() : null,
                fonte != null ? fonte.getId() : null,
                fonte != null ? fonte.getNome() : null,
                finalidade != null ? finalidade.getId() : null,
                finalidade != null ? finalidade.getNome() : null,
                entity.getIdentificadorOrigem(),
                entity.getTipoInteracao(),
                entity.getTema(),
                entity.getReferenciaOrigem(),
                entity.getOcorridoEm(),
                entity.getCriadoEm()
        );
    }
}