package neocore.Mapper;

import neocore.DTO.empresa.EmpresaRequest;
import neocore.DTO.empresa.EmpresaResponse;
import neocore.Model.Empresa;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class EmpresaMapper {

    public Empresa toEntity(EmpresaRequest request) {
        Objects.requireNonNull(request, "request deve ser informado");

        Empresa entity = new Empresa();

        atualizarEntidade(request, entity);

        return entity;
    }

    public void atualizarEntidade(
            EmpresaRequest request,
            Empresa entity
    ) {
        Objects.requireNonNull(request, "request deve ser informado");
        Objects.requireNonNull(entity, "entity deve ser informada");

        entity.setNome(request.nome());
        entity.setSlug(request.slug());
        entity.setCnpj(request.cnpj());
        entity.setSetor(request.setor());
        entity.setCidade(request.cidade());
        entity.setUf(request.uf());
        entity.setDescricao(request.descricao());
        entity.setUrlSite(request.urlSite());
    }

    public EmpresaResponse toResponse(Empresa entity) {
        if (entity == null) {
            return null;
        }

        return new EmpresaResponse(
                entity.getId(),
                entity.getNome(),
                entity.getSlug(),
                entity.getCnpj(),
                entity.getSetor(),
                entity.getCidade(),
                entity.getUf(),
                entity.getDescricao(),
                entity.getUrlSite(),
                entity.getCriadoEm(),
                entity.getAtualizadoEm()
        );
    }
}