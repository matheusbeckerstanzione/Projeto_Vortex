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
        List<String> avisos,
        String emailContato,
        String telefonePrincipal,
        String telefoneSecundario
) {

    public ConsultaEmpresaCnpjResponse {
        origemPorCampo = Map.copyOf(origemPorCampo);
        avisos = List.copyOf(avisos);
    }

    public ConsultaEmpresaCnpjResponse(
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
        this(
                cnpj,
                empresaIdExistente,
                razaoSocial,
                nomeFantasia,
                cnaePrincipal,
                setor,
                porte,
                naturezaJuridica,
                situacaoCadastral,
                descricaoSituacaoCadastral,
                dataAbertura,
                endereco,
                consultadoEm,
                origemPorCampo,
                avisos,
                null,
                null,
                null
        );
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