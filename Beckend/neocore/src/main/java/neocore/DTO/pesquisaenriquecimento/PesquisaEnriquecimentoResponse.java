package neocore.DTO.pesquisaenriquecimento;

import neocore.Model.Enum.StatusPesquisa;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PesquisaEnriquecimentoResponse(UUID id,
                                             UUID solicitadoPorId,
                                             String solicitadoPorNome,
                                             UUID finalidadeId,
                                             String finalidadeNome,
                                             String setor,
                                             String cidade,
                                             String uf,
                                             Integer limiteEmpresas,
                                             StatusPesquisa status,
                                             OffsetDateTime iniciadaEm,
                                             OffsetDateTime finalizadaEm,
                                             OffsetDateTime criadaEm) {
}
