package neocore.Mapper;

import neocore.DTO.solicitacaoacesso.SolicitacaoAcessoRequest;
import neocore.DTO.solicitacaoacesso.SolicitacaoAcessoResponse;
import neocore.Model.SolicitacaoAcesso;
import neocore.Model.Usuario;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class SolicitacaoAcessoMapper {

    public SolicitacaoAcesso toEntity(
            SolicitacaoAcessoRequest request
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        SolicitacaoAcesso entity = new SolicitacaoAcesso();

        entity.setNome(request.nome());
        entity.setEmail(request.email());
        entity.setJustificativa(request.justificativa());

        return entity;
    }

    public SolicitacaoAcessoResponse toResponse(
            SolicitacaoAcesso entity
    ) {
        if (entity == null) {
            return null;
        }

        Usuario avaliador = entity.getAvaliadoPor();

        return new SolicitacaoAcessoResponse(
                entity.getId(),
                entity.getNome(),
                entity.getEmail(),
                entity.getJustificativa(),
                entity.getStatus(),
                avaliador != null ? avaliador.getId() : null,
                avaliador != null ? avaliador.getNome() : null,
                entity.getSolicitadoEm(),
                entity.getAvaliadoEm()
        );
    }
}