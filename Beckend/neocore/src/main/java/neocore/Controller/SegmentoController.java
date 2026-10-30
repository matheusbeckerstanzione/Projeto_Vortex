package neocore.Controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import neocore.DTO.contato.ContatoResponse;
import neocore.DTO.segmento.*;
import neocore.Model.Enum.StatusSegmento;
import neocore.Service.SegmentoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/segmentos")
@RequiredArgsConstructor
public class SegmentoController {

    private final SegmentoService service;

    @GetMapping
    public Page<SegmentoResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public SegmentoResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SegmentoResponse cadastrar(
            @Valid @RequestBody SegmentoRequest request) {

        return service.cadastrar(request);
    }

    @PutMapping("/{id}")
    public SegmentoResponse atualizar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody SegmentoRequest request) {

        return service.atualizar(id, request);
    }

    @GetMapping("/{id}/previa")
    public Page<ContatoResponse> previa(
            @PathVariable("id") UUID id,
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.previa(id, pagina, tamanho);
    }

    @PostMapping("/{id}/recalculo")
    public RecalculoResponse recalcular(
            @PathVariable("id") UUID id) {

        return new RecalculoResponse(service.recalcular(id));
    }

    @PatchMapping("/{id}/status")
    public SegmentoResponse alterarStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AlteracaoStatusRequest request) {

        return service.alterarStatus(id, request.status());
    }

    public record AlteracaoStatusRequest(
            @NotNull StatusSegmento status
    ) {}

    public record RecalculoResponse(
            long quantidadeContatos
    ) {}
}