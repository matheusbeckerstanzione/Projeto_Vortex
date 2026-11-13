package neocore.DTO.integracao;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BrasilApiCnpjResponse(

        String cnpj,

        @JsonProperty("razao_social")
        String razaoSocial,

        @JsonProperty("nome_fantasia")
        String nomeFantasia,

        String porte,

        @JsonProperty("codigo_porte")
        Integer codigoPorte,

        @JsonProperty("cnae_fiscal")
        Integer cnaeFiscal,

        @JsonProperty("cnae_fiscal_descricao")
        String cnaeFiscalDescricao,

        @JsonProperty("natureza_juridica")
        String naturezaJuridica,

        @JsonProperty("situacao_cadastral")
        Integer situacaoCadastral,

        @JsonProperty("descricao_situacao_cadastral")
        String descricaoSituacaoCadastral,

        @JsonProperty("data_inicio_atividade")
        LocalDate dataInicioAtividade,

        String cep,

        @JsonProperty("descricao_tipo_de_logradouro")
        String descricaoTipoDeLogradouro,

        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String municipio,
        String uf,

        @JsonProperty("codigo_municipio_ibge")
        Integer codigoMunicipioIbge,

        String email,

        @JsonProperty("ddd_telefone_1")
        String dddTelefone1,

        @JsonProperty("ddd_telefone_2")
        String dddTelefone2
) {

        // Preserva as chamadas existentes nos testes antigos.
        public BrasilApiCnpjResponse(
                String cnpj,
                String razaoSocial,
                String nomeFantasia,
                String porte,
                Integer codigoPorte,
                Integer cnaeFiscal,
                String cnaeFiscalDescricao,
                String naturezaJuridica,
                Integer situacaoCadastral,
                String descricaoSituacaoCadastral,
                LocalDate dataInicioAtividade,
                String cep,
                String descricaoTipoDeLogradouro,
                String logradouro,
                String numero,
                String complemento,
                String bairro,
                String municipio,
                String uf,
                Integer codigoMunicipioIbge
        ) {
                this(
                        cnpj,
                        razaoSocial,
                        nomeFantasia,
                        porte,
                        codigoPorte,
                        cnaeFiscal,
                        cnaeFiscalDescricao,
                        naturezaJuridica,
                        situacaoCadastral,
                        descricaoSituacaoCadastral,
                        dataInicioAtividade,
                        cep,
                        descricaoTipoDeLogradouro,
                        logradouro,
                        numero,
                        complemento,
                        bairro,
                        municipio,
                        uf,
                        codigoMunicipioIbge,
                        null,
                        null,
                        null
                );
        }
}