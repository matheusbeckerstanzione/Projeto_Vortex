package neocore.DTO.fontedados;

import neocore.Model.Enum.TipoFonteDados;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FonteDadosResponse(UUID id,
                                 UUID empresaId,
                                 String empresaNome,
                                 String nome,
                                 TipoFonteDados tipo,
                                 String enderecoOrigem,
                                 String descricao,
                                 String condicoesUso,
                                 Boolean habilitada,
                                 OffsetDateTime avaliadaEm,
                                 OffsetDateTime validaAte,
                                 OffsetDateTime criadoEm) {
}
