package neocore.DTO.ia;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ChatMarketingRequest(

        @NotNull
        OperacaoMarketingIa operacao,

        @NotBlank
        @Size(max = 1000)
        String pergunta,

        @Size(max = 6000)
        String dadosPublicos,

        UUID finalidadeId,

        @Size(max = 100)
        String tema,

        @Pattern(regexp = "GLOBAL|BR|US|GB|PT")
        String regiao,

        @Min(1)
        @Max(90)
        Integer dias,

        @Size(max = 5)
        List<@NotNull @Valid Referencia> referencias

) {

    public record Referencia(

            @NotBlank
            @Size(max = 250)
            String titulo,

            @NotBlank
            @Size(max = 800)
            String url,

            @NotNull
            OffsetDateTime publicadoEm,

            @NotBlank
            @Size(max = 1000)
            String trechoPublico

    ) {
    }
}