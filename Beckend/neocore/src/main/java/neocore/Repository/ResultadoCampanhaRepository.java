package neocore.Repository;

import neocore.Model.ResultadoCampanha;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ResultadoCampanhaRepository extends JpaRepository<ResultadoCampanha, UUID> {

    List<ResultadoCampanha> findAllByCampanhaIdOrderByPeriodoInicioAsc(
            UUID campanhaId
    );

    List<ResultadoCampanha> findAllByFonteId(UUID fonteId);

    List<ResultadoCampanha> findAllByCampanhaIdAndPeriodoInicioGreaterThanEqualAndPeriodoFimLessThanEqual(
            UUID campanhaId,
            LocalDate periodoInicio,
            LocalDate periodoFim
    );
}
