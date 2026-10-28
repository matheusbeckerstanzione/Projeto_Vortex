package neocore.Mapper;

import neocore.DTO.usuario.UsuarioAtualizacaoRequest;
import neocore.DTO.usuario.UsuarioCadastroRequest;
import neocore.DTO.usuario.UsuarioResponse;
import neocore.Model.Usuario;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class UsuarioMapper {

    public Usuario toEntity(UsuarioCadastroRequest request) {
        Objects.requireNonNull(request, "request deve ser informado");

        Usuario entity = new Usuario();

        entity.setNome(request.nome());
        entity.setEmail(request.email());
        entity.setPerfil(request.perfil());

        return entity;
    }

    public void atualizarEntidade(
            UsuarioAtualizacaoRequest request,
            Usuario entity
    ) {
        Objects.requireNonNull(request, "request deve ser informado");
        Objects.requireNonNull(entity, "entity deve ser informada");

        entity.setNome(request.nome());
        entity.setEmail(request.email());
    }

    public UsuarioResponse toResponse(Usuario entity) {
        if (entity == null) {
            return null;
        }

        return new UsuarioResponse(
                entity.getId(),
                entity.getNome(),
                entity.getEmail(),
                entity.getPerfil(),
                entity.getStatus(),
                entity.getCriadoEm(),
                entity.getAtivadoEm(),
                entity.getAtualizadoEm()
        );
    }
}