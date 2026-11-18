package neocore.Controller;

import neocore.DTO.sinais.SugestaoPautasResponse;
import neocore.DTO.sinais.SugestaoPautasResponse.Pauta;
import neocore.Exception.GlobalExceptionHandler;
import neocore.Service.SugestaoPautasProvider;
import neocore.Service.SugestaoPautasService;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SugestaoPautasControllerTest {

    private static final String ROTA = "/sinais/sugestoes";

    private static final String LINK_ENVIADO =
            "https://www.youtube.com/watch?v=0XRs6cf0yXk";

    private static final String LINK_FORA_DA_SELECAO =
            "https://www.youtube.com/watch?v=4gpem6lDfp8";

    private static final String ENTRADA_VALIDA = """
            {
              "objetivoCampanha": "Gerar leads para uma solução financeira.",
              "resumoSegmento": "Pequenas empresas de serviços.",
              "videos": [
                {
                  "titulo": "Automação financeira para empresas",
                  "url": "%s"
                }
              ]
            }
            """.formatted(LINK_ENVIADO);

    @Test
    void devolveTresPautasComReferenciasDaSelecao() throws Exception {
        var mvc = montarMvc(Optional.of(request -> new SugestaoPautasResponse(
                List.of(
                        pauta("Por onde começar", LINK_ENVIADO),
                        pauta("Checklist para o financeiro", LINK_ENVIADO),
                        pauta("Como planejar um piloto", LINK_ENVIADO)
                )
        )));

        mvc.perform(post(ROTA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ENTRADA_VALIDA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pautas.length()").value(3))
                .andExpect(jsonPath("$.pautas[0].titulo").value("Por onde começar"))
                .andExpect(jsonPath("$.pautas[0].linksReferencia[0]").value(LINK_ENVIADO));
    }

    @Test
    void rejeitaEntradaInvalidaAntesDeChamarOProvedor() throws Exception {
        var mvc = montarMvc(Optional.of(request -> {
            throw new AssertionError("O provedor recebeu uma entrada inválida.");
        }));

        mvc.perform(post(ROTA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "objetivoCampanha": "",
                                  "resumoSegmento": "Pequenas empresas",
                                  "videos": []
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejeitaLinkForaDaSelecao() throws Exception {
        var mvc = montarMvc(Optional.of(request -> new SugestaoPautasResponse(
                List.of(
                        pauta("Primeira pauta", LINK_ENVIADO),
                        pauta("Segunda pauta", LINK_FORA_DA_SELECAO),
                        pauta("Terceira pauta", LINK_ENVIADO)
                )
        )));

        mvc.perform(post(ROTA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ENTRADA_VALIDA))
                .andExpect(status().isBadGateway());
    }

    @Test
    void retorna503QuandoOProvedorAindaNaoEstaConfigurado() throws Exception {
        var mvc = montarMvc(Optional.empty());

        mvc.perform(post(ROTA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(ENTRADA_VALIDA))
                .andExpect(status().isServiceUnavailable());
    }

    private MockMvc montarMvc(Optional<SugestaoPautasProvider> provider) {
        var service = new SugestaoPautasService(provider);
        var controller = new SugestaoPautasController(service);

        return MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private Pauta pauta(String titulo, String link) {
        return new Pauta(
                titulo,
                "Propor uma abordagem prática para o segmento.",
                List.of(link)
        );
    }
}