package neocore.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.TipoFonteDados;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "fontes_dados")
public class FonteDados {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id")
    private Empresa empresa;

    @Column(nullable = false, length = 160)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoFonteDados tipo;

    @Column(name = "endereco_origem", nullable = false, columnDefinition = "TEXT")
    private String enderecoOrigem;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "condicoes_uso", columnDefinition = "TEXT")
    private String condicoesUso;

    @Column(nullable = false)
    private Boolean habilitada = false;

    @Column(name = "avaliada_em")
    private OffsetDateTime avaliadaEm;

    @Column(name = "valida_ate")
    private OffsetDateTime validaAte;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;
}
