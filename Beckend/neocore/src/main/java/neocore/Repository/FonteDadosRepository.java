package neocore.Repository;


import neocore.Model.Enum.TipoFonteDados;
import neocore.Model.FonteDados;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;
public interface FonteDadosRepository extends JpaRepository<FonteDados, UUID> {


    List<FonteDados> findAllByHabilitadaTrue();

    List<FonteDados> findAllByTipoAndHabilitadaTrue(
            TipoFonteDados tipo
    );

    List<FonteDados> findAllByEmpresaId(UUID empresaId);
}
