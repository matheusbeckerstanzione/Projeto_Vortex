package neocore.DTO.usuario;


import jakarta.validation.constraints.NotNull;
import neocore.Model.Enum.StatusUsuario;

public record UsuarioAlteracaoStatusRequest(@NotNull
                                            StatusUsuario status){
}
