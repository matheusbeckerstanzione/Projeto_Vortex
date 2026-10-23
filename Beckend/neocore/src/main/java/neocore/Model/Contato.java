package neocore.Model;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import neocore.Model.Enum.StatusIdentidade;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "contatos")
public class Contato {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(name = "nome_exibicao", nullable = false, length = 120)
    private String nomeExibicao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_identidade", nullable = false, length = 20)
    private StatusIdentidade statusIdentidade;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "revisar_ate", nullable = false)
    private OffsetDateTime revisarAte;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;
}
