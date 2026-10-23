package neocore.Repository;

import neocore.Model.Enum.StatusTarefa;
import neocore.Model.TarefaColeta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
public interface TarefaColetaRepository extends JpaRepository<TarefaColeta, UUID> {

    Optional<TarefaColeta> findByChaveIdempotencia(
            String chaveIdempotencia
    );

    boolean existsByChaveIdempotencia(String chaveIdempotencia);

    List<TarefaColeta> findAllByPesquisaId(UUID pesquisaId);

    List<TarefaColeta> findAllByStatusOrderByDisponivelEmAsc(
            StatusTarefa status
    );
}
