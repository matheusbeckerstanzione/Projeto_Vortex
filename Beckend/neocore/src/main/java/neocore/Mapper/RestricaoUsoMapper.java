package neocore.Mapper;

import neocore.DTO.restricaouso.RestricaoUsoRequest;
import neocore.DTO.restricaouso.RestricaoUsoResponse;
import neocore.Model.Contato;
import neocore.Model.FinalidadeTratamento;
import neocore.Model.RestricaoUso;
import neocore.Model.Usuario;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class RestricaoUsoMapper {

    public RestricaoUso toEntity(
            RestricaoUsoRequest request,
            Contato contato,
            FinalidadeTratamento finalidade,
            Usuario registradaPor
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        RestricaoUso entity = new RestricaoUso();

        entity.setContato(
                Objects.requireNonNull(contato, "contato deve ser informado")
        );
        entity.setRegistradaPor(
                Objects.requireNonNull(registradaPor, "registradaPor deve ser informada")
        );

        entity.setFinalidade(finalidade);
        entity.setEscopo(request.escopo());
        entity.setCanal(request.canal());
        entity.setMotivo(request.motivo());

        return entity;
    }

    public RestricaoUsoResponse toResponse(RestricaoUso entity) {
        if (entity == null) {
            return null;
        }

        Contato contato = entity.getContato();
        FinalidadeTratamento finalidade = entity.getFinalidade();
        Usuario autora = entity.getRegistradaPor();

        return new RestricaoUsoResponse(
                entity.getId(),
                contato != null ? contato.getId() : null,
                contato != null ? contato.getNomeExibicao() : null,
                finalidade != null ? finalidade.getId() : null,
                finalidade != null ? finalidade.getNome() : null,
                entity.getEscopo(),
                entity.getCanal(),
                entity.getMotivo(),
                entity.getAtiva(),
                autora != null ? autora.getId() : null,
                autora != null ? autora.getNome() : null,
                entity.getCriadaEm(),
                entity.getEncerradaEm()
        );
    }
}