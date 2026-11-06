package neocore.Controller;

import jakarta.validation.Valid;

import neocore.DTO.segmento.*;
import neocore.Service.SegmentacaoEmpresasService;

import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/empresas/segmentacao")
public class SegmentacaoEmpresasController {

    private final SegmentacaoEmpresasService service;

    public SegmentacaoEmpresasController(
            SegmentacaoEmpresasService service
    ) {
        this.service = service;
    }

    @PostMapping("/previa")
    public Page<EmpresaSegmentacaoResponse> previa(
            @Valid
            @RequestBody
            SegmentacaoEmpresasRequest request,

            @RequestParam(
                    name = "pagina",
                    defaultValue = "0"
            )
            int pagina,

            @RequestParam(
                    name = "tamanho",
                    defaultValue = "20"
            )
            int tamanho
    ) {
        return service.previa(
                request,
                pagina,
                tamanho
        );
    }
}