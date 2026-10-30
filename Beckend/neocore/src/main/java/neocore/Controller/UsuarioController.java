package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.usuario.*;
import neocore.Service.UsuarioService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    @GetMapping
    public Page<UsuarioResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public UsuarioResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse cadastrar(
            @Valid @RequestBody UsuarioCadastroRequest request) {

        return service.cadastrar(request);
    }

    @PutMapping("/{id}")
    public UsuarioResponse atualizar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UsuarioAtualizacaoRequest request) {

        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    public UsuarioResponse alterarStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UsuarioAlteracaoStatusRequest request) {

        return service.alterarStatus(id, request);
    }
}