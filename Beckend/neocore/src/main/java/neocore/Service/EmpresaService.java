package neocore.Service;

import lombok.RequiredArgsConstructor;

import neocore.DTO.empresa.*;
import neocore.Exception.*;
import neocore.Mapper.EmpresaMapper;
import neocore.Model.Empresa;
import neocore.Model.Enum.ResultadoAuditoria;
import neocore.Repository.EmpresaRepository;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmpresaService {

    private final EmpresaRepository repository;
    private final EmpresaMapper mapper;
    private final ServiceSupport suporte;
    private final AuditoriaService auditoria;

    public EmpresaResponse buscarPorId(UUID id) {
        suporte.atual();

        return mapper.toResponse(
                suporte.obter(Empresa.class, id)
        );
    }

    public EmpresaResponse buscarPorCnpj(String cnpj) {
        suporte.atual();

        var empresa = repository.findByCnpj(
                ServiceSupport.cnpj(cnpj)
        ).orElseThrow(() ->
                new RecursoNaoEncontradoException(
                        "Empresa não encontrada."
                )
        );

        return mapper.toResponse(empresa);
    }

    public Page<EmpresaResponse> listar(
            int pagina,
            int tamanho
    ) {
        suporte.atual();

        return repository.findAll(
                suporte.pagina(pagina, tamanho)
        ).map(mapper::toResponse);
    }

    @Transactional
    public EmpresaResponse cadastrar(
            EmpresaRequest request
    ) {
        suporte.atual();
        suporte.validar(request);

        verificar(request, null);

        var empresa = mapper.toEntity(request);

        normalizar(empresa, request);

        empresa.setCriadoEm(OffsetDateTime.now());
        empresa.setAtualizadoEm(empresa.getCriadoEm());

        empresa = repository.save(empresa);

        auditoria.registrar(
                suporte.atual(),
                "CADASTRAR",
                "Empresa",
                empresa.getId(),
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(empresa);
    }

    @Transactional
    public EmpresaResponse atualizar(
            UUID id,
            EmpresaRequest request
    ) {
        suporte.atual();
        suporte.validar(request);

        var empresa = suporte.bloquear(
                Empresa.class,
                id
        );

        // Outro CNPJ representa outro cadastro empresarial.
        ServiceSupport.exigir(
                ServiceSupport.cnpj(empresa.getCnpj())
                        .equals(
                                ServiceSupport.cnpj(request.cnpj())
                        ),
                "O CNPJ identifica a empresa e não pode ser alterado. "
                        + "Para outro CNPJ, cadastre outra empresa."
        );

        boolean mudouLocalidade =
                !empresa.getCidade().strip()
                        .equalsIgnoreCase(
                                request.cidade().strip()
                        )
                        || !empresa.getUf().strip()
                        .equalsIgnoreCase(
                                request.uf().strip()
                        );

        boolean possuiEndereco = Stream.of(
                empresa.getCep(),
                empresa.getMunicipioIbge(),
                empresa.getLogradouro(),
                empresa.getNumero(),
                empresa.getComplemento(),
                empresa.getBairro()
        ).anyMatch(valor ->
                valor != null && !valor.isBlank()
        );

        // Evita manter CEP e endereço antigos em outra cidade/UF.
        ServiceSupport.exigir(
                !mudouLocalidade || !possuiEndereco,
                "A empresa possui endereço enriquecido. "
                        + "Atualize cidade e UF junto com o endereço "
                        + "pelo enriquecimento."
        );

        verificar(request, id);

        mapper.atualizarEntidade(request, empresa);
        normalizar(empresa, request);

        empresa.setAtualizadoEm(OffsetDateTime.now());

        auditoria.registrar(
                suporte.atual(),
                "ATUALIZAR",
                "Empresa",
                id,
                ResultadoAuditoria.SUCESSO
        );

        return mapper.toResponse(empresa);
    }

    private void verificar(
            EmpresaRequest request,
            UUID id
    ) {
        boolean cnpjDuplicado = suporte.duplicado(
                Empresa.class,
                "cnpj",
                ServiceSupport.cnpj(request.cnpj()),
                id
        );

        boolean slugDuplicado = suporte.duplicado(
                Empresa.class,
                "slug",
                request.slug().strip(),
                id
        );

        if (cnpjDuplicado || slugDuplicado) {
            throw new ConflitoException(
                    "CNPJ ou slug já cadastrado."
            );
        }
    }

    private void normalizar(
            Empresa empresa,
            EmpresaRequest request
    ) {
        empresa.setCnpj(
                ServiceSupport.cnpj(request.cnpj())
        );

        empresa.setSlug(
                request.slug()
                        .strip()
                        .toLowerCase(Locale.ROOT)
        );

        empresa.setUf(
                request.uf()
                        .strip()
                        .toUpperCase(Locale.ROOT)
        );
    }
}