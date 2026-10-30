package neocore.DTO.integracao;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ViaCepResponse(

        String cep,

        String logradouro,

        String complemento,

        String unidade,

        String bairro,

        String localidade,

        String uf,

        String estado,

        String regiao,

        String ibge,

        String gia,

        String ddd,

        String siafi,

        Boolean erro

) {
}