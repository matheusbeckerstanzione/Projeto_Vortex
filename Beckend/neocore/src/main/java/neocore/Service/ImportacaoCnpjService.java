package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.empresa.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ImportacaoCnpjService {

    private final EmpresaService empresas;
    private final ServiceSupport suporte;

    @Transactional
    public List<EmpresaResponse> importar(
            List<EmpresaRequest> cadastros
    ) {
        suporte.admin();

        ServiceSupport.exigir(
                cadastros != null
                        && !cadastros.isEmpty()
                        && cadastros.size() <= 100,
                "Informe de 1 a 100 cadastros por lote."
        );

        Set<String> vistos = new HashSet<>();

        for (var request : cadastros) {
            suporte.validar(request);

            ServiceSupport.exigir(
                    vistos.add(ServiceSupport.cnpj(request.cnpj())),
                    "CNPJ repetido no lote."
            );
        }

        // Se um cadastro falhar, o lote inteiro será revertido.
        return cadastros.stream()
                .map(empresas::cadastrar)
                .toList();
    }
}