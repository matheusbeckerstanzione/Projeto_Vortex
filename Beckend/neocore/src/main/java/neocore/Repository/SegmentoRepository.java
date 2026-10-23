package neocore.Repository;

import neocore.Model.Enum.StatusSegmento;
import neocore.Model.Segmento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SegmentoRepository extends JpaRepository<Segmento, UUID> {

    List<Segmento> findAllByStatus(StatusSegmento status);

    List<Segmento> findAllByCriadoPorIdOrderByCriadoEmDesc(
            UUID usuarioId
    );

    List<Segmento> findAllByFinalidadeId(UUID finalidadeId);

}
