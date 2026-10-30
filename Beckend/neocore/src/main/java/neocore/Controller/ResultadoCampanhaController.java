package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.resultadocampanha.*;
import neocore.Service.ResultadoCampanhaService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/resultados-campanha")
@RequiredArgsConstructor
public class ResultadoCampanhaController {

    private final ResultadoCampanhaService service;

    @GetMapping
    public Page<ResultadoCampanhaResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResultadoCampanhaResponse registrar(
            @Valid @RequestBody ResultadoCampanhaRequest request) {

        return service.registrar(request);
    }
}