package neocore.Service;
import neocore.Model.*;
import neocore.Model.Enum.*;
import neocore.Mapper.*;
import neocore.Repository.*;
import neocore.Security.*;
import neocore.Exception.*;
import neocore.DTO.empresa.*;
import neocore.DTO.autenticacao.*;
import neocore.DTO.segmento.*;
import neocore.DTO.conviteacesso.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.*;
import java.util.*;
import java.math.BigDecimal;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ServicesTest {
    private MfaService mfa(){return new MfaService(Base64.getEncoder().encodeToString(new byte[32]));}
    @Test void totpSegueVetoresRfc6238(){
        String segredo="GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
        assertEquals("287082",MfaService.codigo(segredo,59/30));
        assertEquals("081804",MfaService.codigo(segredo,1111111109L/30));
        assertEquals("050471",MfaService.codigo(segredo,1111111111L/30));
        assertEquals("005924",MfaService.codigo(segredo,1234567890L/30));
    }
    @Test void segredoUsaCifragemAutenticadaComNonceUnico(){
        var m=mfa();String segredo="GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
        String a=m.cifrar(segredo),b=m.cifrar(segredo);assertNotEquals(a,b);assertFalse(a.contains(segredo));
        long contador=Instant.now().getEpochSecond()/30;
        assertEquals(contador,m.validar(a,MfaService.codigo(segredo,contador),0));
        byte[] alterado=Base64.getDecoder().decode(a);alterado[alterado.length-1]^=1;
        assertThrows(IllegalStateException.class,()->m.validar(Base64.getEncoder().encodeToString(alterado),"123456",0));
    }
    @Test void codigoMfaNaoPodeSerReutilizado(){
        var m=mfa();var config=m.gerar("teste@example.org");long contador=Instant.now().getEpochSecond()/30;
        String codigo=MfaService.codigo(config.segredo(),contador);
        assertThrows(BadCredentialsException.class,()->m.validar(m.cifrar(config.segredo()),codigo,contador+1));
    }
    @Test void chaveMfaAusenteImpedeInicializacao(){assertThrows(IllegalStateException.class,()->new MfaService(""));}
    @Test void desafioNaoEUmTokenDeAcesso(){
        var tokens=new TokenStore();String desafio=tokens.criar(UUID.randomUUID(),0,true);
        assertThrows(BadCredentialsException.class,()->tokens.obter(desafio,false));
        assertTrue(tokens.obter(desafio,true).desafio);
    }
    @Test void limiteDeTentativasInvalidaDesafio(){
        var tokens=new TokenStore();String t=tokens.criar(UUID.randomUUID(),0,true);
        for(int i=0;i<5;i++)tokens.tentativa(t);
        assertThrows(BadCredentialsException.class,()->tokens.tentativa(t));
        assertThrows(BadCredentialsException.class,()->tokens.obter(t,true));
    }
    @Test void revogacaoRemoveTokensDoUsuario(){
        var tokens=new TokenStore();UUID id=UUID.randomUUID();String a=tokens.criar(id,0,false),b=tokens.criar(id,0,true);
        tokens.revogar(id);assertThrows(BadCredentialsException.class,()->tokens.obter(a,false));assertThrows(BadCredentialsException.class,()->tokens.obter(b,true));
    }
    @Test void criteriosRejeitamCamposDesconhecidosEVazios(){
        var c=new CriteriosSegmento(null);
        assertThrows(RegraNegocioException.class,()->c.validar(Map.of("salario","alto")));
        assertThrows(RegraNegocioException.class,()->c.validar(Map.of("modo","OR")));
        assertThrows(RegraNegocioException.class,()->c.validar(Map.of("uf",42)));
        assertThrows(RegraNegocioException.class,()->c.validar(Map.of("empresaId","invalido")));
    }
    @Test void criteriosPreservamAndOuOrENormalizamUf(){
        var c=new CriteriosSegmento(null);
        assertEquals("AND",c.validar(Map.of("uf","sp")).get("modo"));
        assertEquals("SP",c.validar(Map.of("uf","sp")).get("uf"));
        assertEquals("OR",c.validar(Map.of("modo","or","setor","Software","cidade","Recife")).get("modo"));
    }
    @Test void csvProtegeFormulasEAspas(){
        assertEquals("\"'=SOMA(1;1)\"",ExportacaoService.celula("=SOMA(1;1)"));
        assertEquals("\"A \"\"B\"\"\"",ExportacaoService.celula("A \"B\""));
        assertFalse(ExportacaoService.celula("x\ny").contains("\n"));
    }
    @Test void valoresFinanceirosNaoSaoArredondadosSilenciosamente(){
        assertThrows(RegraNegocioException.class,()->ServiceSupport.dinheiro(new BigDecimal("1.234")));
        assertThrows(RegraNegocioException.class,()->ServiceSupport.dinheiro(new BigDecimal("-1")));
        assertThrows(RegraNegocioException.class,()->ServiceSupport.dinheiro(new BigDecimal("10000000000")));
        assertDoesNotThrow(()->ServiceSupport.dinheiro(new BigDecimal("150.50")));
    }
    @Test void cnpjDuplicadoNaoESalvo(){
        var repo=mock(EmpresaRepository.class);var support=mock(ServiceSupport.class);
        var r=new EmpresaRequest("Nome","slug","12345678000190","Software","Recife","PE",null,null);
        when(support.duplicado(Empresa.class,"cnpj",r.cnpj(),null)).thenReturn(true);
        var service=new EmpresaService(repo,new EmpresaMapper(),support,mock(AuditoriaService.class));
        assertThrows(ConflitoException.class,()->service.cadastrar(r));verify(repo,never()).save(any());
    }
    @Test void cadastroPreencheDatasENormalizaUf(){
        var repo=mock(EmpresaRepository.class);var support=mock(ServiceSupport.class);
        when(repo.save(any())).thenAnswer(i->i.getArgument(0));
        var service=new EmpresaService(repo,new EmpresaMapper(),support,mock(AuditoriaService.class));
        var result=service.cadastrar(new EmpresaRequest("Nome","SLUG","12345678000190","Software","Recife","pe",null,null));
        assertNotNull(result.criadoEm());assertEquals(result.criadoEm(),result.atualizadoEm());assertEquals("PE",result.uf());assertEquals("slug",result.slug());
    }
    @Test void cadastroDeSegmentoComecaEmRascunho(){
        var support=mock(ServiceSupport.class);
        var service=new SegmentoService(mock(SegmentoRepository.class),mock(SegmentoContatoRepository.class),
                new SegmentoMapper(),new SegmentoContatoMapper(),new ContatoMapper(),support,new CriteriosSegmento(null),mock(AuditoriaService.class),mock(EntityManager.class));
        var r=new SegmentoRequest("Teste",null,Map.of("uf","SP"),UUID.randomUUID(),StatusSegmento.ATIVO);
        assertThrows(RegraNegocioException.class,()->service.cadastrar(r));
    }
    @Test void loginComSenhaCorretaNaoEmiteAcessoAntesDoMfa(){
        var em=mock(EntityManager.class);var support=mock(ServiceSupport.class);var encoder=mock(PasswordEncoder.class);var tokens=new TokenStore();
        Usuario u=usuario();u.setSenhaHash("hash");
        jakarta.persistence.TypedQuery<Usuario> q=mock(jakarta.persistence.TypedQuery.class);
        when(em.createQuery(anyString(),eq(Usuario.class))).thenReturn(q);when(q.setParameter(anyString(),any())).thenReturn(q);
        when(q.setMaxResults(2)).thenReturn(q);when(q.getResultList()).thenReturn(List.of(u));when(support.bloquear(Usuario.class,u.getId())).thenReturn(u);
        when(encoder.matches("senha","hash")).thenReturn(true);
        var service=new AutenticacaoService(em,support,encoder,tokens,mfa(),mock(AuditoriaService.class));
        var response=service.login(new LoginRequest("teste@example.org","senha"));
        assertFalse(response.autenticado());assertTrue(response.mfaNecessario());
        assertThrows(BadCredentialsException.class,()->tokens.obter(response.tokenTemporario(),false));
    }
    @Test void falhaMfaContaTentativaENaoEmiteAcesso(){
        var em=mock(EntityManager.class);var support=mock(ServiceSupport.class);var tokens=new TokenStore();var m=mock(MfaService.class);
        Usuario u=usuario();u.setSegredoMfaCriptografado("cifrado");
        when(support.bloquear(Usuario.class,u.getId())).thenReturn(u);
        when(m.validar(anyString(),anyString(),anyLong())).thenThrow(new BadCredentialsException("Falha"));
        var service=new AutenticacaoService(em,support,mock(PasswordEncoder.class),tokens,m,mock(AuditoriaService.class));
        String desafio=tokens.criar(u.getId(),0,true);
        assertThrows(BadCredentialsException.class,()->service.confirmarMfa(new MfaRequest(desafio,"000000")));
        assertEquals(1,u.getTentativasLogin());verify(em,never()).flush();
    }
    @Test void ativacaoRejeitaConviteJaUtilizado(){
        var repo=mock(ConviteAcessoRepository.class);var support=mock(ServiceSupport.class);var encoder=mock(PasswordEncoder.class);
        Usuario u=usuario();u.setStatus(StatusUsuario.CONVIDADO);
        ConviteAcesso c=new ConviteAcesso();c.setId(UUID.randomUUID());c.setUsuario(u);c.setExpiraEm(OffsetDateTime.now().plusDays(1));c.setUtilizadoEm(OffsetDateTime.now());
        when(repo.findByTokenHash(anyString())).thenReturn(Optional.of(c));when(support.bloquear(Usuario.class,u.getId())).thenReturn(u);
        when(support.bloquear(ConviteAcesso.class,c.getId())).thenReturn(c);
        var service=new ConviteAcessoService(repo,new ConviteAcessoMapper(),new UsuarioMapper(),support,encoder,mock(AuditoriaService.class));
        assertThrows(RegraNegocioException.class,()->service.ativar(new AtivacaoContaRequest("token","SenhaForte123")));
        verify(encoder,never()).encode(any());
    }
    @Test void confirmacaoMfaEmiteAcessoEConsomeDesafio(){
        var em=mock(EntityManager.class);var support=mock(ServiceSupport.class);var tokens=new TokenStore();var m=mock(MfaService.class);
        Usuario u=usuario();u.setSegredoMfaCriptografado("cifrado");
        when(support.bloquear(Usuario.class,u.getId())).thenReturn(u);
        when(m.validar("cifrado","123456",0)).thenReturn(100L);
        var service=new AutenticacaoService(em,support,mock(PasswordEncoder.class),tokens,m,mock(AuditoriaService.class));
        String desafio=tokens.criar(u.getId(),0,true);
        var resposta=service.confirmarMfa(new MfaRequest(desafio,"123456"));
        assertEquals(u.getId(),tokens.obter(resposta.token(),false).usuarioId);
        assertThrows(BadCredentialsException.class,()->tokens.obter(desafio,true));
        assertEquals(100L,u.getUltimoContadorMfa());verify(em).flush();
    }
    @Test void filtroDefinePrincipalDoUsuarioELimpaContexto() throws Exception {
        var tokens=new TokenStore();var repo=mock(UsuarioRepository.class);var u=usuario();u.setSegredoMfaCriptografado("cifrado");
        when(repo.findById(u.getId())).thenReturn(Optional.of(u));
        var req=new org.springframework.mock.web.MockHttpServletRequest();var res=new org.springframework.mock.web.MockHttpServletResponse();
        req.addHeader("Authorization","Bearer "+tokens.criar(u.getId(),0,false));
        new FiltroToken(tokens,repo,new LimitadorRequisicoes()).doFilter(req,res,(request,response)->{
            assertEquals(u.getId(),org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal());
        });
        assertNull(org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
    }
    @Test void filtroRecusaVersaoRevogada() throws Exception {
        var tokens=new TokenStore();var repo=mock(UsuarioRepository.class);var u=usuario();u.setSegredoMfaCriptografado("cifrado");u.setVersaoAcesso(1);
        when(repo.findById(u.getId())).thenReturn(Optional.of(u));
        var req=new org.springframework.mock.web.MockHttpServletRequest();var res=new org.springframework.mock.web.MockHttpServletResponse();
        req.addHeader("Authorization","Bearer "+tokens.criar(u.getId(),0,false));
        new FiltroToken(tokens,repo,new LimitadorRequisicoes()).doFilter(req,res,(request,response)->fail("Token revogado não pode prosseguir."));
        assertEquals(401,res.getStatus());
    }
    private Usuario usuario(){var u=new Usuario();u.setId(UUID.randomUUID());u.setEmail("teste@example.org");u.setNome("Teste");u.setStatus(StatusUsuario.ATIVO);u.setPerfil(PerfilUsuario.ADMINISTRADOR);return u;}
}
