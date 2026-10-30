package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.conviteacesso.*;
import neocore.DTO.usuario.UsuarioResponse;
import neocore.Service.ConviteAcessoService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/convites")
@RequiredArgsConstructor
public class ConviteAcessoController {

    private final ConviteAcessoService service;

    @PostMapping
    public ResponseEntity<ConviteAcessoService.ConviteCriado> criar(
            @Valid @RequestBody CriacaoConviteRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(service.criar(request));
    }

    @GetMapping("/{id}")
    public ConviteAcessoResponse buscarPorId(
            @PathVariable("id") UUID id) {

        return service.buscarPorId(id);
    }

    @PostMapping("/ativar")
    public ResponseEntity<UsuarioResponse> ativar(
            @Valid @RequestBody AtivacaoContaRequest request) {

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(service.ativar(request));
    }

    @PatchMapping("/{id}/revogacao")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revogar(@PathVariable("id") UUID id) {
        service.revogar(id);
    }
}