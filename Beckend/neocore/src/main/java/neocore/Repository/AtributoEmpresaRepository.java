package neocore.Repository;

import neocore.Model.AtributoEmpresa;
import neocore.Model.Enum.CampoEmpresa;
import neocore.Model.Enum.StatusRevisao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AtributoEmpresaRepository extends JpaRepository <AtributoEmpresa, UUID> {

    List<AtributoEmpresa> findAllByEmpresaId(UUID empresaId);

    List<AtributoEmpresa> findAllByEmpresaIdAndCampo(
            UUID empresaId,
            CampoEmpresa campo
    );

    List<AtributoEmpresa> findAllByStatusRevisao(
            StatusRevisao statusRevisao
    );

    List<AtributoEmpresa> findAllByEmpresaIdAndStatusRevisao(
            UUID empresaId,
            StatusRevisao statusRevisao
    );

}
