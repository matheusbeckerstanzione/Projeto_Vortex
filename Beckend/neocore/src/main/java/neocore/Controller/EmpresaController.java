package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.empresa.*;
import neocore.Service.EmpresaService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/empresas")
@RequiredArgsConstructor
public class EmpresaController {

    private final EmpresaService service;

    @GetMapping
    public Page<EmpresaResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public EmpresaResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @GetMapping("/por-cnpj")
    public EmpresaResponse buscarPorCnpj(
            @RequestParam(name = "cnpj", defaultValue = "") String cnpj) {

        return service.buscarPorCnpj(cnpj);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmpresaResponse cadastrar(
            @Valid @RequestBody EmpresaRequest request) {

        return service.cadastrar(request);
    }

    @PutMapping("/{id}")
    public EmpresaResponse atualizar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody EmpresaRequest request) {

        return service.atualizar(id, request);
    }
}