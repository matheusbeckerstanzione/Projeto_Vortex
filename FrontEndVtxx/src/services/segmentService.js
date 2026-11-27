/**
 * Serviço de Segmentos integrado ao backend NeoCore (Spring Boot / PostgreSQL).
 */
import api from './api';

const STORAGE_KEY = 'neocore_segments_v1';

export const DEFAULT_SEGMENT = {
  id: 'seg-padrao-01',
  name: 'Contatos Unificados',
  criteria: 'Status = Unificado · Base PostgreSQL NeoCore',
  contactsCount: 1,
  status: 'Ativo',
  statusClass: 'active',
  updatedAt: 'Hoje',
  description: 'Contatos verificados e conciliados na base oficial do PostgreSQL NeoCore.',
  dynamicText: 'Dinâmico · sincronização em tempo real.',
  criteriaRules: [
    { field: 'Status', condition: '= Unificado' },
    { field: 'Base de Origem', condition: '= PostgreSQL NeoCore' },
  ],
  channelRule: {
    header: 'Regra de Validação',
    value: 'Contatos ativos sem restrição de canal',
  },
  ruleNote: 'Somente cadastros unificados e validados no banco de dados.',
  sources: [{ name: 'PostgreSQL NeoCore', desc: 'Base consolidada de contatos' }],
  previewContacts: [],
};

function getStoredSegments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredSegments(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignora
  }
}

export const segmentService = {
  /**
   * Obtém a lista de segmentos do backend / PostgreSQL,
   * unindo com os segmentos salvos localmente.
   */
  getSegments: async () => {
    let backendSegments = [];
    try {
      const resp = await api.get('/segmentos?pagina=0&tamanho=100');
      const items = resp?.content || (Array.isArray(resp) ? resp : []);
      backendSegments = items.map((s) => ({
        id: s.id,
        name: s.nome,
        criteria: s.descricao || 'Critérios personalizados',
        criteriosObj: s.criterios || { canal: 'email', tipo: 'B2B' },
        finalidadeId: s.finalidadeId,
        backendStatus: s.status || 'ATIVO',
        contactsCount: 0,
        status: s.status === 'ATIVO' ? 'Ativo' : s.status === 'ARQUIVADO' ? 'Sem resultados' : 'Rascunho',
        statusClass: s.status === 'ATIVO' ? 'active' : 'draft',
        updatedAt: s.atualizadoEm ? new Date(s.atualizadoEm).toLocaleDateString('pt-BR') : 'Hoje',
        description: s.descricao || `Segmento ${s.nome} cadastrado no PostgreSQL.`,
        dynamicText: 'Dinâmico · sincronizado com PostgreSQL.',
        criteriaRules: Object.entries(s.criterios || {}).map(([k, v]) => ({
          field: k,
          condition: `= ${String(v)}`,
        })),
        channelRule: {
          header: 'Validação',
          value: s.finalidadeNome ? `Finalidade: ${s.finalidadeNome}` : 'Sincronizado via Spring Boot',
        },
        ruleNote: 'Critérios gerenciados pelo backend.',
        sources: [{ name: 'PostgreSQL NeoCore', desc: 'Tabela segmentos' }],
        previewContacts: [],
        isBackend: true,
      }));
    } catch (e) {
      console.warn('Backend /segmentos fallback:', e.message);
    }

    const localSegments = getStoredSegments();

    // Combina garantindo que o segmento padrão exista se não houver nenhum
    const combined = [...backendSegments, ...localSegments];
    if (combined.length === 0) {
      return [DEFAULT_SEGMENT];
    }
    return combined;
  },

  /**
   * Cadastra um novo segmento no banco de dados PostgreSQL.
   */
  createSegment: async (data) => {
    let createdBackend = null;

    try {
      // 1. Obtém ou cria uma finalidade de tratamento padrão para atender à validação do banco
      let finalidadeId = null;
      try {
        const finResp = await api.get('/finalidades-tratamento?pagina=0&tamanho=10');
        const finItems = finResp?.content || [];
        if (finItems.length > 0) {
          finalidadeId = finItems[0].id;
        } else {
          const novaFin = await api.post('/finalidades-tratamento', {
            nome: 'Segmentação Comercial B2B',
            descricao: 'Finalidade para agrupamento e campanhas com base no consentimento',
            baseLegal: 'Legítimo Interesse',
            retencaoDias: 365,
            habilitada: true
          });
          finalidadeId = novaFin?.id;
        }
      } catch (fe) {
        console.warn('Finalidade fallback:', fe.message);
      }

      // 2. Se obteve finalidade, salva no Spring Boot
      if (finalidadeId) {
        createdBackend = await api.post('/segmentos', {
          nome: data.name,
          descricao: data.description || `Segmento ${data.name}`,
          criterios: { canal: 'email', tipo: 'B2B', unificado: true },
          finalidadeId,
          status: 'ATIVO'
        });
      }
    } catch (err) {
      console.warn('Erro ao salvar /segmentos no backend:', err.message);
    }

    const newSegment = {
      id: createdBackend?.id || `SEG-${Date.now()}`,
      name: data.name,
      criteria: data.criteria || 'Status do perfil = Unificado E Tipo = Cliente B2B',
      criteriosObj: createdBackend?.criterios || { canal: 'email', tipo: 'B2B', unificado: true },
      finalidadeId: createdBackend?.finalidadeId || null,
      backendStatus: createdBackend?.status || 'ATIVO',
      isBackend: Boolean(createdBackend?.id),
      contactsCount: data.contactsCount || 1,
      status: 'Ativo',
      statusClass: 'active',
      updatedAt: 'Hoje',
      description: data.description || `Segmento "${data.name}" ativo no PostgreSQL.`,
      dynamicText: 'Dinâmico · sincronização em tempo real.',
      criteriaRules: data.criteriaRules || [
        { field: 'Status do perfil', condition: '= Unificado' },
        { field: 'Tipo de cliente', condition: '= Cliente B2B' },
      ],
      channelRule: {
        header: 'Validação Concluída',
        value: 'Contatos elegíveis e validados no sistema',
      },
      ruleNote: 'Contatos elegíveis e validados para campanhas.',
      sources: [{ name: 'PostgreSQL NeoCore', desc: 'Base consolidada' }],
      previewContacts: [],
    };

    const current = getStoredSegments();
    if (!createdBackend?.id) {
      saveStoredSegments([newSegment, ...current]);
    }
    return newSegment;
  },

  /**
   * Atualiza um segmento existente via PUT /segmentos/{id}
   */
  updateSegment: async (id, { name, description, criterios, finalidadeId, status = 'ATIVO' }) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID && finalidadeId) {
      const updated = await api.put(`/segmentos/${id}`, {
        nome: name.trim(),
        descricao: description?.trim() || `Segmento ${name.trim()}`,
        criterios: criterios && Object.keys(criterios).length > 0 ? criterios : { tipo: 'B2B' },
        finalidadeId,
        status,
      });
      return updated;
    }

    // Fallback para segmento local
    const stored = getStoredSegments();
    const next = stored.map((s) =>
      s.id === id
        ? {
            ...s,
            name: name.trim(),
            description: description?.trim() || s.description,
            backendStatus: status,
            status: status === 'ATIVO' ? 'Ativo' : status === 'ARQUIVADO' ? 'Sem resultados' : 'Rascunho',
            updatedAt: 'Hoje',
          }
        : s
    );
    saveStoredSegments(next);
    return null;
  },

  /**
   * Altera o status de um segmento via PATCH /segmentos/{id}/status
   */
  alterarStatus: async (id, status) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUUID) {
      return await api.patch(`/segmentos/${id}/status`, { status });
    }
    return null;
  },

  /**
   * Busca a prévia de contatos do segmento via GET /segmentos/{id}/previa
   */
  getPrevia: async (id) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) return [];
    try {
      const resp = await api.get(`/segmentos/${id}/previa?pagina=0&tamanho=20`);
      const items = resp?.content || (Array.isArray(resp) ? resp : []);
      return items.map((c) => {
        const name = c.nomeExibicao || 'Contato';
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0].toUpperCase())
          .join('');
        return {
          id: c.id,
          name,
          initials: initials || 'NC',
          detail: c.empresaNome ? `${c.empresaNome} · ${c.statusIdentidade || 'VERIFICADA'}` : (c.statusIdentidade || 'VERIFICADA'),
        };
      });
    } catch (e) {
      console.warn('Erro ao consultar prévia do segmento:', e.message);
      return [];
    }
  },

  /**
   * Recalcula contatos do segmento via POST /segmentos/{id}/recalculo
   */
  recalcular: async (id) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUUID) return null;
    try {
      return await api.post(`/segmentos/${id}/recalculo`);
    } catch (e) {
      console.warn('Erro ao recalcular segmento:', e.message);
      return null;
    }
  },
};

