package neocore.Service;

import neocore.Client.BrasilApiClient;
import neocore.Client.ViaCepClient;

import neocore.DTO.enriquecimento.*;
import neocore.DTO.integracao.BrasilApiCnpjResponse;
import neocore.DTO.integracao.ViaCepResponse;

import neocore.Exception.*;

import neocore.Model.Empresa;
import neocore.Model.FonteDados;
import neocore.Model.Enum.ResultadoAuditoria;

import neocore.Repository.EmpresaRepository;

import org.springframework.stereotype.Service;

import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.text.Normalizer;
import java.time.*;
import java.util.*;

import static neocore.DTO.enriquecimento.CampoEnriquecimentoEmpresa.*;
import static neocore.Service.ServiceSupport.exigir;

@Service
public class EnriquecimentoEmpresaService {

    private final BrasilApiClient brasil;
    private final ViaCepClient viaCep;

    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    private final PreviasEmpresaStore previas;
    private final EmpresaRepository empresas;

    private final TransactionTemplate leitura;
    private final TransactionTemplate escrita;

    private static final Set<CampoEnriquecimentoEmpresa> ENDERECO =
            Set.of(
                    CEP,
                    CIDADE,
                    UF,
                    MUNICIPIO_IBGE,
                    LOGRADOURO,
                    NUMERO,
                    COMPLEMENTO,
                    BAIRRO
            );

    public EnriquecimentoEmpresaService(
            BrasilApiClient brasil,
            ViaCepClient viaCep,
            ServiceSupport suporte,
            AuditoriaService auditoria,
            PreviasEmpresaStore previas,
            EmpresaRepository empresas,
            PlatformTransactionManager transacoes
    ) {
        this.brasil = brasil;
        this.viaCep = viaCep;
        this.suporte = suporte;
        this.auditoria = auditoria;
        this.previas = previas;
        this.empresas = empresas;

        leitura = new TransactionTemplate(transacoes);
        leitura.setReadOnly(true);
        leitura.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );

        escrita = new TransactionTemplate(transacoes);
        escrita.setPropagationBehavior(
                TransactionDefinition.PROPAGATION_REQUIRES_NEW
        );
        escrita.setTimeout(15);
    }

    public EnriquecimentoEmpresaResponse consultar(UUID id) {
        return leitura.execute(status -> {
            suporte.atual();

            return resposta(
                    suporte.obter(Empresa.class, id)
            );
        });
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public EnriquecimentoPreviaResponse previa(
            UUID id,
            EnriquecimentoPreviaRequest request
    ) {
        suporte.validar(request);

        var contexto = leitura.execute(status -> {
            var usuario = suporte.atual();
            var empresa = suporte.obter(Empresa.class, id);

            verificarFontes(id, request);

            return new PreviasEmpresaStore.Contexto(
                    usuario.getId(),
                    id,
                    empresa.getVersao(),
                    empresa.getCnpj(),
                    valores(empresa),
                    request
            );
        });

        return consultarFontes(contexto);
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public EnriquecimentoPreviaResponse previaPorCnpj(
            EnriquecimentoCnpjPreviaRequest request
    ) {
        suporte.validar(request);
        suporte.validar(request.parametros());

        String cnpj = ServiceSupport.cnpj(request.cnpj());

        exigir(
                cnpj.matches("[0-9]{14}"),
                "Informe CNPJ numérico com 14 dígitos."
        );

        var contexto = leitura.execute(status -> {
            var usuario = suporte.atual();

            var empresa = empresas.findByCnpj(cnpj)
                    .orElse(null);

            UUID id = empresa == null
                    ? null
                    : empresa.getId();

            verificarFontes(id, request.parametros());

            return new PreviasEmpresaStore.Contexto(
                    usuario.getId(),
                    id,
                    empresa == null
                            ? 0L
                            : empresa.getVersao(),
                    cnpj,
                    valores(
                            empresa == null
                                    ? new Empresa()
                                    : empresa
                    ),
                    request.parametros()
            );
        });

        return consultarFontes(contexto);
    }

    private EnriquecimentoPreviaResponse consultarFontes(
            PreviasEmpresaStore.Contexto contexto
    ) {
        var request = contexto.request();

        var b = brasil.consultarCnpj(contexto.cnpj());

        if (b == null
                || !ServiceSupport.cnpj(contexto.cnpj())
                .equals(b.cnpj())) {

            throw new RegraNegocioException(
                    "Resposta incompatível com o CNPJ consultado."
            );
        }

        var data = OffsetDateTime.now(ZoneOffset.UTC);

        String url =
                "https://brasilapi.com.br/api/cnpj/v1/"
                        + contexto.cnpj();

        var campos =
                new EnumMap<
                        CampoEnriquecimentoEmpresa,
                        CampoEnriquecimentoResponse
                        >(CampoEnriquecimentoEmpresa.class);

        var avisos = new ArrayList<String>();

        var candidatos =
                new EnumMap<CampoEnriquecimentoEmpresa, String>(
                        CampoEnriquecimentoEmpresa.class
                );

        candidatos.put(NOME, b.razaoSocial());
        candidatos.put(SETOR, b.cnaeFiscalDescricao());
        candidatos.put(CNAE_PRINCIPAL, codigo(b.cnaeFiscal()));
        candidatos.put(PORTE, b.porte());
        candidatos.put(NOME_FANTASIA, b.nomeFantasia());
        candidatos.put(NATUREZA_JURIDICA, b.naturezaJuridica());

        candidatos.put(
                SITUACAO_CADASTRAL,
                b.situacaoCadastral() == null
                        ? null
                        : b.situacaoCadastral().toString()
        );

        candidatos.put(
                DATA_ABERTURA,
                b.dataInicioAtividade() == null
                        ? null
                        : b.dataInicioAtividade().toString()
        );

        candidatos.put(CIDADE, b.municipio());
        candidatos.put(UF, b.uf());

        candidatos.put(
                MUNICIPIO_IBGE,
                codigo(b.codigoMunicipioIbge())
        );

        candidatos.put(
                LOGRADOURO,
                texto(b.logradouro()).isEmpty()
                        ? ""
                        : (
                        texto(b.descricaoTipoDeLogradouro())
                                + " "
                                + b.logradouro()
                ).strip()
        );

        candidatos.put(NUMERO, b.numero());
        candidatos.put(COMPLEMENTO, b.complemento());
        candidatos.put(BAIRRO, b.bairro());

        candidatos.putAll(
                ContatosEmpresaSupport.extrair(b, avisos)
        );

        candidatos.forEach((campo, valor) ->
                propor(
                        campos,
                        avisos,
                        contexto,
                        campo,
                        valor,
                        request.fonteBrasilApiId(),
                        "BrasilAPI",
                        url,
                        data
                )
        );

        String cep = texto(b.cep()).replace("-", "");

        if (cep.matches("[0-9]{8}")) {
            propor(
                    campos,
                    avisos,
                    contexto,
                    CEP,
                    cep,
                    request.fonteBrasilApiId(),
                    "BrasilAPI",
                    url,
                    data
            );

            try {
                var v = viaCep.consultarCep(cep);

                if (mesmoMunicipio(b, v)) {
                    var postais =
                            new EnumMap<
                                    CampoEnriquecimentoEmpresa,
                                    String
                                    >(CampoEnriquecimentoEmpresa.class);

                    if (texto(b.municipio()).isEmpty()) {
                        postais.put(CIDADE, v.localidade());
                    }

                    if (texto(b.uf()).isEmpty()) {
                        postais.put(UF, v.uf());
                    }

                    if (b.codigoMunicipioIbge() == null) {
                        postais.put(MUNICIPIO_IBGE, v.ibge());
                    }

                    if (texto(b.logradouro()).isEmpty()) {
                        postais.put(LOGRADOURO, v.logradouro());
                    }

                    if (texto(b.bairro()).isEmpty()) {
                        postais.put(BAIRRO, v.bairro());
                    }

                    var instanteVia =
                            OffsetDateTime.now(ZoneOffset.UTC);

                    postais.forEach((campo, valor) ->
                            propor(
                                    campos,
                                    avisos,
                                    contexto,
                                    campo,
                                    valor,
                                    request.fonteViaCepId(),
                                    "ViaCEP",
                                    "https://viacep.com.br/ws/"
                                            + cep
                                            + "/json/",
                                    instanteVia
                            )
                    );

                } else {
                    avisos.add(
                            "Município/UF divergentes no ViaCEP; "
                                    + "complemento postal ignorado."
                    );
                }

            } catch (
                    IntegracaoExternaException
                    | RecursoNaoEncontradoException exception
            ) {
                avisos.add(
                        "ViaCEP indisponível ou CEP não encontrado; "
                                + "prévia contém somente dados da BrasilAPI."
                );
            }

        } else {
            avisos.add(
                    "BrasilAPI não informou CEP válido; "
                            + "ViaCEP não foi consultado."
            );
        }

        return previas.guardar(
                contexto,
                new ArrayList<>(campos.values()),
                avisos
        );
    }

    public EnriquecimentoEmpresaResponse confirmar(
            UUID id,
            EnriquecimentoConfirmacaoRequest request
    ) {
        suporte.validar(request);

        UUID usuario = leitura.execute(
                status -> suporte.atual().getId()
        );

        return confirmarReservada(
                previas.reservar(
                        request.previaId(),
                        usuario,
                        id
                ),
                request
        );
    }

    public EnriquecimentoEmpresaResponse confirmarPorCnpj(
            EnriquecimentoConfirmacaoRequest request
    ) {
        suporte.validar(request);

        UUID usuario = leitura.execute(
                status -> suporte.atual().getId()
        );

        return confirmarReservada(
                previas.reservar(
                        request.previaId(),
                        usuario
                ),
                request
        );
    }

    private EnriquecimentoEmpresaResponse confirmarReservada(
            PreviasEmpresaStore.Dados dados,
            EnriquecimentoConfirmacaoRequest request
    ) {
        try {
            var resultado = escrita.execute(status -> {
                var usuario = suporte.atual();
                var contexto = dados.contexto();

                boolean novo = contexto.empresaId() == null;

                if (!dados.resposta().expiraEm()
                        .isAfter(Instant.now())) {

                    throw new ConflitoException(
                            "Prévia expirada. Consulte novamente."
                    );
                }

                Empresa empresa;

                if (novo) {
                    if (empresas.existsByCnpj(contexto.cnpj())) {
                        throw new ConflitoException(
                                "CNPJ cadastrado após a prévia. "
                                        + "Consulte novamente."
                        );
                    }

                    empresa = new Empresa();

                    empresa.setCnpj(contexto.cnpj());
                    empresa.setSlug("cnpj-" + contexto.cnpj());

                    exigir(
                            request.campos().containsAll(
                                    Set.of(
                                            NOME,
                                            SETOR,
                                            CIDADE,
                                            UF
                                    )
                            ),
                            "Para cadastrar, confirme NOME, SETOR, "
                                    + "CIDADE e UF disponíveis na prévia."
                    );

                } else {
                    empresa = suporte.bloquear(
                            Empresa.class,
                            contexto.empresaId()
                    );

                    boolean alterado =
                            empresa.getVersao() != contexto.versao()
                                    || !Objects.equals(
                                    empresa.getCnpj(),
                                    contexto.cnpj()
                            )
                                    || !valores(empresa)
                                    .equals(contexto.valores());

                    if (alterado) {
                        throw new ConflitoException(
                                "Cadastro alterado após a prévia. "
                                        + "Consulte novamente."
                        );
                    }
                }

                verificarFontes(
                        contexto.empresaId(),
                        contexto.request()
                );

                var selecionados = dados.resposta()
                        .campos()
                        .stream()
                        .filter(campo ->
                                request.campos()
                                        .contains(campo.campo())
                        )
                        .toList();

                exigir(
                        selecionados.size() == request.campos().size(),
                        "Campo não disponível nesta prévia."
                );

                exigir(
                        request.campos()
                                .containsAll(request.sobrescrever()),
                        "Sobrescrita deve conter somente "
                                + "campos selecionados."
                );

                validarEndereco(dados, request.campos());

                for (var campo : selecionados) {
                    exigir(
                            !campo.exigeSobrescrita()
                                    || request.sobrescrever()
                                    .contains(campo.campo()),
                            "Autorize a sobrescrita de "
                                    + campo.campo()
                                    + "."
                    );
                }

                var origens =
                        new HashMap<String, Map<String, String>>();

                if (empresa.getOrigemEnriquecimento() != null) {
                    origens.putAll(
                            empresa.getOrigemEnriquecimento()
                    );
                }

                var agora = OffsetDateTime.now(ZoneOffset.UTC);

                for (var campo : selecionados) {
                    aplicar(
                            empresa,
                            campo.campo(),
                            campo.sugerido()
                    );

                    origens.put(
                            campo.campo().name(),
                            Map.of(
                                    "valor",
                                    campo.sugerido(),

                                    "fornecedor",
                                    campo.fornecedor(),

                                    "fonteId",
                                    campo.fonteId().toString(),

                                    "referenciaOrigem",
                                    campo.referenciaOrigem(),

                                    "consultadoEm",
                                    campo.consultadoEm().toString(),

                                    "finalidadeId",
                                    contexto.request()
                                            .finalidadeId().toString(),

                                    "validoAte",
                                    contexto.request()
                                            .validoAte().toString(),

                                    "confirmadoPor",
                                    usuario.getId().toString(),

                                    "confirmadoEm",
                                    agora.toString()
                            )
                    );
                }

                empresa.setOrigemEnriquecimento(origens);
                empresa.setAtualizadoEm(agora);

                if (novo) {
                    empresa.setCriadoEm(agora);
                    empresa = empresas.saveAndFlush(empresa);
                }

                auditoria.registrar(
                        usuario,
                        novo
                                ? "CADASTRAR_POR_CNPJ"
                                : "CONFIRMAR_ENRIQUECIMENTO",
                        "Empresa",
                        empresa.getId(),
                        ResultadoAuditoria.SUCESSO
                );

                empresas.flush();

                return resposta(empresa);
            });

            // A prévia só é consumida depois do commit.
            previas.concluir(request.previaId());

            return resultado;

        } catch (RuntimeException exception) {
            previas.liberar(request.previaId());
            throw exception;
        }
    }

    private void verificarFontes(
            UUID empresaId,
            EnriquecimentoPreviaRequest request
    ) {
        var finalidade = suporte.finalidade(
                request.finalidadeId()
        );

        suporte.retencao(
                request.validoAte(),
                finalidade
        );

        verificarFonte(
                suporte.fonte(request.fonteBrasilApiId()),
                empresaId,
                "brasilapi.com.br"
        );

        verificarFonte(
                suporte.fonte(request.fonteViaCepId()),
                empresaId,
                "viacep.com.br"
        );
    }

    private void verificarFonte(
            FonteDados fonte,
            UUID empresaId,
            String host
    ) {
        exigir(
                fonte.getEmpresa() == null
                        || fonte.getEmpresa().getId()
                        .equals(empresaId),
                "Fonte pertence a outra empresa; "
                        + "cadastros novos exigem fontes gerais."
        );

        try {
            URI uri = URI.create(
                    fonte.getEnderecoOrigem()
            );

            exigir(
                    "https".equalsIgnoreCase(uri.getScheme())
                            && host.equalsIgnoreCase(uri.getHost())
                            && uri.getUserInfo() == null
                            && (
                            uri.getPort() == -1
                                    || uri.getPort() == 443
                    ),
                    "Cadastre a fonte HTTPS correspondente a "
                            + host
                            + "."
            );

        } catch (IllegalArgumentException exception) {
            throw new RegraNegocioException(
                    "Endereço de origem da fonte inválido."
            );
        }
    }

    private static void propor(
            Map<
                    CampoEnriquecimentoEmpresa,
                    CampoEnriquecimentoResponse
                    > campos,
            List<String> avisos,
            PreviasEmpresaStore.Contexto contexto,
            CampoEnriquecimentoEmpresa campo,
            String valor,
            UUID fonte,
            String fornecedor,
            String url,
            OffsetDateTime data
    ) {
        valor = texto(valor);

        if (campo == UF) {
            valor = valor.toUpperCase(Locale.ROOT);
        }

        if (valor.isEmpty()) {
            return;
        }

        int limite = switch (campo) {
            case NOME,
                 NOME_FANTASIA,
                 NATUREZA_JURIDICA -> 160;

            case SETOR,
                 PORTE -> 80;

            case CIDADE,
                 BAIRRO -> 100;

            case UF,
                 SITUACAO_CADASTRAL -> 2;

            case CNAE_PRINCIPAL,
                 MUNICIPIO_IBGE -> 7;

            case CEP -> 8;
            case NUMERO -> 30;
            case DATA_ABERTURA -> 10;

            case LOGRADOURO,
                 COMPLEMENTO -> 255;

            case EMAIL_CONTATO -> 254;

            case TELEFONE_PRINCIPAL,
                 TELEFONE_SECUNDARIO -> 16;
        };

        boolean valido =
                valor.length() <= limite
                        && switch (campo) {
                    case UF -> valor.matches(
                            "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|"
                                    + "PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|"
                                    + "SC|SP|SE|TO"
                    );

                    case CNAE_PRINCIPAL,
                         MUNICIPIO_IBGE ->
                            valor.matches("[0-9]{7}");

                    case CEP ->
                            valor.matches("[0-9]{8}");

                    case SITUACAO_CADASTRAL ->
                            valor.matches("[0-9]{1,2}");

                    case DATA_ABERTURA ->
                            dataValida(valor);

                    case EMAIL_CONTATO ->
                            Objects.equals(
                                    valor,
                                    ContatosEmpresaSupport.email(valor)
                            );

                    case TELEFONE_PRINCIPAL,
                         TELEFONE_SECUNDARIO ->
                            Objects.equals(
                                    valor,
                                    ContatosEmpresaSupport.telefone(valor)
                            );

                    default -> true;
                };

        if (!valido) {
            avisos.add(
                    campo
                            + " fora do formato/tamanho; "
                            + "campo ignorado, sem truncamento."
            );

            return;
        }

        String atual = contexto.valores()
                .getOrDefault(campo, "");

        campos.put(
                campo,
                new CampoEnriquecimentoResponse(
                        campo,
                        atual,
                        valor,
                        !atual.isBlank(),
                        fonte,
                        fornecedor,
                        url,
                        data
                )
        );
    }

    private static void validarEndereco(
            PreviasEmpresaStore.Dados dados,
            Set<CampoEnriquecimentoEmpresa> campos
    ) {
        if (Collections.disjoint(campos, ENDERECO)) {
            return;
        }

        boolean somenteLocalidadeEmCadastroNovo =
                dados.contexto().empresaId() == null
                        && campos.stream().noneMatch(campo ->
                        ENDERECO.contains(campo)
                                && campo != CIDADE
                                && campo != UF
                );

        if (somenteLocalidadeEmCadastroNovo) {
            return;
        }

        exigir(
                dados.valoresConsultados()
                        .keySet()
                        .containsAll(
                                Set.of(
                                        CEP,
                                        CIDADE,
                                        UF
                                )
                        ),
                "Endereço incompleto na consulta: "
                        + "são necessários CEP, cidade e UF."
        );

        var ausentes = ENDERECO.stream()
                .filter(campo ->
                        !dados.contexto().valores()
                                .get(campo).isBlank()
                )
                .filter(campo ->
                        !dados.valoresConsultados()
                                .containsKey(campo)
                )
                .toList();

        exigir(
                ausentes.isEmpty(),
                "Não é seguro combinar o endereço consultado "
                        + "com dados antigos. "
                        + "O fornecedor não informou: "
                        + ausentes
        );

        var faltantes = dados.resposta()
                .campos()
                .stream()
                .map(CampoEnriquecimentoResponse::campo)
                .filter(ENDERECO::contains)
                .filter(campo ->
                        !campos.contains(campo)
                )
                .toList();

        exigir(
                faltantes.isEmpty(),
                "Confirme todos os campos alterados "
                        + "do endereço em conjunto. Faltam: "
                        + faltantes
        );
    }

    private static boolean mesmoMunicipio(
            BrasilApiCnpjResponse b,
            ViaCepResponse v
    ) {
        if (v == null
                || Boolean.TRUE.equals(v.erro())
                || !texto(b.cep()).replace("-", "")
                .equals(
                        texto(v.cep()).replace("-", "")
                )) {

            return false;
        }

        if (!texto(b.uf()).isEmpty()
                && !texto(v.uf()).isEmpty()
                && !b.uf().strip()
                .equalsIgnoreCase(v.uf().strip())) {

            return false;
        }

        String ibge = codigo(
                b.codigoMunicipioIbge()
        );

        if (ibge != null
                && texto(v.ibge()).matches("[0-9]{7}")) {

            return ibge.equals(v.ibge().strip());
        }

        return !texto(b.municipio()).isEmpty()
                && !texto(v.localidade()).isEmpty()
                && comparar(b.municipio())
                .equals(comparar(v.localidade()));
    }

    private static String comparar(String valor) {
        return Normalizer.normalize(
                        texto(valor),
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "")
                .replaceAll("\\s+", " ")
                .toUpperCase(Locale.ROOT);
    }

    private static boolean dataValida(String valor) {
        try {
            return !LocalDate.parse(valor)
                    .isAfter(LocalDate.now());

        } catch (DateTimeException exception) {
            return false;
        }
    }

    private static String codigo(Integer valor) {
        if (valor == null
                || valor <= 0
                || valor > 9_999_999) {

            return null;
        }

        return String.format(
                Locale.ROOT,
                "%07d",
                valor
        );
    }

    private static String texto(Object valor) {
        return valor == null
                ? ""
                : valor.toString().strip();
    }

    private static Map<CampoEnriquecimentoEmpresa, String> valores(
            Empresa empresa
    ) {
        var mapa =
                new EnumMap<CampoEnriquecimentoEmpresa, String>(
                        CampoEnriquecimentoEmpresa.class
                );

        mapa.put(NOME, texto(empresa.getNome()));
        mapa.put(SETOR, texto(empresa.getSetor()));
        mapa.put(CIDADE, texto(empresa.getCidade()));
        mapa.put(UF, texto(empresa.getUf()));

        mapa.put(
                CNAE_PRINCIPAL,
                texto(empresa.getCnaePrincipal())
        );

        mapa.put(PORTE, texto(empresa.getPorte()));
        mapa.put(CEP, texto(empresa.getCep()));

        mapa.put(
                MUNICIPIO_IBGE,
                texto(empresa.getMunicipioIbge())
        );

        mapa.put(
                LOGRADOURO,
                texto(empresa.getLogradouro())
        );

        mapa.put(NUMERO, texto(empresa.getNumero()));

        mapa.put(
                COMPLEMENTO,
                texto(empresa.getComplemento())
        );

        mapa.put(BAIRRO, texto(empresa.getBairro()));

        mapa.put(
                NOME_FANTASIA,
                texto(empresa.getNomeFantasia())
        );

        mapa.put(
                NATUREZA_JURIDICA,
                texto(empresa.getNaturezaJuridica())
        );

        mapa.put(
                SITUACAO_CADASTRAL,
                texto(empresa.getSituacaoCadastral())
        );

        mapa.put(
                DATA_ABERTURA,
                texto(empresa.getDataAbertura())
        );

        mapa.put(
                EMAIL_CONTATO,
                texto(empresa.getEmailContato())
        );

        mapa.put(
                TELEFONE_PRINCIPAL,
                texto(empresa.getTelefonePrincipal())
        );

        mapa.put(
                TELEFONE_SECUNDARIO,
                texto(empresa.getTelefoneSecundario())
        );

        return mapa;
    }

    private static void aplicar(
            Empresa empresa,
            CampoEnriquecimentoEmpresa campo,
            String valor
    ) {
        switch (campo) {
            case NOME ->
                    empresa.setNome(valor);

            case SETOR ->
                    empresa.setSetor(valor);

            case CIDADE ->
                    empresa.setCidade(valor);

            case UF ->
                    empresa.setUf(valor);

            case CNAE_PRINCIPAL ->
                    empresa.setCnaePrincipal(valor);

            case PORTE ->
                    empresa.setPorte(valor);

            case CEP ->
                    empresa.setCep(valor);

            case MUNICIPIO_IBGE ->
                    empresa.setMunicipioIbge(valor);

            case LOGRADOURO ->
                    empresa.setLogradouro(valor);

            case NUMERO ->
                    empresa.setNumero(valor);

            case COMPLEMENTO ->
                    empresa.setComplemento(valor);

            case BAIRRO ->
                    empresa.setBairro(valor);

            case NOME_FANTASIA ->
                    empresa.setNomeFantasia(valor);

            case NATUREZA_JURIDICA ->
                    empresa.setNaturezaJuridica(valor);

            case SITUACAO_CADASTRAL ->
                    empresa.setSituacaoCadastral(
                            Integer.valueOf(valor)
                    );

            case DATA_ABERTURA ->
                    empresa.setDataAbertura(
                            LocalDate.parse(valor)
                    );

            case EMAIL_CONTATO ->
                    empresa.setEmailContato(valor);

            case TELEFONE_PRINCIPAL ->
                    empresa.setTelefonePrincipal(valor);

            case TELEFONE_SECUNDARIO ->
                    empresa.setTelefoneSecundario(valor);
        }
    }

    private static EnriquecimentoEmpresaResponse resposta(
            Empresa empresa
    ) {
        var valores = valores(empresa);

        var origens =
                new HashMap<String, Map<String, String>>();

        if (empresa.getOrigemEnriquecimento() != null) {
            empresa.getOrigemEnriquecimento()
                    .forEach((campo, origem) -> {

                        boolean corresponde =
                                Arrays.stream(
                                                CampoEnriquecimentoEmpresa.values()
                                        )
                                        .anyMatch(item ->
                                                item.name().equals(campo)
                                                        && Objects.equals(
                                                        valores.get(item),
                                                        origem.get("valor")
                                                )
                                        );

                        if (corresponde) {
                            origens.put(
                                    campo,
                                    Map.copyOf(origem)
                            );
                        }
                    });
        }

        return new EnriquecimentoEmpresaResponse(
                empresa.getId(),
                empresa.getVersao(),
                Map.copyOf(valores),
                Map.copyOf(origens)
        );
    }
}