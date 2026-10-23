package neocore.Repository;

import neocore.Model.SegmentoContato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SegmentoContatoRepository extends JpaRepository<SegmentoContato, UUID> {

    List<SegmentoContato> findAllBySegmentoId(UUID segmentoId);

    List<SegmentoContato> findAllByContatoId(UUID contatoId);

    Optional<SegmentoContato> findBySegmentoIdAndContatoId(
            UUID segmentoId,
            UUID contatoId
    );

    boolean existsBySegmentoIdAndContatoId(
            UUID segmentoId,
            UUID contatoId
    );

    void deleteBySegmentoIdAndContatoId(
            UUID segmentoId,
            UUID contatoId
    );
}
