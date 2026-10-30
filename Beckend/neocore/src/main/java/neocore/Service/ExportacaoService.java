package neocore.Service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

import neocore.Model.*;
import neocore.Model.Enum.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExportacaoService {

    private final EntityManager em;
    private final ServiceSupport suporte;
    private final CriteriosSegmento criterios;
    private final AuditoriaService auditoria;

    @Transactional
    public byte[] exportarSegmento(UUID segmentoId) {
        var autor = suporte.atual();
        var segmento = suporte.obter(Segmento.class, segmentoId);

        suporte.dono(segmento.getCriadoPor());

        ServiceSupport.exigir(
                segmento.getStatus() == StatusSegmento.ATIVO,
                "Segmento precisa estar ativo."
        );

        UUID finalidadeId = segmento.getFinalidade().getId();

        suporte.finalidade(finalidadeId);

        long total = em.createQuery(
                        """
                        select count(m) from SegmentoContato m
                        where m.segmento.id = :id
                        """,
                        Long.class
                )
                .setParameter("id", segmentoId)
                .getSingleResult();

        ServiceSupport.exigir(
                total <= 10000,
                "Exportação limitada a 10.000 associações; refine o segmento."
        );

        StringBuilder csv = new StringBuilder(
                "contato_id;nome;empresa;cnpj;setor;cidade;uf\r\n"
        );

        for (int offset = 0; offset < total; offset += 100) {
            var lote = em.createQuery(
                            """
                            select m from SegmentoContato m
                            join fetch m.contato c
                            join fetch c.empresa
                            where m.segmento.id = :id
                            order by m.id
                            """,
                            SegmentoContato.class
                    )
                    .setParameter("id", segmentoId)
                    .setFirstResult(offset)
                    .setMaxResults(100)
                    .getResultList();

            for (var membro : lote) {
                var contato = membro.getContato();

                boolean bloqueado = suporte.restrito(
                        contato.getId(),
                        finalidadeId,
                        EscopoRestricao.EXPORTACAO,
                        null
                );

                if (!criterios.corresponde(contato, segmento)
                        || bloqueado) {
                    continue;
                }

                var empresa = contato.getEmpresa();

                csv.append(
                        String.join(
                                ";",
                                celula(contato.getId().toString()),
                                celula(contato.getNomeExibicao()),
                                celula(empresa.getNome()),
                                celula(empresa.getCnpj()),
                                celula(empresa.getSetor()),
                                celula(empresa.getCidade()),
                                celula(empresa.getUf())
                        )
                ).append("\r\n");
            }
        }

        auditoria.registrar(
                autor,
                "EXPORTAR",
                "Segmento",
                segmentoId,
                ResultadoAuditoria.SUCESSO
        );

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    static String celula(String valor) {
        if (valor == null) {
            valor = "";
        }

        valor = valor.replace("\r", " ")
                .replace("\n", " ")
                .replace("\t", " ");

        String inicio = valor.stripLeading();

        if (!inicio.isEmpty()
                && "=+-@".indexOf(inicio.charAt(0)) >= 0) {
            valor = "'" + valor;
        }

        return "\"" + valor.replace("\"", "\"\"") + "\"";
    }
}