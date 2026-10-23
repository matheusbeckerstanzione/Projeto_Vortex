package neocore.Repository;

import neocore.Model.Enum.CanalCampanha;
import neocore.Model.Enum.EscopoRestricao;
import neocore.Model.RestricaoUso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RestricaoUsoRepository  extends JpaRepository<RestricaoUso, UUID> {

    List<RestricaoUso> findAllByContatoId(UUID contatoId);

    List<RestricaoUso> findAllByContatoIdAndAtivaTrue(UUID contatoId);

    List<RestricaoUso> findAllByContatoIdAndEscopoAndAtivaTrue(
            UUID contatoId,
            EscopoRestricao escopo
    );

    List<RestricaoUso> findAllByContatoIdAndCanalAndAtivaTrue(
            UUID contatoId,
            CanalCampanha canal
    );
}
