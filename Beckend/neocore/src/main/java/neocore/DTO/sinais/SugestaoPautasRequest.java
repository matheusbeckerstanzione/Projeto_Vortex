package neocore.DTO.sinais;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SugestaoPautasRequest(

        @NotBlank
        @Size(max = 300)
        String objetivoCampanha,

        @NotBlank
        @Size(max = 1000)
        String resumoSegmento,

        @NotNull
        @Size(min = 1, max = 5)
        List<@NotNull @Valid VideoReferencia> videos

) {
    public record VideoReferencia(

            @NotBlank
            @Size(max = 300)
            String titulo,

            @NotBlank
            @Pattern(
                    regexp = "https://www\\.youtube\\.com/watch\\?v=[A-Za-z0-9_-]{11}",
                    message = "Informe o link de um vídeo retornado pela busca do YouTube."
            )
            String url

    ) {
    }
}