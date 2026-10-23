package neocore.DTO.pesquisaenriquecimento;

import jakarta.validation.constraints.*;

import java.util.UUID;

public record PesquisaEnriquecimentoRequest(@NotNull
                                            UUID finalidadeId,

                                            @NotBlank
                                                 @Size(max = 80)
                                                 String setor,

                                            @NotBlank
                                                 @Size(max = 100)
                                                 String cidade,

                                            @NotBlank
                                                 @Pattern(
                                                         regexp = "^[A-Za-z]{2}$",
                                                         message = "A UF deve possuir duas letras"
                                                 )
                                                 String uf,

                                            @NotNull
                                                 @Min(1)
                                                 @Max(1000)
                                                 Integer limiteEmpresas) {
}
