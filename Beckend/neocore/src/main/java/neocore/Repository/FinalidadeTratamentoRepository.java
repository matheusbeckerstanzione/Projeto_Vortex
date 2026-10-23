package neocore.Repository;

import neocore.Model.FinalidadeTratamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FinalidadeTratamentoRepository extends JpaRepository<FinalidadeTratamento, UUID> {
    Optional<FinalidadeTratamento> findByNomeIgnoreCase(String nome);

    List<FinalidadeTratamento> findAllByHabilitadaTrue();

    boolean existsByNomeIgnoreCase(String nome);
}
