package neocore.Model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.CampoEmpresa;
import neocore.Model.Enum.MetodoObtencao;
import neocore.Model.Enum.StatusRevisao;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "atributos_empresa")
public class AtributoEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fonte_id", nullable = false)
    private FonteDados fonte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "finalidade_id", nullable = false)
    private FinalidadeTratamento finalidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CampoEmpresa campo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String valor;

    @Column(name = "referencia_origem", nullable = false, columnDefinition = "TEXT")
    private String referenciaOrigem;

    @Column(name = "trecho_evidencia", nullable = false, columnDefinition = "TEXT")
    private String trechoEvidencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "metodo_obtencao", nullable = false, length = 30)
    private MetodoObtencao metodoObtencao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_revisao", nullable = false, length = 20)
    private StatusRevisao statusRevisao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revisado_por")
    private Usuario revisadoPor;

    @Column(name = "motivo_revisao", columnDefinition = "TEXT")
    private String motivoRevisao;

    @Column(name = "coletado_em", nullable = false)
    private OffsetDateTime coletadoEm;

    @Column(name = "revisado_em")
    private OffsetDateTime revisadoEm;

    @Column(name = "valido_ate", nullable = false)
    private OffsetDateTime validoAte;
}
