package neocore.Controller;

import neocore.DTO.sinais.SinaisGitHubResponse;
import neocore.Service.SinaisGitHubService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sinais/github")
public class SinaisGitHubController {

    private final SinaisGitHubService service;

    public SinaisGitHubController(
            SinaisGitHubService service
    ) {
        this.service = service;
    }

    @GetMapping("/organizacoes/{organizacao}")
    public SinaisGitHubResponse consultar(
            @PathVariable("organizacao")
            String organizacao,

            @RequestParam(
                    name = "pagina",
                    defaultValue = "1"
            )
            int pagina
    ) {
        return service.consultar(
                organizacao,
                pagina
        );
    }
}