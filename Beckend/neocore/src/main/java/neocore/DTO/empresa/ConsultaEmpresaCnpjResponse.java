package neocore.DTO.empresa;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ConsultaEmpresaCnpjResponse(

        String cnpj,

        UUID empresaIdExistente,

        String razaoSocial,

        String nomeFantasia,

        String cnaePrincipal,

        String setor,

        String porte,

        String naturezaJuridica,

        Integer situacaoCadastral,

        String descricaoSituacaoCadastral,

        LocalDate dataAbertura,

        Endereco endereco,

        OffsetDateTime consultadoEm,

        Map<String, String> origemPorCampo,

        List<String> avisos

) {

    public ConsultaEmpresaCnpjResponse {
        origemPorCampo = Map.copyOf(origemPorCampo);
        avisos = List.copyOf(avisos);
    }

    public record Endereco(

            String cep,

            String logradouro,

            String numero,

            String complemento,

            String bairro,

            String cidade,

            String uf,

            String municipioIbge

    ) {
    }
}