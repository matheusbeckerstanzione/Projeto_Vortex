package neocore.Model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.CanalCampanha;
import neocore.Model.Enum.EscopoRestricao;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "restricoes_uso")
public class RestricaoUso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contato_id", nullable = false)
    private Contato contato;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finalidade_id")
    private FinalidadeTratamento finalidade;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EscopoRestricao escopo;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private CanalCampanha canal;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String motivo;

    @Column(nullable = false)
    private Boolean ativa = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registrada_por", nullable = false)
    private Usuario registradaPor;

    @Column(name = "criada_em", nullable = false)
    private OffsetDateTime criadaEm;

    @Column(name = "encerrada_em")
    private OffsetDateTime encerradaEm;
}
