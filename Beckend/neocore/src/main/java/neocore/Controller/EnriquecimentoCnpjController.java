package neocore.Controller;

import jakarta.validation.Valid;

import neocore.DTO.enriquecimento.*;
import neocore.Service.EnriquecimentoEmpresaService;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/empresas/enriquecimento")
public class EnriquecimentoCnpjController {

    private final EnriquecimentoEmpresaService service;

    public EnriquecimentoCnpjController(
            EnriquecimentoEmpresaService service
    ) {
        this.service = service;
    }

    @PostMapping("/previa-cnpj")
    public EnriquecimentoPreviaResponse previa(
            @Valid
            @RequestBody
            EnriquecimentoCnpjPreviaRequest request
    ) {
        return service.previaPorCnpj(request);
    }

    @PostMapping("/confirmacao-cnpj")
    public EnriquecimentoEmpresaResponse confirmar(
            @Valid
            @RequestBody
            EnriquecimentoConfirmacaoRequest request
    ) {
        return service.confirmarPorCnpj(request);
    }
}