package neocore.Repository;

import neocore.Model.Enum.TipoInteracao;
import neocore.Model.InteracaoContato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InteracaoContatoRepository extends JpaRepository <InteracaoContato, UUID>{

    List<InteracaoContato> findAllByContatoIdOrderByOcorridoEmDesc(
            UUID contatoId
    );

    List<InteracaoContato> findAllByCampanhaIdOrderByOcorridoEmDesc(
            UUID campanhaId
    );

    List<InteracaoContato> findAllByTipoInteracao(
            TipoInteracao tipoInteracao
    );

    Optional<InteracaoContato> findByFonteIdAndIdentificadorOrigem(
            UUID fonteId,
            String identificadorOrigem
    );

    boolean existsByFonteIdAndIdentificadorOrigem(
            UUID fonteId,
            String identificadorOrigem
    );
}
