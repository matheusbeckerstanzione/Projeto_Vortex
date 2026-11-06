package neocore.Controller;

import jakarta.validation.Valid;

import neocore.DTO.empresa.ConsultaEmpresaCnpjRequest;
import neocore.DTO.empresa.ConsultaEmpresaCnpjResponse;

import neocore.Service.ConsultaEmpresaCnpjService;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/empresas/consulta-cnpj")
public class ConsultaEmpresaCnpjController {

    private final ConsultaEmpresaCnpjService service;

    public ConsultaEmpresaCnpjController(
            ConsultaEmpresaCnpjService service
    ) {
        this.service = service;
    }

    @PostMapping
    public ConsultaEmpresaCnpjResponse consultar(
            @Valid
            @RequestBody
            ConsultaEmpresaCnpjRequest request
    ) {
        return service.consultar(request);
    }
}