package neocore.Controller;

import jakarta.validation.Valid;

import neocore.DTO.ia.ChatMarketingRequest;
import neocore.DTO.ia.ChatMarketingResponse;
import neocore.Service.ChatMarketingService;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ia")
public class ChatMarketingController {

    private final ChatMarketingService service;

    public ChatMarketingController(
            ChatMarketingService service
    ) {
        this.service = service;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatMarketingResponse> responder(

            @Valid
            @RequestBody
            ChatMarketingRequest request

    ) {
        return ResponseEntity.ok()
                .cacheControl(
                        CacheControl.noStore()
                )
                .body(
                        service.responder(request)
                );
    }
}