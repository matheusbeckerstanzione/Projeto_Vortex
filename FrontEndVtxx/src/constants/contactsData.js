export const INITIAL_CONTACTS = [
  {
    id: "NC-00142",
    name: "Mariana Souza",
    company: "Mariana Souza Ltda",
    email: "mariana@msouza.com.br",
    phone: "+55 (11) 99842-7310",
    location: "São Paulo, SP - Brasil",
    segment: "Cliente - B2B",
    initials: "MS",
    sourcesCount: 3,
    sourcesLabel: "fontes",
    status: "Unificado",
    statusType: "unified",
    isSelected: true,
    linkedSourcesCount: 3,
    consolidatedData: [
      { label: "Empresa", value: "Mariana Souza Ltda", source: "ERP Omie" },
      { label: "E-mail principal", value: "mariana@msouza.com.br", source: "CRM Salesforce" },
      { label: "Telefone", value: "+55 (11) 99842-7310", source: "CRM Salesforce" },
      { label: "Localização", value: "São Paulo, SP - Brasil", source: "ERP Omie" },
      { label: "Segmento", value: "Cliente - B2B", source: "Importação CSV" }
    ],
    originSources: [
      { name: "CRM Salesforce", code: "SF-00482", status: "Sincronizado", syncDate: "11/10/2026 · 08:42", type: "crm" },
      { name: "ERP Omie", code: "OM-0137", status: "Sincronizado", syncDate: "11/10/2026 · 08:40", type: "erp" },
      { name: "Importação CSV", code: "clientes_outubro.csv", status: "Sincronizado", syncDate: "10/10/2026 · 16:15", type: "csv" }
    ],
    reconciliation: {
      title: "Dados conciliados, sem divergências",
      subtitle: "Perfil atualizado em 11/10/2026, às 08:42."
    },
    history: [
      { date: "11/10/2026 · 08:42", action: "Dados conciliados automaticamente pelo motor NeoCore", source: "NeoCore Engine" },
      { date: "11/10/2026 · 08:40", action: "Sincronização de endereço e razão social via ERP Omie", source: "ERP Omie" },
      { date: "11/10/2026 · 07:15", action: "Atualização de e-mail e telefone via CRM Salesforce", source: "CRM Salesforce" },
      { date: "10/10/2026 · 16:15", action: "Primeiro registro importado da planilha clientes_outubro.csv", source: "Importação CSV" }
    ],
    notes: [
      { id: 1, author: "Carlos Lima", date: "11/10/2026 às 09:30", text: "Cliente confirmou os dados de faturamento para o contrato B2B anual." },
      { id: 2, author: "Ana Silva", date: "08/10/2026 às 14:15", text: "Aguardando validação do novo número de WhatsApp corporativo." }
    ],
    rawRecords: [
      {
        system: "CRM Salesforce",
        id: "SF-00482",
        status: "Ativo / Sincronizado",
        fields: {
          "Contact Name": "Mariana Souza",
          "Email": "mariana@msouza.com.br",
          "Phone": "+55 11 99842-7310",
          "Account Name": "Mariana Souza Ltda",
          "Lead Source": "Inbound Website"
        }
      },
      {
        system: "ERP Omie",
        id: "OM-0137",
        status: "Ativo / Sincronizado",
        fields: {
          "Razão Social": "Mariana Souza Ltda",
          "CNPJ": "12.345.678/0001-90",
          "Endereço": "Av. Paulista, 1000 - Bela Vista",
          "Cidade/UF": "São Paulo, SP - Brasil",
          "Inscrição Estadual": "112.233.445.556"
        }
      },
      {
        system: "Importação CSV",
        id: "clientes_outubro.csv",
        status: "Arquivo Processado",
        fields: {
          "Linha do Arquivo": "42",
          "Segmento Informado": "Cliente - B2B",
          "Data do Lote": "10/10/2026 16:15"
        }
      }
    ]
  },
  {
    id: "NC-00143",
    name: "Rafael Almeida",
    company: "Brasil Comércio",
    email: "rafael@brasilcomercio.com.br",
    phone: "+55 (11) 98765-4321",
    location: "Campinas, SP - Brasil",
    segment: "Varejo",
    initials: "RA",
    sourcesCount: 2,
    sourcesLabel: "fontes",
    status: "Unificado",
    statusType: "unified",
    isSelected: false,
    linkedSourcesCount: 2,
    consolidatedData: [
      { label: "Empresa", value: "Brasil Comércio", source: "ERP Omie" },
      { label: "E-mail principal", value: "rafael@brasilcomercio.com.br", source: "CRM Salesforce" },
      { label: "Telefone", value: "+55 (11) 98765-4321", source: "CRM Salesforce" },
      { label: "Localização", value: "Campinas, SP - Brasil", source: "ERP Omie" },
      { label: "Segmento", value: "Varejo", source: "Importação CSV" }
    ],
    originSources: [
      { name: "CRM Salesforce", code: "SF-00380", status: "Sincronizado", syncDate: "10/10/2026 · 15:30", type: "crm" },
      { name: "ERP Omie", code: "OM-0112", status: "Sincronizado", syncDate: "10/10/2026 · 15:28", type: "erp" }
    ],
    reconciliation: {
      title: "Dados conciliados, sem divergências",
      subtitle: "Perfil atualizado em 10/10/2026, às 15:30."
    },
    history: [
      { date: "10/10/2026 · 15:30", action: "Sincronização com CRM Salesforce concluída com sucesso", source: "CRM Salesforce" },
      { date: "10/10/2026 · 15:28", action: "Dados fiscais vinculados ao ERP Omie", source: "ERP Omie" }
    ],
    notes: [
      { id: 1, author: "Carlos Lima", date: "10/10/2026 às 16:00", text: "Cliente solicitou envio de propostas no e-mail financeiro." }
    ],
    rawRecords: [
      {
        system: "CRM Salesforce",
        id: "SF-00380",
        status: "Ativo / Sincronizado",
        fields: {
          "Contact Name": "Rafael Almeida",
          "Email": "rafael@brasilcomercio.com.br",
          "Phone": "+55 11 98765-4321"
        }
      },
      {
        system: "ERP Omie",
        id: "OM-0112",
        status: "Ativo / Sincronizado",
        fields: {
          "Razão Social": "Brasil Comércio de Alimentos Eireli",
          "Cidade/UF": "Campinas, SP - Brasil"
        }
      }
    ]
  },
  {
    id: "NC-00144",
    name: "Camila Torres",
    company: "Ateliê Nova Era",
    email: "camila@atelienovaera.com.br",
    phone: "+55 (21) 99432-1100",
    location: "Rio de Janeiro, RJ - Brasil",
    segment: "Moda & Design",
    initials: "CT",
    sourcesCount: 2,
    sourcesLabel: "fontes",
    status: "Em revisão",
    statusType: "review",
    isSelected: false,
    linkedSourcesCount: 2,
    consolidatedData: [
      { label: "Empresa", value: "Ateliê Nova Era", source: "ERP Omie" },
      { label: "E-mail principal", value: "camila@atelienovaera.com.br", source: "CRM Salesforce" },
      { label: "Telefone", value: "+55 (21) 99432-1100", source: "CRM Salesforce" },
      { label: "Localização", value: "Rio de Janeiro, RJ - Brasil", source: "ERP Omie" },
      { label: "Segmento", value: "Moda & Design", source: "Importação CSV" }
    ],
    originSources: [
      { name: "CRM Salesforce", code: "SF-00411", status: "Pendente", syncDate: "11/10/2026 · 07:15", type: "crm" },
      { name: "ERP Omie", code: "OM-0129", status: "Sincronizado", syncDate: "11/10/2026 · 07:00", type: "erp" }
    ],
    reconciliation: {
      title: "Divergência detectada no endereço",
      subtitle: "Necessária conferência manual antes de unificar."
    },
    history: [
      { date: "11/10/2026 · 07:15", action: "Alerta de conflito entre endereço do Salesforce e Omie", source: "Motor de Conciliação" }
    ],
    notes: [
      { id: 1, author: "Equipe Suporte", date: "11/10/2026 às 08:00", text: "Verificar se o showroom mudou para Ipanema." }
    ],
    rawRecords: [
      {
        system: "CRM Salesforce",
        id: "SF-00411",
        status: "Pendente de Conciliação",
        fields: {
          "Contact Name": "Camila Torres",
          "Email": "camila@atelienovaera.com.br",
          "Endereço": "Rua Visconde de Pirajá, 300 - Rio de Janeiro"
        }
      },
      {
        system: "ERP Omie",
        id: "OM-0129",
        status: "Sincronizado",
        fields: {
          "Razão Social": "Nova Era Modas ME",
          "Endereço Cadastral": "Rua da Alfândega, 85 - Centro"
        }
      }
    ]
  },
  {
    id: "NC-00145",
    name: "Lucas Ferreira",
    company: "Horizonte Tecnologia",
    email: "lucas@horizontetec.com.br",
    phone: "+55 (31) 98877-6655",
    location: "Belo Horizonte, MG - Brasil",
    segment: "Tecnologia / SaaS",
    initials: "LF",
    sourcesCount: 3,
    sourcesLabel: "fontes",
    status: "Unificado",
    statusType: "unified",
    isSelected: false,
    linkedSourcesCount: 3,
    consolidatedData: [
      { label: "Empresa", value: "Horizonte Tecnologia", source: "ERP Omie" },
      { label: "E-mail principal", value: "lucas@horizontetec.com.br", source: "CRM Salesforce" },
      { label: "Telefone", value: "+55 (31) 98877-6655", source: "CRM Salesforce" },
      { label: "Localização", value: "Belo Horizonte, MG - Brasil", source: "ERP Omie" },
      { label: "Segmento", value: "Tecnologia / SaaS", source: "Importação CSV" }
    ],
    originSources: [
      { name: "CRM Salesforce", code: "SF-00490", status: "Sincronizado", syncDate: "11/10/2026 · 09:12", type: "crm" },
      { name: "ERP Omie", code: "OM-0145", status: "Sincronizado", syncDate: "11/10/2026 · 09:10", type: "erp" },
      { name: "Importação CSV", code: "clientes_outubro.csv", status: "Sincronizado", syncDate: "10/10/2026 · 16:15", type: "csv" }
    ],
    reconciliation: {
      title: "Dados conciliados, sem divergências",
      subtitle: "Perfil atualizado em 11/10/2026, às 09:12."
    },
    history: [
      { date: "11/10/2026 · 09:12", action: "Perfil unificado com sucesso em 3 fontes", source: "NeoCore Engine" }
    ],
    notes: [],
    rawRecords: []
  },
  {
    id: "NC-00146",
    name: "Beatriz Costa",
    company: "Costa & Associados",
    email: "beatriz@costaassociados.com.br",
    phone: "+55 (41) 99123-4567",
    location: "Curitiba, PR - Brasil",
    segment: "Jurídico",
    initials: "BC",
    sourcesCount: 1,
    sourcesLabel: "fonte",
    status: "Unificado",
    statusType: "unified",
    isSelected: false,
    linkedSourcesCount: 1,
    consolidatedData: [
      { label: "Empresa", value: "Costa & Associados", source: "ERP Omie" },
      { label: "E-mail principal", value: "beatriz@costaassociados.com.br", source: "ERP Omie" },
      { label: "Telefone", value: "+55 (41) 99123-4567", source: "ERP Omie" },
      { label: "Localização", value: "Curitiba, PR - Brasil", source: "ERP Omie" },
      { label: "Segmento", value: "Jurídico", source: "ERP Omie" }
    ],
    originSources: [
      { name: "ERP Omie", code: "OM-0150", status: "Sincronizado", syncDate: "10/10/2026 · 11:00", type: "erp" }
    ],
    reconciliation: {
      title: "Dados conciliados, sem divergências",
      subtitle: "Perfil atualizado em 10/10/2026, às 11:00."
    },
    history: [],
    notes: [],
    rawRecords: []
  },
  {
    id: "NC-00147",
    name: "Pedro Santos",
    company: "Santos Logística",
    email: "pedro@santoslog.com.br",
    phone: "+55 (11) 97766-5544",
    location: "Santos, SP - Brasil",
    segment: "Logística",
    initials: "PS",
    sourcesCount: 2,
    sourcesLabel: "fontes",
    status: "Em revisão",
    statusType: "review",
    isSelected: false,
    linkedSourcesCount: 2,
    consolidatedData: [
      { label: "Empresa", value: "Santos Logística", source: "ERP Omie" },
      { label: "E-mail principal", value: "pedro@santoslog.com.br", source: "CRM Salesforce" },
      { label: "Telefone", value: "+55 (11) 97766-5544", source: "CRM Salesforce" },
      { label: "Localização", value: "Santos, SP - Brasil", source: "ERP Omie" },
      { label: "Segmento", value: "Logística", source: "Importação CSV" }
    ],
    originSources: [
      { name: "CRM Salesforce", code: "SF-00499", status: "Pendente", syncDate: "11/10/2026 · 08:05", type: "crm" },
      { name: "ERP Omie", code: "OM-0148", status: "Sincronizado", syncDate: "11/10/2026 · 08:00", type: "erp" }
    ],
    reconciliation: {
      title: "Divergência de Razão Social",
      subtitle: "Aguardando aprovação de conciliação."
    },
    history: [],
    notes: [],
    rawRecords: []
  },
  {
    id: "NC-00148",
    name: "Juliana Lima",
    company: "Studio Lima",
    email: "juliana@studiolima.com.br",
    phone: "+55 (71) 98112-3344",
    location: "Salvador, BA - Brasil",
    segment: "Arquitetura",
    initials: "JL",
    sourcesCount: 2,
    sourcesLabel: "fontes",
    status: "Unificado",
    statusType: "unified",
    isSelected: false,
    linkedSourcesCount: 2,
    consolidatedData: [
      { label: "Empresa", value: "Studio Lima", source: "ERP Omie" },
      { label: "E-mail principal", value: "juliana@studiolima.com.br", source: "CRM Salesforce" },
      { label: "Telefone", value: "+55 (71) 98112-3344", source: "CRM Salesforce" },
      { label: "Localização", value: "Salvador, BA - Brasil", source: "ERP Omie" },
      { label: "Segmento", value: "Arquitetura", source: "Importação CSV" }
    ],
    originSources: [
      { name: "CRM Salesforce", code: "SF-00502", status: "Sincronizado", syncDate: "11/10/2026 · 08:15", type: "crm" },
      { name: "Importação CSV", code: "clientes_outubro.csv", status: "Sincronizado", syncDate: "10/10/2026 · 16:15", type: "csv" }
    ],
    reconciliation: {
      title: "Dados conciliados, sem divergências",
      subtitle: "Perfil atualizado em 11/10/2026, às 08:15."
    },
    history: [],
    notes: [],
    rawRecords: []
  }
];
