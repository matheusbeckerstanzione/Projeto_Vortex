package neocore.DTO.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import neocore.Model.Enum.PerfilUsuario;

public record UsuarioCadastroRequest(@NotBlank
                                     @Size(max = 120)
                                     String nome,

                                     @NotBlank
                                     @Email
                                     @Size(max = 254)
                                     String email,

                                     @NotNull
                                     PerfilUsuario perfil) {
}
