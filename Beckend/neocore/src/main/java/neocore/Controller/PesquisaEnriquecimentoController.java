package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.pesquisaenriquecimento.*;
import neocore.Service.PesquisaEnriquecimentoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/pesquisas-enriquecimento")
@RequiredArgsConstructor
public class PesquisaEnriquecimentoController {

    private final PesquisaEnriquecimentoService service;

    @GetMapping
    public Page<PesquisaEnriquecimentoResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PesquisaEnriquecimentoResponse cadastrar(
            @Valid @RequestBody PesquisaEnriquecimentoRequest request) {

        return service.cadastrar(request);
    }

    @PatchMapping("/{id}/cancelamento")
    public PesquisaEnriquecimentoResponse cancelar(
            @PathVariable("id") UUID id) {

        return service.cancelar(id);
    }
}