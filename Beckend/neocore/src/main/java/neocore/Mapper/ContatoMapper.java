package neocore.Mapper;

import neocore.DTO.contato.ContatoRequest;
import neocore.DTO.contato.ContatoResponse;
import neocore.Model.Contato;
import neocore.Model.Empresa;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class ContatoMapper {

    public Contato toEntity(
            ContatoRequest request,
            Empresa empresa
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        Contato entity = new Contato();

        atualizarEntidade(request, entity, empresa);

        return entity;
    }

    public void atualizarEntidade(
            ContatoRequest request,
            Contato entity,
            Empresa empresa
    ) {
        Objects.requireNonNull(request, "request deve ser informado");
        Objects.requireNonNull(entity, "entity deve ser informada");

        entity.setEmpresa(
                Objects.requireNonNull(empresa, "empresa deve ser informada")
        );

        entity.setNomeExibicao(request.nomeExibicao());
        entity.setStatusIdentidade(request.statusIdentidade());
        entity.setRevisarAte(request.revisarAte());
    }

    public ContatoResponse toResponse(Contato entity) {
        if (entity == null) {
            return null;
        }

        Empresa empresa = entity.getEmpresa();

        return new ContatoResponse(
                entity.getId(),
                empresa != null ? empresa.getId() : null,
                empresa != null ? empresa.getNome() : null,
                entity.getNomeExibicao(),
                entity.getStatusIdentidade(),
                entity.getCriadoEm(),
                entity.getRevisarAte(),
                entity.getAtualizadoEm()
        );
    }
}