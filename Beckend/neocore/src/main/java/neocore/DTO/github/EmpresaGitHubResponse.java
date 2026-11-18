package neocore.DTO.github;

import neocore.DTO.sinais.SinaisGitHubResponse;

import java.time.Instant;
import java.util.UUID;

public record EmpresaGitHubResponse(

        UUID empresaId,

        Long versao,

        Long organizacaoId,

        String organizacao,

        String url,

        String referenciaVinculo,

        String justificativaVinculo,

        UUID confirmadoPorId,

        Instant confirmadoEm,

        boolean ativo,

        String situacao,

        Instant validoAte,

        SinaisGitHubResponse amostra

) {
}