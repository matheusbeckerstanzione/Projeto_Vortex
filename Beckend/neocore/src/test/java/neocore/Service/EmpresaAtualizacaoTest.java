package neocore.Service;

import neocore.DTO.empresa.EmpresaRequest;
import neocore.Exception.RegraNegocioException;
import neocore.Mapper.EmpresaMapper;
import neocore.Model.Empresa;
import neocore.Repository.EmpresaRepository;
import org.junit.jupiter.api.*;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmpresaAtualizacaoTest {
    private EmpresaService service;
    private Empresa empresa;
    private AuditoriaService auditoria;

    @BeforeEach void preparar() {
        var suporte = mock(ServiceSupport.class);
        auditoria = mock(AuditoriaService.class);
        empresa = new Empresa(); empresa.setId(UUID.randomUUID());
        empresa.setCnpj("00000000000191"); empresa.setNome("Empresa atual");
        empresa.setCidade("São Paulo"); empresa.setUf("SP");
        when(suporte.bloquear(Empresa.class, empresa.getId())).thenReturn(empresa);
        service = new EmpresaService(mock(EmpresaRepository.class),
                new EmpresaMapper(), suporte, auditoria);
    }

    private EmpresaRequest request(String cnpj, String cidade, String uf) {
        return new EmpresaRequest("Nome atualizado", "empresa", cnpj,
                "Tecnologia", cidade, uf, null, null);
    }

    @Test void naoTrocaCnpjDaEmpresaComDadosEnriquecidos() {
        empresa.setPorte("PEQUENO PORTE"); empresa.setCep("01001000");
        assertThrows(RegraNegocioException.class, () -> service.atualizar(empresa.getId(),
                request("11111111000111", "São Paulo", "SP")));
        assertEquals("00000000000191", empresa.getCnpj()); assertEquals("01001000", empresa.getCep());
        assertEquals("Empresa atual", empresa.getNome()); verifyNoInteractions(auditoria);
    }

    @Test void tambemNaoTrocaCnpjSemEnriquecimento() {
        assertThrows(RegraNegocioException.class, () -> service.atualizar(empresa.getId(),
                request("11111111000111", "São Paulo", "SP")));
    }

    @Test void mesmoCnpjPermiteAtualizarNomePreservandoEnriquecimento() {
        empresa.setCep("01001000"); empresa.setPorte("PEQUENO PORTE");
        service.atualizar(empresa.getId(), request(empresa.getCnpj(), "São Paulo", "sp"));
        assertEquals("Nome atualizado", empresa.getNome()); assertEquals("SP", empresa.getUf());
        assertEquals("01001000", empresa.getCep()); assertEquals("PEQUENO PORTE", empresa.getPorte());
    }

    @Test void cidadeIsoladaNaoDeixaEnderecoAntigoEmOutraLocalidade() {
        empresa.setCep("01001000");
        assertThrows(RegraNegocioException.class, () -> service.atualizar(empresa.getId(),
                request(empresa.getCnpj(), "Campinas", "SP")));
        assertEquals("São Paulo", empresa.getCidade()); assertEquals("01001000", empresa.getCep());
    }

    @Test void semDadosPostaisPermiteAtualizarCidade() {
        service.atualizar(empresa.getId(), request(empresa.getCnpj(), "Campinas", "SP"));
        assertEquals("Campinas", empresa.getCidade());
    }
}
