package neocore.Repository;

import neocore.Model.ConviteAcesso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface ConviteAcessoRepository extends JpaRepository<ConviteAcesso, UUID> {

    Optional<ConviteAcesso> findByTokenHash(String tokenHash);

    List<ConviteAcesso> findAllByUsuarioId(UUID usuarioId);

    boolean existsByTokenHash(String tokenHash);
}
