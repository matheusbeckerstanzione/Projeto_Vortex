package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.finalidadetratamento.*;
import neocore.Service.FinalidadeTratamentoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/finalidades-tratamento")
@RequiredArgsConstructor
public class FinalidadeTratamentoController {

    private final FinalidadeTratamentoService service;

    @GetMapping
    public Page<FinalidadeTratamentoResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public FinalidadeTratamentoResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FinalidadeTratamentoResponse cadastrar(
            @Valid @RequestBody FinalidadeTratamentoRequest request) {

        return service.cadastrar(request);
    }

    @PutMapping("/{id}")
    public FinalidadeTratamentoResponse atualizar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody FinalidadeTratamentoRequest request) {

        return service.atualizar(id, request);
    }
}