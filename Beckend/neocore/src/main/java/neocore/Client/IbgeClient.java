package neocore.Client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import neocore.DTO.integracao.MunicipioIbgeResponse;
import neocore.Exception.RegraNegocioException;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static java.util.Map.entry;

@Component
public class IbgeClient {

    private static final String FORNECEDOR = "IBGE";

    private static final Map<String, String> CODIGOS_UF = Map.ofEntries(
            entry("RO", "11"), entry("AC", "12"), entry("AM", "13"),
            entry("RR", "14"), entry("PA", "15"), entry("AP", "16"),
            entry("TO", "17"), entry("MA", "21"), entry("PI", "22"),
            entry("CE", "23"), entry("RN", "24"), entry("PB", "25"),
            entry("PE", "26"), entry("AL", "27"), entry("SE", "28"),
            entry("BA", "29"), entry("MG", "31"), entry("ES", "32"),
            entry("RJ", "33"), entry("SP", "35"), entry("PR", "41"),
            entry("SC", "42"), entry("RS", "43"), entry("MS", "50"),
            entry("MT", "51"), entry("GO", "52"), entry("DF", "53")
    );

    private final RestClient client;

    public IbgeClient(
            @Lazy @Qualifier("ibgeRestClient") RestClient client
    ) {
        this.client = client;
    }

    public List<MunicipioIbgeResponse> listarMunicipios(String uf) {
        String sigla = uf.strip().toUpperCase(Locale.ROOT);
        String codigoUf = CODIGOS_UF.get(sigla);

        if (codigoUf == null) {
            throw new RegraNegocioException("Informe uma UF brasileira válida.");
        }

        MunicipioIbgeDto[] resposta = IntegracaoHttpSupport.buscar(
                client,
                "/api/v1/localidades/estados/{uf}/municipios?orderBy=nome",
                codigoUf,
                MunicipioIbgeDto[].class,
                FORNECEDOR,
                "UF"
        );

        if (resposta.length == 0) {
            throw IntegracaoHttpSupport.respostaInvalida(FORNECEDOR);
        }

        List<MunicipioIbgeResponse> municipios = new ArrayList<>(resposta.length);
        for (MunicipioIbgeDto municipio : resposta) {
            if (municipio == null
                    || municipio.id() == null
                    || municipio.id() < 1_000_000
                    || municipio.id() > 9_999_999
                    || municipio.nome() == null
                    || municipio.nome().isBlank()) {
                throw IntegracaoHttpSupport.respostaInvalida(FORNECEDOR);
            }

            municipios.add(new MunicipioIbgeResponse(
                    municipio.id().toString(),
                    municipio.nome()
            ));
        }

        return List.copyOf(municipios);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record MunicipioIbgeDto(Integer id, String nome) {
    }
}