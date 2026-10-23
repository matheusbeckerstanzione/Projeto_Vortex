package neocore.Repository;

import neocore.Model.AtributoContato;
import neocore.Model.Enum.CampoContato;
import neocore.Model.Enum.StatusRevisao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AtributoContatoRepository extends JpaRepository <AtributoContato, UUID>{

    List<AtributoContato> findAllByContatoId(UUID contatoId);

    List<AtributoContato> findAllByContatoIdAndCampo(
            UUID contatoId,
            CampoContato campo
    );

    List<AtributoContato> findAllByStatusRevisao(
            StatusRevisao statusRevisao
    );

    List<AtributoContato> findAllByContatoIdAndStatusRevisao(
            UUID contatoId,
            StatusRevisao statusRevisao
    );
}
