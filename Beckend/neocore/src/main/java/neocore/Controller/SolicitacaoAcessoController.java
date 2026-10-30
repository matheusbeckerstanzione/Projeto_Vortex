package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.solicitacaoacesso.*;
import neocore.Service.SolicitacaoAcessoService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/solicitacoes-acesso")
@RequiredArgsConstructor
public class SolicitacaoAcessoController {

    private final SolicitacaoAcessoService service;

    @GetMapping
    public Page<SolicitacaoAcessoResponse> listar(
            @RequestParam(name = "pagina", defaultValue = "0") int pagina,
            @RequestParam(name = "tamanho", defaultValue = "20") int tamanho) {

        return service.listar(pagina, tamanho);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SolicitacaoAcessoResponse solicitar(
            @Valid @RequestBody SolicitacaoAcessoRequest request) {

        return service.solicitar(request);
    }

    @PatchMapping("/{id}/avaliacao")
    public SolicitacaoAcessoResponse avaliar(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AvaliacaoSolicitacaoRequest request) {

        return service.avaliar(id, request);
    }
}