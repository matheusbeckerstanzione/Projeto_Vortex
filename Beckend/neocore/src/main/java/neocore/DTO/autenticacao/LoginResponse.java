package neocore.DTO.autenticacao;

public record LoginResponse(boolean autenticado,
                            boolean mfaNecessario,
                            String tokenTemporario,
                            String mensagem) {
}
