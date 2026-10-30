package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.fontedados.*;
import neocore.Service.FonteDadosService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/fontes-dados")
@RequiredArgsConstructor
public class FonteDadosController {

    private final FonteDadosService service;

    @GetMapping
    public Page<FonteDadosResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public FonteDadosResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FonteDadosResponse cadastrar(
            @Valid @RequestBody FonteDadosRequest request) {

        return service.cadastrar(request);
    }

    @PutMapping("/{id}")
    public FonteDadosResponse atualizar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody FonteDadosRequest request) {

        return service.atualizar(id, request);
    }
}