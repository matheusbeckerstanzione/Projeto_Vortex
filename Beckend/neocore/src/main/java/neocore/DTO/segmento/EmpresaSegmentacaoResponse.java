package neocore.DTO.segmento;

import neocore.Model.Empresa;

import java.time.LocalDate;
import java.util.UUID;

public record EmpresaSegmentacaoResponse(

        UUID id,
        String cnpj,
        String nome,
        String nomeFantasia,
        String cnaePrincipal,
        String setor,
        String porte,
        Integer situacaoCadastral,
        LocalDate dataAbertura,
        String cidade,
        String uf,
        String municipioIbge

) {

    public static EmpresaSegmentacaoResponse de(
            Empresa empresa
    ) {
        return new EmpresaSegmentacaoResponse(
                empresa.getId(),
                empresa.getCnpj(),
                empresa.getNome(),
                empresa.getNomeFantasia(),
                empresa.getCnaePrincipal(),
                empresa.getSetor(),
                empresa.getPorte(),
                empresa.getSituacaoCadastral(),
                empresa.getDataAbertura(),
                empresa.getCidade(),
                empresa.getUf(),
                empresa.getMunicipioIbge()
        );
    }
}