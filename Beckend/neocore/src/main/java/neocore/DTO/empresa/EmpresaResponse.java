package neocore.DTO.empresa;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EmpresaResponse(
        UUID id,
        String nome,
        String slug,
        String cnpj,
        String setor,
        String cidade,
        String uf,
        String descricao,
        String urlSite,
        OffsetDateTime criadoEm,
        OffsetDateTime atualizadoEm,
        String emailContato,
        String telefonePrincipal,
        String telefoneSecundario
) {

    public EmpresaResponse(
            UUID id,
            String nome,
            String slug,
            String cnpj,
            String setor,
            String cidade,
            String uf,
            String descricao,
            String urlSite,
            OffsetDateTime criadoEm,
            OffsetDateTime atualizadoEm
    ) {
        this(
                id,
                nome,
                slug,
                cnpj,
                setor,
                cidade,
                uf,
                descricao,
                urlSite,
                criadoEm,
                atualizadoEm,
                null,
                null,
                null
        );
    }
}