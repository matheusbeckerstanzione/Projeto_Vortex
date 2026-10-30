package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import neocore.DTO.enriquecimento.*;
import neocore.Service.EnriquecimentoEmpresaService;

import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/empresas/{id}/enriquecimento")
@RequiredArgsConstructor
public class EnriquecimentoEmpresaController {

    private final EnriquecimentoEmpresaService service;

    @GetMapping
    public EnriquecimentoEmpresaResponse consultar(
            @PathVariable("id") UUID id
    ) {
        return service.consultar(id);
    }

    @PostMapping("/previa")
    public EnriquecimentoPreviaResponse previa(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EnriquecimentoPreviaRequest request
    ) {
        return service.previa(id, request);
    }

    @PostMapping("/confirmacao")
    public EnriquecimentoEmpresaResponse confirmar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EnriquecimentoConfirmacaoRequest request
    ) {
        return service.confirmar(id, request);
    }
}