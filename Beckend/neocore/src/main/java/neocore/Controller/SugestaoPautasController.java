package neocore.Controller;

import jakarta.validation.Valid;

import neocore.DTO.sinais.SugestaoPautasRequest;
import neocore.DTO.sinais.SugestaoPautasResponse;
import neocore.Service.SugestaoPautasService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sinais")
public class SugestaoPautasController {

    private final SugestaoPautasService service;

    public SugestaoPautasController(SugestaoPautasService service) {
        this.service = service;
    }

    @PostMapping("/sugestoes")
    public SugestaoPautasResponse sugerir(
            @Valid @RequestBody SugestaoPautasRequest request
    ) {
        return service.sugerir(request);
    }
}