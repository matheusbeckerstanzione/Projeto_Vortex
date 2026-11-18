package neocore.DTO.ia;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

public record ChatMarketingResponse(

        OperacaoMarketingIa operacao,

        Conteudo conteudo,

        List<Fonte> fontes,

        String recorte,

        Instant geradoEm,

        List<String> avisos

) {

    public record Conteudo(

            @NotBlank
            @Size(max = 3000)
            String resumo,

            @NotNull
            @Size(max = 5)
            List<
                    @NotBlank
                    @Size(max = 500)
                            String
                    > observacoes,

            @Valid
            Campanha campanha,

            @NotNull
            @Size(max = 5)
            List<@NotNull @Valid Tendencia> tendencias,

            @NotNull
            @Size(max = 5)
            List<
                    @NotBlank
                    @Size(max = 500)
                            String
                    > limitacoes

    ) {
    }

    public record Campanha(

            @NotBlank
            @Size(max = 120)
            String nome,

            @NotBlank
            @Size(max = 400)
            String objetivo,

            @NotBlank
            @Size(max = 500)
            String publico,

            @NotBlank
            @Size(max = 500)
            String mensagemPrincipal,

            @NotNull
            @Size(min = 1, max = 4)
            List<
                    @NotBlank
                    @Size(max = 120)
                            String
                    > canais,

            @NotNull
            @Size(min = 1, max = 3)
            List<
                    @NotBlank
                    @Size(max = 800)
                            String
                    > textos,

            @NotNull
            @Size(min = 1, max = 4)
            List<
                    @NotBlank
                    @Size(max = 250)
                            String
                    > kpis,

            @NotNull
            @Size(min = 1, max = 5)
            List<
                    @NotBlank
                    @Size(max = 300)
                            String
                    > hipoteses

    ) {
    }

    public record Tendencia(

            @NotBlank
            @Size(max = 160)
            String titulo,

            @NotBlank
            @Size(max = 1000)
            String evidencia,

            @NotBlank
            @Size(max = 600)
            String aplicacao,

            @NotNull
            @Size(min = 1, max = 5)
            List<@NotBlank String> fontesIds

    ) {
    }

    public record Fonte(

            String id,

            String origem,

            String titulo,

            String url,

            OffsetDateTime publicadoEm

    ) {
    }
}