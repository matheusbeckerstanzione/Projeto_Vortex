package neocore.Repository;

import neocore.Model.Contato;
import neocore.Model.Enum.StatusIdentidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ContatoRepository extends JpaRepository<Contato, UUID> {

    List<Contato> findAllByEmpresaId(UUID empresaId);

    List<Contato> findAllByStatusIdentidade(
            StatusIdentidade statusIdentidade
    );

    List<Contato> findAllByEmpresaIdAndStatusIdentidade(
            UUID empresaId,
            StatusIdentidade statusIdentidade
    );
}
