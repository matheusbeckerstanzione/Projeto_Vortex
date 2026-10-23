package neocore.Repository;

import neocore.Model.Enum.ResultadoAuditoria;
import neocore.Model.LogAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LogAuditoriaRepository extends JpaRepository<LogAuditoria, Long> {

    List<LogAuditoria> findAllByUsuarioIdOrderByOcorridoEmDesc(
            UUID usuarioId
    );

    List<LogAuditoria> findAllByTipoRecursoAndRecursoIdOrderByOcorridoEmDesc(
            String tipoRecurso,
            UUID recursoId
    );

    List<LogAuditoria> findAllByResultadoOrderByOcorridoEmDesc(
            ResultadoAuditoria resultado
    );
}
