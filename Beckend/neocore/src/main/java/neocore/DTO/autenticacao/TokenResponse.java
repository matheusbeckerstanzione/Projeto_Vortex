package neocore.DTO.autenticacao;

import neocore.Model.Enum.PerfilUsuario;

import java.util.UUID;

public record TokenResponse(String token,
                            String tipo,
                            Long expiraEmSegundos,
                            UUID usuarioId,
                            String nome,
                            PerfilUsuario perfil) {
}
