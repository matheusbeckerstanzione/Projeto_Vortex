package neocore.Mapper;

import neocore.DTO.atributoempresa.AtributoEmpresaResponse;
import neocore.Model.*;
import org.springframework.stereotype.Component;
import neocore.DTO.atributoempresa.AtributoEmpresaRequest;

import java.util.Objects;

@Component
public class AtributoEmpresaMapper {

    public AtributoEmpresa toEntity(
            AtributoEmpresaRequest request,
            Empresa empresa,
            FonteDados fonte,
            FinalidadeTratamento finalidade
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        AtributoEmpresa entity = new AtributoEmpresa();

        entity.setEmpresa(
                Objects.requireNonNull(empresa, "empresa deve ser informada")
        );
        entity.setFonte(
                Objects.requireNonNull(fonte, "fonte deve ser informada")
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

    public AtributoEmpresaResponse toResponse(AtributoEmpresa entity) {
        if (entity == null) {
            return null;
        }

        Empresa empresa = entity.getEmpresa();
        FonteDados fonte = entity.getFonte();
        FinalidadeTratamento finalidade = entity.getFinalidade();
        Usuario revisor = entity.getRevisadoPor();

        return new AtributoEmpresaResponse(
                entity.getId(),
                empresa != null ? empresa.getId() : null,
                empresa != null ? empresa.getNome() : null,
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
