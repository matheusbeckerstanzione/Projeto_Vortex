package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.segmento.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SegmentacaoEmpresasService {

    private final ServiceSupport suporte;
    private final CriteriosSegmento criterios;

    public Page<EmpresaSegmentacaoResponse> previa(
            SegmentacaoEmpresasRequest request,
            int pagina,
            int tamanho
    ) {
        suporte.atual();
        suporte.validar(request);

        suporte.finalidade(
                request.finalidadeId()
        );

        var filtros = criterios.validar(
                request.criterios()
        );

        var pageable = suporte.pagina(
                pagina,
                tamanho
        );

        ServiceSupport.exigir(
                pageable.getOffset() <= Integer.MAX_VALUE,
                "Página excede o limite."
        );

        var dados = criterios.buscarEmpresas(
                        filtros,
                        (int) pageable.getOffset(),
                        tamanho
                )
                .stream()
                .map(EmpresaSegmentacaoResponse::de)
                .toList();

        return new PageImpl<>(
                dados,
                pageable,
                criterios.contarEmpresas(filtros)
        );
    }
}