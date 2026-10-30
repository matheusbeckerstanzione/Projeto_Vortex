package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.tarefacoleta.*;
import neocore.Service.TarefaColetaService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/tarefas-coleta")
@RequiredArgsConstructor
public class TarefaColetaController {

    private final TarefaColetaService service;

    @GetMapping
    public Page<TarefaColetaResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TarefaColetaResponse cadastrar(
            @Valid @RequestBody TarefaColetaRequest request) {

        return service.cadastrar(request);
    }

    @PatchMapping("/{id}/cancelamento")
    public TarefaColetaResponse cancelar(
            @PathVariable("id") UUID id) {

        return service.cancelar(id);
    }
}