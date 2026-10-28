package neocore.Mapper;

import neocore.DTO.fontedados.FonteDadosRequest;
import neocore.DTO.fontedados.FonteDadosResponse;
import neocore.Model.Empresa;
import neocore.Model.FonteDados;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class FonteDadosMapper {

    public FonteDados toEntity(
            FonteDadosRequest request,
            Empresa empresa
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        FonteDados entity = new FonteDados();

        atualizarEntidade(request, entity, empresa);

        return entity;
    }

    public void atualizarEntidade(
            FonteDadosRequest request,
            FonteDados entity,
            Empresa empresa
    ) {
        Objects.requireNonNull(request, "request deve ser informado");
        Objects.requireNonNull(entity, "entity deve ser informada");

        entity.setEmpresa(empresa);
        entity.setNome(request.nome());
        entity.setTipo(request.tipo());
        entity.setEnderecoOrigem(request.enderecoOrigem());
        entity.setDescricao(request.descricao());
        entity.setCondicoesUso(request.condicoesUso());
        entity.setHabilitada(request.habilitada());
        entity.setAvaliadaEm(request.avaliadaEm());
        entity.setValidaAte(request.validaAte());
    }

    public FonteDadosResponse toResponse(FonteDados entity) {
        if (entity == null) {
            return null;
        }

        Empresa empresa = entity.getEmpresa();

        return new FonteDadosResponse(
                entity.getId(),
                empresa != null ? empresa.getId() : null,
                empresa != null ? empresa.getNome() : null,
                entity.getNome(),
                entity.getTipo(),
                entity.getEnderecoOrigem(),
                entity.getDescricao(),
                entity.getCondicoesUso(),
                entity.getHabilitada(),
                entity.getAvaliadaEm(),
                entity.getValidaAte(),
                entity.getCriadoEm()
        );
    }
}