package neocore.Controller;

import lombok.RequiredArgsConstructor;
import neocore.DTO.logauditoria.LogAuditoriaResponse;
import neocore.Service.AuditoriaService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auditoria")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaService service;

    @GetMapping
    public Page<LogAuditoriaResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }
}