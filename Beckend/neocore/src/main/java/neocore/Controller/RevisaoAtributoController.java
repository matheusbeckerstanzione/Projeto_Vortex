package neocore.Controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import neocore.DTO.atributocontato.*;
import neocore.DTO.atributoempresa.*;
import neocore.Service.RevisaoAtributoService;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/revisoes-atributos")
@RequiredArgsConstructor
public class RevisaoAtributoController {

    private final RevisaoAtributoService service;

    @PatchMapping("/contatos/{id}")
    public AtributoContatoResponse revisarContato(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RevisaoAtributoContatoRequest request) {

        return service.revisarContato(id, request);
    }

    @PatchMapping("/empresas/{id}")
    public AtributoEmpresaResponse revisarEmpresa(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RevisaoAtributoEmpresaRequest request) {

        return service.revisarEmpresa(id, request);
    }
}