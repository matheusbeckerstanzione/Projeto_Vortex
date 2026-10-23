package neocore.Model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.TipoInteracao;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "interacoes_contato",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_interacao_fonte_identificador",
                        columnNames = {"fonte_id", "identificador_origem"}
                )
        }
)
public class InteracaoContato {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contato_id", nullable = false)
    private Contato contato;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campanha_id")
    private Campanha campanha;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "fonte_id", nullable = false)
    private FonteDados fonte;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "finalidade_id", nullable = false)
    private FinalidadeTratamento finalidade;

    @Column(name = "identificador_origem", nullable = false, length = 160)
    private String identificadorOrigem;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_interacao", nullable = false, length = 40)
    private TipoInteracao tipoInteracao;

    @Column(length = 120)
    private String tema;

    @Column(name = "referencia_origem", nullable = false, columnDefinition = "TEXT")
    private String referenciaOrigem;

    @Column(name = "ocorrido_em", nullable = false)
    private OffsetDateTime ocorridoEm;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;
}
