package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.segmentocontato.*;
import neocore.Service.SegmentoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/segmento-contatos")
@RequiredArgsConstructor
public class SegmentoContatoController {

    private final SegmentoService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SegmentoContatoResponse associar(
            @Valid @RequestBody SegmentoContatoRequest request) {

        return service.associar(request);
    }

    @DeleteMapping("/{segmentoId}/{contatoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(
            @PathVariable("segmentoId") UUID segmentoId,
            @PathVariable("contatoId") UUID contatoId) {

        service.removerContato(segmentoId, contatoId);
    }
}