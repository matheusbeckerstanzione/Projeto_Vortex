package neocore.Service;

import neocore.Client.BrasilApiClient;
import neocore.Client.ViaCepClient;

import neocore.DTO.enriquecimento.*;
import neocore.DTO.integracao.BrasilApiCnpjResponse;
import neocore.DTO.integracao.ViaCepResponse;

import neocore.Exception.ConflitoException;
import neocore.Exception.IntegracaoExternaException;
import neocore.Exception.RecursoNaoEncontradoException;
import neocore.Exception.RegraNegocioException;

import neocore.Model.Empresa;
import neocore.Model.FonteDados;
import neocore.Model.Enum.ResultadoAuditoria;
import neocore.Repository.EmpresaRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.net.URI;
import java.text.Normalizer;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
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

            var empresa = suporte.obter(
                    Empresa.class,
                    id
            );

            return resposta(empresa);
        });
    }

    public EnriquecimentoPreviaResponse previa(
            UUID id,
            EnriquecimentoPreviaRequest request
    ) {
        suporte.validar(request);

        var contexto = leitura.execute(status -> {
            var usuario = suporte.atual();

            var empresa = suporte.obter(
                    Empresa.class,
                    id
            );

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

        // Consulta externa depois de encerrar a transação de leitura.
        var b = brasil.consultarCnpj(
                contexto.cnpj()
        );

        OffsetDateTime consultado =
                OffsetDateTime.now(ZoneOffset.UTC);

        var campos =
                new EnumMap<CampoEnriquecimentoEmpresa,
                        CampoEnriquecimentoResponse>(
                        CampoEnriquecimentoEmpresa.class
                );

        var avisos = new ArrayList<String>();

        String urlBrasil =
                "https://brasilapi.com.br/api/cnpj/v1/"
                        + ServiceSupport.cnpj(contexto.cnpj());

        UUID fonteBrasil = request.fonteBrasilApiId();

        propor(
                campos, avisos, contexto,
                NOME, b.razaoSocial(),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                SETOR, b.cnaeFiscalDescricao(),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                CNAE_PRINCIPAL,
                codigo(b.cnaeFiscal(), 7),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                PORTE, b.porte(),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                CIDADE, b.municipio(),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                UF, b.uf(),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                MUNICIPIO_IBGE,
                codigo(b.codigoMunicipioIbge(), 7),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        String logradouro = (
                texto(b.descricaoTipoDeLogradouro())
                        + " "
                        + texto(b.logradouro())
        ).strip();

        if (texto(b.logradouro()).isEmpty()) {
            logradouro = "";
        }

        propor(
                campos, avisos, contexto,
                LOGRADOURO, logradouro,
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                NUMERO, b.numero(),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                COMPLEMENTO, b.complemento(),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        propor(
                campos, avisos, contexto,
                BAIRRO, b.bairro(),
                fonteBrasil, "BrasilAPI",
                urlBrasil, consultado
        );

        String cep = texto(b.cep()).replace("-", "");

        if (cep.matches("[0-9]{8}")) {
            propor(
                    campos, avisos, contexto,
                    CEP, cep,
                    fonteBrasil, "BrasilAPI",
                    urlBrasil, consultado
            );

            try {
                ViaCepResponse v = viaCep.consultarCep(cep);

                if (mesmoMunicipio(b, v)) {
                    String urlViaCep =
                            "https://viacep.com.br/ws/"
                                    + cep + "/json/";

                    OffsetDateTime consultadoViaCep =
                            OffsetDateTime.now(ZoneOffset.UTC);

                    // ViaCEP complementa ausências da BrasilAPI.
                    if (texto(b.municipio()).isEmpty()) {
                        propor(
                                campos, avisos, contexto,
                                CIDADE, v.localidade(),
                                request.fonteViaCepId(),
                                "ViaCEP",
                                urlViaCep,
                                consultadoViaCep
                        );
                    }

                    if (texto(b.uf()).isEmpty()) {
                        propor(
                                campos, avisos, contexto,
                                UF, v.uf(),
                                request.fonteViaCepId(),
                                "ViaCEP",
                                urlViaCep,
                                consultadoViaCep
                        );
                    }

                    if (b.codigoMunicipioIbge() == null) {
                        propor(
                                campos, avisos, contexto,
                                MUNICIPIO_IBGE, v.ibge(),
                                request.fonteViaCepId(),
                                "ViaCEP",
                                urlViaCep,
                                consultadoViaCep
                        );
                    }

                    if (texto(b.logradouro()).isEmpty()) {
                        propor(
                                campos, avisos, contexto,
                                LOGRADOURO, v.logradouro(),
                                request.fonteViaCepId(),
                                "ViaCEP",
                                urlViaCep,
                                consultadoViaCep
                        );
                    }

                    if (texto(b.bairro()).isEmpty()) {
                        propor(
                                campos, avisos, contexto,
                                BAIRRO, v.bairro(),
                                request.fonteViaCepId(),
                                "ViaCEP",
                                urlViaCep,
                                consultadoViaCep
                        );
                    }

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
                                + "prévia contém somente dados "
                                + "da BrasilAPI."
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

        UUID usuarioId = leitura.execute(
                status -> suporte.atual().getId()
        );

        var dados = previas.reservar(
                request.previaId(),
                usuarioId,
                id
        );

        try {
            var resultado = escrita.execute(status -> {
                var usuario = suporte.atual();

                var empresa = suporte.bloquear(
                        Empresa.class,
                        id
                );

                var contexto = dados.contexto();

                if (!dados.resposta().expiraEm()
                        .isAfter(Instant.now())) {

                    throw new ConflitoException(
                            "Prévia expirada. Consulte novamente."
                    );
                }

                boolean cadastroAlterado =
                        empresa.getVersao() != contexto.versao()
                                || !Objects.equals(
                                empresa.getCnpj(),
                                contexto.cnpj()
                        )
                                || !valores(empresa)
                                .equals(contexto.valores());

                if (cadastroAlterado) {
                    throw new ConflitoException(
                            "Cadastro alterado após a prévia. "
                                    + "Consulte novamente."
                    );
                }

                verificarFontes(
                        id,
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
                        selecionados.size()
                                == request.campos().size(),
                        "Campo não disponível nesta prévia."
                );

                exigir(
                        request.campos()
                                .containsAll(request.sobrescrever()),
                        "Sobrescrita deve conter somente "
                                + "campos selecionados."
                );

                validarEndereco(
                        dados,
                        request.campos()
                );

                for (var campo : selecionados) {
                    exigir(
                            !campo.exigeSobrescrita()
                                    || request.sobrescrever()
                                    .contains(campo.campo()),
                            "Autorize a sobrescrita de "
                                    + campo.campo() + "."
                    );
                }

                var origens =
                        new HashMap<String, Map<String, String>>();

                if (empresa.getOrigemEnriquecimento() != null) {
                    origens.putAll(
                            empresa.getOrigemEnriquecimento()
                    );
                }

                OffsetDateTime agora =
                        OffsetDateTime.now(ZoneOffset.UTC);

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
                                            .finalidadeId()
                                            .toString(),

                                    "validoAte",
                                    contexto.request()
                                            .validoAte()
                                            .toString(),

                                    "confirmadoPor",
                                    usuario.getId().toString(),

                                    "confirmadoEm",
                                    agora.toString()
                            )
                    );
                }

                empresa.setOrigemEnriquecimento(origens);
                empresa.setAtualizadoEm(agora);

                auditoria.registrar(
                        usuario,
                        "CONFIRMAR_ENRIQUECIMENTO",
                        "Empresa",
                        id,
                        ResultadoAuditoria.SUCESSO
                );

                // Atualiza também o @Version antes da resposta.
                empresas.flush();

                return resposta(empresa);
            });

            // Descarta a prévia somente depois do commit.
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
                "Fonte pertence a outra empresa."
        );

        try {
            URI uri = URI.create(
                    fonte.getEnderecoOrigem()
            );

            boolean enderecoValido =
                    "https".equalsIgnoreCase(uri.getScheme())
                            && host.equalsIgnoreCase(uri.getHost())
                            && uri.getUserInfo() == null
                            && (
                            uri.getPort() == -1
                                    || uri.getPort() == 443
                    );

            exigir(
                    enderecoValido,
                    "Cadastre a fonte HTTPS correspondente a "
                            + host + "."
            );

        } catch (IllegalArgumentException exception) {
            throw new RegraNegocioException(
                    "Endereço de origem da fonte inválido."
            );
        }
    }

    private static void propor(
            Map<CampoEnriquecimentoEmpresa,
                    CampoEnriquecimentoResponse> campos,
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
            case NOME -> 160;
            case SETOR -> 80;
            case CIDADE, BAIRRO -> 100;
            case UF -> 2;
            case CNAE_PRINCIPAL, MUNICIPIO_IBGE -> 7;
            case CEP -> 8;
            case PORTE -> 80;
            case NUMERO -> 30;
            case LOGRADOURO, COMPLEMENTO -> 255;
        };

        boolean valido = valor.length() <= limite
                && switch (campo) {
            case UF -> valor.matches(
                    "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|"
                            + "PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|"
                            + "SC|SP|SE|TO"
            );

            case CNAE_PRINCIPAL, MUNICIPIO_IBGE ->
                    valor.matches("[0-9]{7}");

            case CEP ->
                    valor.matches("[0-9]{8}");

            default -> true;
        };

        if (!valido) {
            avisos.add(
                    campo + " fora do formato/tamanho; "
                            + "campo ignorado, sem truncamento."
            );

            return;
        }

        String atual = contexto.valores().get(campo);

        // Inclui os valores iguais para validar o endereço completo.
        // O store mostra ao usuário somente os campos alterados.
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
            Set<CampoEnriquecimentoEmpresa> selecionados
    ) {
        var endereco = EnumSet.of(
                CEP,
                CIDADE,
                UF,
                MUNICIPIO_IBGE,
                LOGRADOURO,
                NUMERO,
                COMPLEMENTO,
                BAIRRO
        );

        boolean selecionouEndereco =
                !Collections.disjoint(
                        selecionados,
                        endereco
                );

        if (!selecionouEndereco) {
            return;
        }

        var consultados = dados.valoresConsultados();

        exigir(
                consultados.keySet().containsAll(
                        EnumSet.of(
                                CEP,
                                CIDADE,
                                UF
                        )
                ),
                "Endereço incompleto na consulta: "
                        + "são necessários CEP, cidade e UF."
        );

        var ausentes = endereco.stream()
                .filter(campo ->
                        !dados.contexto().valores()
                                .get(campo).isBlank()
                )
                .filter(campo ->
                        !consultados.containsKey(campo)
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
                .filter(endereco::contains)
                .filter(campo ->
                        !selecionados.contains(campo)
                )
                .toList();

        exigir(
                faltantes.isEmpty(),
                "Confirme todos os campos alterados "
                        + "do endereço em conjunto. "
                        + "Faltam: "
                        + faltantes
        );
    }

    private static boolean mesmoMunicipio(
            BrasilApiCnpjResponse b,
            ViaCepResponse v
    ) {
        if (!texto(b.uf()).isEmpty()
                && !texto(v.uf()).isEmpty()
                && !b.uf().strip()
                .equalsIgnoreCase(v.uf().strip())) {

            return false;
        }

        String ibge = codigo(
                b.codigoMunicipioIbge(),
                7
        );

        if (ibge != null
                && texto(v.ibge()).matches("[0-9]{7}")) {

            return ibge.equals(
                    v.ibge().strip()
            );
        }

        return texto(b.municipio()).isEmpty()
                || texto(v.localidade()).isEmpty()
                || comparar(b.municipio())
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

    private static String codigo(
            Integer valor,
            int tamanho
    ) {
        if (valor == null
                || valor <= 0
                || valor >= Math.pow(10, tamanho)) {

            return null;
        }

        return String.format(
                Locale.ROOT,
                "%0" + tamanho + "d",
                valor
        );
    }

    private static String texto(String valor) {
        return valor == null
                ? ""
                : valor.strip();
    }

    private static Map<CampoEnriquecimentoEmpresa, String> valores(
            Empresa empresa
    ) {
        var mapa =
                new EnumMap<CampoEnriquecimentoEmpresa, String>(
                        CampoEnriquecimentoEmpresa.class
                );

        mapa.put(
                NOME,
                texto(empresa.getNome())
        );

        mapa.put(
                SETOR,
                texto(empresa.getSetor())
        );

        mapa.put(
                CIDADE,
                texto(empresa.getCidade())
        );

        mapa.put(
                UF,
                texto(empresa.getUf())
        );

        mapa.put(
                CNAE_PRINCIPAL,
                texto(empresa.getCnaePrincipal())
        );

        mapa.put(
                PORTE,
                texto(empresa.getPorte())
        );

        mapa.put(
                CEP,
                texto(empresa.getCep())
        );

        mapa.put(
                MUNICIPIO_IBGE,
                texto(empresa.getMunicipioIbge())
        );

        mapa.put(
                LOGRADOURO,
                texto(empresa.getLogradouro())
        );

        mapa.put(
                NUMERO,
                texto(empresa.getNumero())
        );

        mapa.put(
                COMPLEMENTO,
                texto(empresa.getComplemento())
        );

        mapa.put(
                BAIRRO,
                texto(empresa.getBairro())
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

                        boolean correspondeAoValorAtual =
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

                        if (correspondeAoValorAtual) {
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