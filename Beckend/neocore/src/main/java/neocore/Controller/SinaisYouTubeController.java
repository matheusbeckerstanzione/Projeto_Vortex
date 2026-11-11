package neocore.Controller;

import neocore.Client.YouTubeClient;
import neocore.DTO.integracao.YouTubeVideoResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/sinais")
public class SinaisYouTubeController {

    private final YouTubeClient youTubeClient;

    public SinaisYouTubeController(YouTubeClient youTubeClient) {
        this.youTubeClient = youTubeClient;
    }

    @GetMapping("/youtube")
    public List<YouTubeVideoResponse> buscarVideos(
            @RequestParam(name = "tema", defaultValue = "") String tema
    ) {
        return youTubeClient.buscarVideos(tema);
    }
}