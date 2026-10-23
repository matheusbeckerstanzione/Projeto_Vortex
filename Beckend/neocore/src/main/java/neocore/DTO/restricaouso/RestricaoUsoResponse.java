package neocore.DTO.restricaouso;

import neocore.Model.Enum.CanalCampanha;
import neocore.Model.Enum.EscopoRestricao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RestricaoUsoResponse( UUID id,
                                    UUID contatoId,
                                    String contatoNome,
                                    UUID finalidadeId,
                                    String finalidadeNome,
                                    EscopoRestricao escopo,
                                    CanalCampanha canal,
                                    String motivo,
                                    Boolean ativa,
                                    UUID registradaPorId,
                                    String registradaPorNome,
                                    OffsetDateTime criadaEm,
                                    OffsetDateTime encerradaEm) {
}
