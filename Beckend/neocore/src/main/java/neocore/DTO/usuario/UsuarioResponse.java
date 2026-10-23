package neocore.DTO.usuario;

import neocore.Model.Enum.PerfilUsuario;
import neocore.Model.Enum.StatusUsuario;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UsuarioResponse(UUID id,
                              String nome,
                              String email,
                              PerfilUsuario perfil,
                              StatusUsuario status,
                              OffsetDateTime criadoEm,
                              OffsetDateTime ativadoEm,
                              OffsetDateTime atualizadoEm) {
}
