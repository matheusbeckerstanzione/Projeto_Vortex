package neocore.Controller;

import neocore.Client.IbgeClient;
import neocore.DTO.integracao.MunicipioIbgeResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/localidades")
public class LocalidadesController {

    private final IbgeClient ibgeClient;

    public LocalidadesController(IbgeClient ibgeClient) {
        this.ibgeClient = ibgeClient;
    }

    @GetMapping("/ufs/{uf}/municipios")
    public List<MunicipioIbgeResponse> listarMunicipios(
            @PathVariable("uf") String uf
    ) {
        return ibgeClient.listarMunicipios(uf);
    }
}