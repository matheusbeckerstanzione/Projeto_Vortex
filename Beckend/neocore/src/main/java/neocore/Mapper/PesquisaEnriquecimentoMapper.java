package neocore.Mapper;

import neocore.DTO.pesquisaenriquecimento.PesquisaEnriquecimentoRequest;
import neocore.DTO.pesquisaenriquecimento.PesquisaEnriquecimentoResponse;
import neocore.Model.FinalidadeTratamento;
import neocore.Model.PesquisaEnriquecimento;
import neocore.Model.Usuario;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class PesquisaEnriquecimentoMapper {

    public PesquisaEnriquecimento toEntity(
            PesquisaEnriquecimentoRequest request,
            FinalidadeTratamento finalidade,
            Usuario solicitadoPor
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        PesquisaEnriquecimento entity = new PesquisaEnriquecimento();

        entity.setFinalidade(
                Objects.requireNonNull(finalidade, "finalidade deve ser informada")
        );
        entity.setSolicitadoPor(
                Objects.requireNonNull(solicitadoPor, "solicitadoPor deve ser informado")
        );

        entity.setSetor(request.setor());
        entity.setCidade(request.cidade());
        entity.setUf(request.uf());
        entity.setLimiteEmpresas(request.limiteEmpresas());

        return entity;
    }

    public PesquisaEnriquecimentoResponse toResponse(
            PesquisaEnriquecimento entity
    ) {
        if (entity == null) {
            return null;
        }

        Usuario solicitante = entity.getSolicitadoPor();
        FinalidadeTratamento finalidade = entity.getFinalidade();

        return new PesquisaEnriquecimentoResponse(
                entity.getId(),
                solicitante != null ? solicitante.getId() : null,
                solicitante != null ? solicitante.getNome() : null,
                finalidade != null ? finalidade.getId() : null,
                finalidade != null ? finalidade.getNome() : null,
                entity.getSetor(),
                entity.getCidade(),
                entity.getUf(),
                entity.getLimiteEmpresas(),
                entity.getStatus(),
                entity.getIniciadaEm(),
                entity.getFinalizadaEm(),
                entity.getCriadaEm()
        );
    }
}