package neocore.Mapper;

import neocore.DTO.conviteacesso.ConviteAcessoResponse;
import neocore.DTO.conviteacesso.CriacaoConviteRequest;
import neocore.Model.ConviteAcesso;
import neocore.Model.Usuario;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class ConviteAcessoMapper {

    public ConviteAcesso toEntity(
            CriacaoConviteRequest request,
            Usuario usuario,
            Usuario criadoPor
    ) {
        Objects.requireNonNull(request, "request deve ser informado");

        ConviteAcesso entity = new ConviteAcesso();

        entity.setUsuario(
                Objects.requireNonNull(usuario, "usuario deve ser informado")
        );

        entity.setCriadoPor(criadoPor);
        entity.setExpiraEm(request.expiraEm());

        return entity;
    }

    public ConviteAcessoResponse toResponse(ConviteAcesso entity) {
        if (entity == null) {
            return null;
        }

        Usuario usuario = entity.getUsuario();
        Usuario autor = entity.getCriadoPor();

        return new ConviteAcessoResponse(
                entity.getId(),
                usuario != null ? usuario.getId() : null,
                usuario != null ? usuario.getNome() : null,
                usuario != null ? usuario.getEmail() : null,
                autor != null ? autor.getId() : null,
                entity.getCriadoEm(),
                entity.getExpiraEm(),
                entity.getUtilizadoEm(),
                entity.getRevogadoEm()
        );
    }
}