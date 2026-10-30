package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.atributoempresa.*;
import neocore.Service.AtributoEmpresaService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/atributos-empresa")
@RequiredArgsConstructor
public class AtributoEmpresaController {

    private final AtributoEmpresaService service;

    @GetMapping
    public Page<AtributoEmpresaResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public AtributoEmpresaResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AtributoEmpresaResponse cadastrar(
            @Valid @RequestBody AtributoEmpresaRequest request) {

        return service.cadastrar(request);
    }
}