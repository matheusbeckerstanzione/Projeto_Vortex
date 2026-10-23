package neocore.Repository;



import neocore.Model.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface EmpresaRepository extends JpaRepository<Empresa, UUID> {

    Optional<Empresa> findByCnpj(String cnpj);

    Optional<Empresa> findBySlug(String slug);

    boolean existsByCnpj(String cnpj);

    boolean existsBySlug(String slug);

    List<Empresa> findAllBySetorIgnoreCase(String setor);

    List<Empresa> findAllByCidadeIgnoreCaseAndUfIgnoreCase(
            String cidade,
            String uf
    );
}
