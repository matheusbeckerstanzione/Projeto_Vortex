package neocore.Repository;

import neocore.Model.Enum.StatusPesquisa;
import neocore.Model.PesquisaEnriquecimento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;

public interface PesquisaEnriquecimentoRepository extends JpaRepository <PesquisaEnriquecimento, UUID> {

    List<PesquisaEnriquecimento> findAllByStatusOrderByCriadaEmAsc(
            StatusPesquisa status
    );

    List<PesquisaEnriquecimento> findAllBySolicitadoPorIdOrderByCriadaEmDesc(
            UUID usuarioId
    );

    List<PesquisaEnriquecimento> findAllBySetorIgnoreCaseAndCidadeIgnoreCaseAndUfIgnoreCase(
            String setor,
            String cidade,
            String uf
    );

}
