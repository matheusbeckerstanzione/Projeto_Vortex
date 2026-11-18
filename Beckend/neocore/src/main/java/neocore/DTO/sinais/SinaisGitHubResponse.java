package neocore.DTO.sinais;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

public record SinaisGitHubResponse(
        Long organizacaoId,
        String organizacao,
        String nome,
        String url,

        Integer totalRepositoriosPublicos,

        int pagina,
        int tamanhoPagina,

        List<Repositorio> repositorios,

        List<Linguagem> linguagensDosProjetosAtivosDaPagina,

        Instant consultadoEm,
        String observacao
) {

    public record Repositorio(
            Long id,
            String nome,
            String url,
            String linguagemPrincipal,
            boolean fork,
            boolean arquivado,
            OffsetDateTime ultimoPush
    ) {
    }

    public record Linguagem(
            String nome,
            long quantidadeRepositorios
    ) {
    }
}