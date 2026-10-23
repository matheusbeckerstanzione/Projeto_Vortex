package neocore.DTO.fontedados;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import neocore.Model.Enum.TipoFonteDados;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FonteDadosRequest(UUID empresaId,

                                @NotBlank
                                @Size(max = 160)
                                String nome,

                                @NotNull
                                TipoFonteDados tipo,

                                @NotBlank
                                String enderecoOrigem,

                                String descricao,
                                String condicoesUso,

                                @NotNull
                                Boolean habilitada,

                                OffsetDateTime avaliadaEm,
                                OffsetDateTime validaAte) {
}
