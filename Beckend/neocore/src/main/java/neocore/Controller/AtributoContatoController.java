package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.atributocontato.*;
import neocore.Service.AtributoContatoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/atributos-contato")
@RequiredArgsConstructor
public class AtributoContatoController {

    private final AtributoContatoService service;

    @GetMapping
    public Page<AtributoContatoResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public AtributoContatoResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AtributoContatoResponse cadastrar(
            @Valid @RequestBody AtributoContatoRequest request) {

        return service.cadastrar(request);
    }
}