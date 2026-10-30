package neocore.Controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import neocore.DTO.campanha.*;
import neocore.Model.Enum.StatusCampanha;
import neocore.Service.CampanhaService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/campanhas")
@RequiredArgsConstructor
public class CampanhaController {

    private final CampanhaService service;

    @GetMapping
    public Page<CampanhaResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @GetMapping("/{id}")
    public CampanhaResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CampanhaResponse cadastrar(
            @Valid @RequestBody CampanhaRequest request) {

        return service.cadastrar(request);
    }

    @PutMapping("/{id}")
    public CampanhaResponse atualizar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody CampanhaRequest request) {

        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/status")
    public CampanhaResponse alterarStatus(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AlteracaoStatusRequest request) {

        return service.alterarStatus(id, request.status());
    }

    public record AlteracaoStatusRequest(
            @NotNull StatusCampanha status
    ) {}
}