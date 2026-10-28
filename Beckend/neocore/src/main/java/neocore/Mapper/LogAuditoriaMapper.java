package neocore.Mapper;

import neocore.DTO.logauditoria.LogAuditoriaResponse;
import neocore.Model.LogAuditoria;
import neocore.Model.Usuario;
import org.springframework.stereotype.Component;

@Component
public class LogAuditoriaMapper {

    public LogAuditoriaResponse toResponse(LogAuditoria entity) {
        if (entity == null) {
            return null;
        }

        Usuario usuario = entity.getUsuario();

        return new LogAuditoriaResponse(
                entity.getId(),
                usuario != null ? usuario.getId() : null,
                usuario != null ? usuario.getNome() : null,
                entity.getAcao(),
                entity.getTipoRecurso(),
                entity.getRecursoId(),
                entity.getResultado(),
                entity.getOcorridoEm()
        );
    }
}