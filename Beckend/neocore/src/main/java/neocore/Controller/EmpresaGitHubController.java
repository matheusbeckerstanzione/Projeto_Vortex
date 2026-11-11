package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import neocore.DTO.github.*;
import neocore.Service.EmpresaGitHubService;

import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/empresas/{empresaId}/github")
public class EmpresaGitHubController {

    private final EmpresaGitHubService service;

    @GetMapping
    public EmpresaGitHubResponse buscar(
            @PathVariable UUID empresaId
    ) {
        return service.buscar(empresaId);
    }

    @PutMapping("/vinculo")
    public EmpresaGitHubResponse vincular(
            @PathVariable UUID empresaId,
            @Valid
            @RequestBody EmpresaGitHubVinculoRequest request
    ) {
        return service.vincular(
                empresaId,
                request
        );
    }

    @PostMapping("/coleta")
    public EmpresaGitHubResponse coletar(
            @PathVariable UUID empresaId,
            @Valid
            @RequestBody EmpresaGitHubColetaRequest request
    ) {
        return service.coletar(
                empresaId,
                request
        );
    }

    @DeleteMapping("/vinculo")
    public EmpresaGitHubResponse revogar(
            @PathVariable UUID empresaId,
            @RequestParam Long versao
    ) {
        return service.revogar(
                empresaId,
                versao
        );
    }
}