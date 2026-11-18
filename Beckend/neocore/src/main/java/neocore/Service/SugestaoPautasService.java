package neocore.Service;

import neocore.DTO.sinais.SugestaoPautasRequest;
import neocore.DTO.sinais.SugestaoPautasResponse;
import neocore.Exception.IntegracaoExternaException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SugestaoPautasService {

    private final Optional<SugestaoPautasProvider> provider;

    public SugestaoPautasService(Optional<SugestaoPautasProvider> provider) {
        this.provider = provider;
    }

    public SugestaoPautasResponse sugerir(SugestaoPautasRequest request) {
        var gerador = provider.orElseThrow(() -> new IntegracaoExternaException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "A geração de sugestões ainda não foi configurada."
        ));

        Set<String> linksPermitidos = request.videos().stream()
                .map(SugestaoPautasRequest.VideoReferencia::url)
                .collect(Collectors.toUnmodifiableSet());

        var resposta = gerador.gerar(request);

        if (resposta == null || resposta.pautas() == null
                || resposta.pautas().size() != 3) {
            throw respostaInvalida();
        }

        var pautas = resposta.pautas().stream()
                .map(pauta -> validarPauta(pauta, linksPermitidos))
                .toList();

        return new SugestaoPautasResponse(pautas);
    }

    private SugestaoPautasResponse.Pauta validarPauta(
            SugestaoPautasResponse.Pauta pauta,
            Set<String> linksPermitidos
    ) {
        if (pauta == null
                || pauta.titulo() == null || pauta.titulo().isBlank()
                || pauta.abordagem() == null || pauta.abordagem().isBlank()
                || pauta.linksReferencia() == null
                || pauta.linksReferencia().isEmpty()) {
            throw respostaInvalida();
        }

        for (String link : pauta.linksReferencia()) {
            if (link == null || !linksPermitidos.contains(link)) {
                throw respostaInvalida();
            }
        }

        return new SugestaoPautasResponse.Pauta(
                pauta.titulo().strip(),
                pauta.abordagem().strip(),
                List.copyOf(pauta.linksReferencia())
        );
    }

    private IntegracaoExternaException respostaInvalida() {
        return new IntegracaoExternaException(
                HttpStatus.BAD_GATEWAY,
                "O provedor retornou sugestões incompletas ou referências inválidas."
        );
    }
}