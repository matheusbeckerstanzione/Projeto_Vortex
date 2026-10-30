package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.restricaouso.*;
import neocore.Service.RestricaoUsoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/restricoes-uso")
@RequiredArgsConstructor
public class RestricaoUsoController {

    private final RestricaoUsoService service;

    @GetMapping
    public Page<RestricaoUsoResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RestricaoUsoResponse registrar(
            @Valid @RequestBody RestricaoUsoRequest request) {

        return service.registrar(request);
    }

    @PatchMapping("/{id}/encerramento")
    public RestricaoUsoResponse encerrar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EncerramentoRestricaoRequest request) {

        return service.encerrar(id, request);
    }
}