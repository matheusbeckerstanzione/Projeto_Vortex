package neocore.Service;

import neocore.DTO.ia.ChatMarketingResponse.Conteudo;
import neocore.DTO.ia.OperacaoMarketingIa;

import java.time.OffsetDateTime;
import java.util.List;

public interface ChatMarketingProvider {

    Conteudo gerar(Entrada entrada);

    // Somente estes campos são enviados ao Gemini.
    record Entrada(

            OperacaoMarketingIa operacao,

            String pergunta,

            String dadosPublicos,

            String recorte,

            List<Evidencia> evidencias

    ) {
    }

    record Evidencia(

            String id,

            String origem,

            String titulo,

            String trecho,

            OffsetDateTime publicadoEm

    ) {
    }
}