package neocore.Repository;

import neocore.Model.Campanha;
import neocore.Model.Enum.StatusCampanha;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CampanhaRepository extends JpaRepository <Campanha, UUID> {

    List<Campanha> findAllByStatus(StatusCampanha status);

    List<Campanha> findAllBySegmentoId(UUID segmentoId);

    List<Campanha> findAllByCriadaPorIdOrderByCriadaEmDesc(
            UUID usuarioId
    );

    List<Campanha> findAllByFinalidadeId(UUID finalidadeId);

}
