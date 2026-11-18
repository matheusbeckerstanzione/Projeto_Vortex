package neocore.Service;

import neocore.Client.BrasilApiClient;
import neocore.Client.ViaCepClient;

import neocore.DTO.empresa.ConsultaEmpresaCnpjRequest;
import neocore.DTO.empresa.ConsultaEmpresaCnpjResponse;

import neocore.DTO.integracao.BrasilApiCnpjResponse;
import neocore.DTO.integracao.ViaCepResponse;

import neocore.Exception.AcessoNegadoException;
import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RecursoNaoEncontradoException;

import neocore.Model.Empresa;
import neocore.Model.Enum.PerfilUsuario;

import neocore.Repository.EmpresaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import static neocore.DTO.enriquecimento.CampoEnriquecimentoEmpresa.*;
import static neocore.Service.ServiceSupport.exigir;

@Service
public class ConsultaEmpresaCnpjService {

    private final BrasilApiClient brasil;
    private final ViaCepClient viaCep;

    private final ServiceSupport suporte;
    private final EmpresaRepository empresas;

    private final TransactionTemplate leitura;

    public ConsultaEmpresaCnpjService(
            BrasilApiClient brasil,
            ViaCepClient viaCep,
            ServiceSupport suporte,
            EmpresaRepository empresas,
            PlatformTransactionManager transacoes
    ) {
        this.brasil = brasil;
        this.viaCep = viaCep;
        this.suporte = suporte;
        this.empresas = empresas;

        leitura = new TransactionTemplate(transacoes);

        leitura.setReadOnly(true);

        leitura.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public ConsultaEmpresaCnpjResponse consultar(
            ConsultaEmpresaCnpjRequest request
    ) {
        verificarAcesso();

        suporte.validar(request);

        exigir(
                request != null && request.cnpj() != null,
                "Informe o CNPJ."
        );

        String entrada = request.cnpj();

        exigir(
                entrada.matches(
                        "[0-9]{14}|"
                                + "[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}"
                                + "/[0-9]{4}-[0-9]{2}"
                ),
                "Informe um CNPJ numérico de 14 dígitos, "
                        + "com ou sem máscara."
        );

        String cnpj = ServiceSupport.cnpj(entrada);

        var empresaExistente = leitura.execute(status ->
                empresas.findByCnpj(cnpj)
                        .map(Empresa::getId)
                        .orElse(null)
        );

        // Nenhuma transação de banco fica aberta durante o HTTP.
        BrasilApiCnpjResponse b = brasil.consultarCnpj(cnpj);

        if (b == null || !cnpj.equals(b.cnpj())) {
            throw new IntegracaoExternaException(
                    HttpStatus.BAD_GATEWAY,
                    "BrasilAPI retornou uma resposta incompatível "
                            + "com o CNPJ solicitado."
            );
        }

        var avisos = new ArrayList<String>();
        var origens = new LinkedHashMap<String, String>();

        if (empresaExistente != null) {
            avisos.add(
                    "Empresa já cadastrada. Esta consulta "
                            + "não altera o registro existente."
            );
        }

        String nome = valor(
                b.razaoSocial(),
                "razaoSocial",
                origens
        );

        String fantasia = valor(
                b.nomeFantasia(),
                "nomeFantasia",
                origens
        );

        String setor = valor(
                b.cnaeFiscalDescricao(),
                "setor",
                origens
        );

        String porte = valor(
                b.porte(),
                "porte",
                origens
        );

        String natureza = valor(
                b.naturezaJuridica(),
                "naturezaJuridica",
                origens
        );

        String situacao = valor(
                b.descricaoSituacaoCadastral(),
                "descricaoSituacaoCadastral",
                origens
        );

        String cnae = codigo(
                b.cnaeFiscal(),
                "cnaePrincipal",
                origens
        );

        if (b.situacaoCadastral() != null) {
            origens.put("situacaoCadastral", "BrasilAPI");
        }

        if (b.dataInicioAtividade() != null) {
            origens.put("dataAbertura", "BrasilAPI");
        }

        String cep = texto(b.cep());

        cep = cep == null
                ? null
                : cep.replace("-", "");

        if (cep != null && !cep.matches("[0-9]{8}")) {
            cep = null;
        }

        if (cep != null) {
            origens.put("cep", "BrasilAPI");
        }

        String ruaBrasil = texto(b.logradouro());
        String tipoRua = texto(b.descricaoTipoDeLogradouro());

        String ruaCompleta = ruaBrasil == null
                ? null
                : (tipoRua == null ? "" : tipoRua + " ")
                + ruaBrasil;

        String rua = valor(
                ruaCompleta,
                "logradouro",
                origens
        );

        String numero = valor(
                b.numero(),
                "numero",
                origens
        );

        String complemento = valor(
                b.complemento(),
                "complemento",
                origens
        );

        String bairro = valor(
                b.bairro(),
                "bairro",
                origens
        );

        String cidade = valor(
                b.municipio(),
                "cidade",
                origens
        );

        String uf = valor(
                b.uf(),
                "uf",
                origens
        );

        uf = uf == null
                ? null
                : uf.toUpperCase(Locale.ROOT);

        String ibge = codigo(
                b.codigoMunicipioIbge(),
                "municipioIbge",
                origens
        );

        if (cep == null) {
            avisos.add(
                    "BrasilAPI não informou CEP válido; "
                            + "ViaCEP não foi consultado."
            );

        } else {
            try {
                ViaCepResponse v = viaCep.consultarCep(cep);

                if (compativel(cep, cidade, uf, ibge, v)) {
                    rua = complementar(
                            rua,
                            v.logradouro(),
                            "logradouro",
                            origens
                    );

                    bairro = complementar(
                            bairro,
                            v.bairro(),
                            "bairro",
                            origens
                    );

                    cidade = complementar(
                            cidade,
                            v.localidade(),
                            "cidade",
                            origens
                    );

                    uf = complementar(
                            uf,
                            v.uf(),
                            "uf",
                            origens
                    );

                    uf = uf == null
                            ? null
                            : uf.toUpperCase(Locale.ROOT);

                    ibge = complementar(
                            ibge,
                            v.ibge(),
                            "municipioIbge",
                            origens
                    );

                    /*
                     * Não usamos complemento/unidade do ViaCEP.
                     * Esses campos descrevem o CEP e não
                     * necessariamente o endereço específico da empresa.
                     */

                } else {
                    avisos.add(
                            "CEP/município/UF divergentes ou insuficientes "
                                    + "no ViaCEP; dados postais ignorados."
                    );
                }

            } catch (
                    IntegracaoExternaException
                    | RecursoNaoEncontradoException exception
            ) {
                avisos.add(
                        "ViaCEP indisponível ou CEP não encontrado; "
                                + "resultado parcial da BrasilAPI."
                );
            }
        }

        if (nome == null
                || setor == null
                || cidade == null
                || uf == null) {

            avisos.add(
                    "Há campos obrigatórios do cadastro ausentes; "
                            + "não invente valores para preenchê-los."
            );
        }

        var contatos = ContatosEmpresaSupport.extrair(
                b,
                avisos
        );

        String emailContato = valor(
                contatos.get(EMAIL_CONTATO),
                "emailContato",
                origens
        );

        String telefonePrincipal = valor(
                contatos.get(TELEFONE_PRINCIPAL),
                "telefonePrincipal",
                origens
        );

        String telefoneSecundario = valor(
                contatos.get(TELEFONE_SECUNDARIO),
                "telefoneSecundario",
                origens
        );

        var endereco = new ConsultaEmpresaCnpjResponse.Endereco(
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                ibge
        );

        return new ConsultaEmpresaCnpjResponse(
                cnpj,
                empresaExistente,
                nome,
                fantasia,
                cnae,
                setor,
                porte,
                natureza,
                b.situacaoCadastral(),
                situacao,
                b.dataInicioAtividade(),
                endereco,
                OffsetDateTime.now(ZoneOffset.UTC),
                origens,
                avisos,
                emailContato,
                telefonePrincipal,
                telefoneSecundario
        );
    }

    private void verificarAcesso() {
        leitura.executeWithoutResult(status -> {
            var usuario = suporte.atual();

            if (usuario.getPerfil() != PerfilUsuario.ADMINISTRADOR
                    && usuario.getPerfil() != PerfilUsuario.ANALISTA) {

                throw new AcessoNegadoException(
                        "Perfil sem permissão para consultar empresas."
                );
            }
        });
    }

    private static boolean compativel(
            String cep,
            String cidade,
            String uf,
            String ibge,
            ViaCepResponse v
    ) {
        if (v == null || Boolean.TRUE.equals(v.erro())) {
            return false;
        }

        String cepVia = texto(v.cep());

        if (cepVia == null
                || !cep.equals(cepVia.replace("-", ""))) {

            return false;
        }

        String ufVia = texto(v.uf());

        if (ufVia == null
                || !ufVia.matches("[A-Za-z]{2}")
                || (uf != null && !uf.equalsIgnoreCase(ufVia))) {

            return false;
        }

        String ibgeVia = texto(v.ibge());

        if (ibge != null && ibgeVia != null) {
            return ibge.equals(ibgeVia);
        }

        return cidade != null
                && uf != null
                && texto(v.localidade()) != null
                && Objects.equals(
                comparar(cidade),
                comparar(v.localidade())
        );
    }

    private static String comparar(String valor) {
        return Normalizer.normalize(
                        valor.strip(),
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT);
    }

    private static String complementar(
            String atual,
            String novo,
            String campo,
            Map<String, String> origens
    ) {
        if (atual != null) {
            return atual;
        }

        String valor = texto(novo);

        if (valor != null) {
            origens.put(campo, "ViaCEP");
        }

        return valor;
    }

    private static String valor(
            String entrada,
            String campo,
            Map<String, String> origens
    ) {
        String valor = texto(entrada);

        if (valor != null) {
            origens.put(campo, "BrasilAPI");
        }

        return valor;
    }

    private static String codigo(
            Integer codigo,
            String campo,
            Map<String, String> origens
    ) {
        if (codigo == null
                || codigo < 0
                || codigo > 9_999_999) {

            return null;
        }

        origens.put(campo, "BrasilAPI");

        return String.format(
                Locale.ROOT,
                "%07d",
                codigo
        );
    }

    private static String texto(String valor) {
        return valor == null || valor.isBlank()
                ? null
                : valor.strip();
    }
}