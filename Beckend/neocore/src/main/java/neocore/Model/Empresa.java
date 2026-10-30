package neocore.Model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

import java.time.OffsetDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "empresas")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 160)
    private String nome;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, unique = true, length = 14)
    private String cnpj;

    @Column(nullable = false, length = 80)
    private String setor;

    @Column(nullable = false, length = 100)
    private String cidade;

    @Column(nullable = false, length = 2)
    private String uf;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "url_site", columnDefinition = "TEXT")
    private String urlSite;

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm;


    @Version
    @Column(nullable = false)
    private Long versao;

    @Column(name = "cnae_principal", length = 7)
    private String cnaePrincipal;

    @Column(length = 80)
    private String porte;

    @Column(length = 8)
    private String cep;

    @Column(name = "municipio_ibge", length = 7)
    private String municipioIbge;

    @Column(length = 255)
    private String logradouro;

    @Column(length = 30)
    private String numero;

    @Column(length = 255)
    private String complemento;

    @Column(length = 100)
    private String bairro;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(
            name = "origem_enriquecimento",
            columnDefinition = "jsonb"
    )
    private Map<String, Map<String, String>> origemEnriquecimento;

}
