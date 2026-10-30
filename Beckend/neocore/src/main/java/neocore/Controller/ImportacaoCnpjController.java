package neocore.Controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import neocore.DTO.empresa.*;
import neocore.Service.ImportacaoCnpjService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/importacoes/cnpj")
@RequiredArgsConstructor
public class ImportacaoCnpjController {

    private final ImportacaoCnpjService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<EmpresaResponse> importar(
            @Valid @RequestBody ImportacaoRequest request) {

        return service.importar(request.empresas());
    }

    public record ImportacaoRequest(
            @NotEmpty
            @Size(max = 100)
            List<@NotNull @Valid EmpresaRequest> empresas
    ) {}
}