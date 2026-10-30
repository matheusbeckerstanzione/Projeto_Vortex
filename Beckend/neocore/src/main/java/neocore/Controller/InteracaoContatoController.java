package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.interacaocontato.*;
import neocore.Service.InteracaoContatoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/interacoes-contato")
@RequiredArgsConstructor
public class InteracaoContatoController {

    private final InteracaoContatoService service;

    @GetMapping
    public Page<InteracaoContatoResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InteracaoContatoResponse registrar(
            @Valid @RequestBody InteracaoContatoRequest request) {

        return service.registrar(request);
    }
}