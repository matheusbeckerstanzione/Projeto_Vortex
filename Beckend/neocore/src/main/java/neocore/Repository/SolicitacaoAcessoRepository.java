package neocore.Repository;

import neocore.Model.Enum.StatusSolicitacao;
import neocore.Model.SolicitacaoAcesso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SolicitacaoAcessoRepository extends JpaRepository<SolicitacaoAcesso, UUID> {

    Optional<SolicitacaoAcesso> findByEmailIgnoreCase(String email);

    List<SolicitacaoAcesso> findAllByStatusOrderBySolicitadoEmAsc(
            StatusSolicitacao status);
}
