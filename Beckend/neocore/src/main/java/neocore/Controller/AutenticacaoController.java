package neocore.Controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import neocore.DTO.autenticacao.*;
import neocore.Service.AutenticacaoService;
import neocore.Service.MfaService;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/autenticacao")
@RequiredArgsConstructor
public class AutenticacaoController {

    private final AutenticacaoService service;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(service.login(request));
    }

    @PostMapping("/mfa/configuracao")
    public ResponseEntity<MfaService.Configuracao> configurarMfa(
            @Valid @RequestBody MfaConfiguracaoRequest request) {

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(service.iniciarConfiguracaoMfa(
                        request.tokenTemporario()
                ));
    }

    @PostMapping("/mfa/confirmar")
    public ResponseEntity<TokenResponse> confirmarMfa(
            @Valid @RequestBody MfaRequest request) {

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(service.confirmarMfa(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(
                    value = HttpHeaders.AUTHORIZATION,
                    required = false
            ) String authorization) {

        if (authorization == null
                || !authorization.startsWith("Bearer ")
                || authorization.substring(7).isBlank()) {

            throw new BadCredentialsException(
                    "Token ausente ou inválido."
            );
        }

        service.logout(authorization.substring(7));

        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .build();
    }

    public record MfaConfiguracaoRequest(
            @NotBlank
            @Size(max = 1024)
            String tokenTemporario
    ) {}
}