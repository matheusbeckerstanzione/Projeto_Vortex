package neocore.Controller;

import lombok.RequiredArgsConstructor;
import neocore.Service.ExportacaoService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/exportacoes")
@RequiredArgsConstructor
public class ExportacaoController {

    private final ExportacaoService service;

    @GetMapping("/segmentos/{id}")
    public ResponseEntity<byte[]> exportarSegmento(
            @PathVariable("id") UUID id) {

        byte[] csv = service.exportarSegmento(id);

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType("text/csv;charset=UTF-8")
                )
                .cacheControl(CacheControl.noStore())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("segmento-" + id + ".csv")
                                .build()
                                .toString()
                )
                .body(csv);
    }
}