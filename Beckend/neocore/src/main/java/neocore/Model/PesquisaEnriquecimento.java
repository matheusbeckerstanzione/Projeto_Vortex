package neocore.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.StatusPesquisa;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "pesquisas_enriquecimento")
public class PesquisaEnriquecimento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solicitado_por", nullable = false)
    private Usuario solicitadoPor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "finalidade_id", nullable = false)
    private FinalidadeTratamento finalidade;

    @Column(nullable = false, length = 80)
    private String setor;

    @Column(nullable = false, length = 100)
    private String cidade;

    @Column(nullable = false, length = 2)
    private String uf;

    @Column(name = "limite_empresas", nullable = false)
    private Integer limiteEmpresas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusPesquisa status;

    @Column(name = "iniciada_em")
    private OffsetDateTime iniciadaEm;

    @Column(name = "finalizada_em")
    private OffsetDateTime finalizadaEm;

    @Column(name = "criada_em", nullable = false)
    private OffsetDateTime criadaEm;
}
