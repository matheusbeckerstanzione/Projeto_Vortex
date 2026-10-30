package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.contato.*;
import neocore.Service.ContatoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/contatos")
@RequiredArgsConstructor
public class ContatoController {

    private final ContatoService service;

    @GetMapping
    public Page<ContatoResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public ContatoResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContatoResponse cadastrar(
            @Valid @RequestBody ContatoRequest request) {

        return service.cadastrar(request);
    }

    @PutMapping("/{id}")
    public ContatoResponse atualizar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody ContatoRequest request) {

        return service.atualizar(id, request);
    }
}