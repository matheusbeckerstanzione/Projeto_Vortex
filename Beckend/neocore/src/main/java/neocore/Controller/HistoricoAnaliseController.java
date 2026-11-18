package neocore.Controller;

import neocore.DTO.ia.HistoricoAnaliseResponse;
import neocore.Service.HistoricoAnaliseService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/ia/historico")
public class HistoricoAnaliseController {

    private final HistoricoAnaliseService service;

    public HistoricoAnaliseController(HistoricoAnaliseService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<HistoricoAnaliseResponse>> listar() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(service.listarMeuHistorico());
    }
}