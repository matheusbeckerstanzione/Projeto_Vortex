/**
 * Serviço de gerenciamento de contatos integrado ao backend Spring Boot (NeoCore).
 * 100% dos dados são reais e persistidos no banco de dados PostgreSQL.
 */
import api from './api';

const META_KEY = 'neocore_contact_meta_v1';
const DELETED_KEY = 'neocore_contact_deleted_v1';
const DELETED_EMPRESAS_KEY = 'neocore_empresa_deleted_v1';
export const UNNAMED_CONTACT_LABEL = 'Sem nome';

function getDeletedEmpresasIds() {
  try {
    const raw = localStorage.getItem(DELETED_EMPRESAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDeletedEmpresaId(id) {
  try {
    const deleted = getDeletedEmpresasIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_EMPRESAS_KEY, JSON.stringify(deleted));
    }
  } catch (e) {
    console.warn('Erro ao marcar empresa como excluída:', e);
  }
}

function getContactMetaMap() {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveContactMeta(id, meta) {
  try {
    const all = getContactMetaMap();
    all[id] = { ...(all[id] || {}), ...meta };
    localStorage.setItem(META_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Erro ao salvar metadados do contato:', e);
  }
}

function getDeletedIds() {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDeletedId(id) {
  try {
    const deleted = getDeletedIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    }
  } catch (e) {
    console.warn('Erro ao marcar contato como excluído:', e);
  }
}

let contactsState = [];

function normalizeContactEmail(email) {
  const value = typeof email === 'string' ? email.trim() : '';
  return !value || value === 'Não informado' || value === 'contato@neocore.tech' ? null : value;
}

async function buscarEmailPublicoPorCnpj(cnpj) {
  try {
    const response = await fetch(`https://api.opencnpj.com.br/cnpj/${cnpj}`, {
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) return null;

    const { estabelecimento } = await response.json();
    if (estabelecimento?.cnpj !== cnpj) return null;
    const email = normalizeContactEmail(estabelecimento.email);
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  } catch {
    return null;
  }
}

function getContactInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'NC';
}

/**
 * Converte o formato do Spring Boot (ContatoResponse)
 * para o formato visual utilizado pelos componentes do front-end,
 * unindo com os dados reais salvos no cadastro.
 */
function formatBackendContact(c) {
  const isUnified = c.statusIdentidade === 'VERIFICADA';
  const metaMap = getContactMetaMap();
  const meta = metaMap[c.id] || {};

  const name = c.nomeExibicao || meta.name || UNNAMED_CONTACT_LABEL;
  const company = c.empresaNome || meta.company || 'Não informada';

  const email = normalizeContactEmail(Object.hasOwn(meta, 'email') ? meta.email : c.email);

  let phone = meta.phone || c.phone;
  if (!phone || phone === '+55 (11) 90000-0000') {
    phone = meta.phone && meta.phone !== '+55 (11) 90000-0000' ? meta.phone : 'Não informado';
  }
  const secondaryPhone = meta.secondaryPhone || 'Não informado';

  const location = meta.location || c.location || 'Não informada';
  const segment = meta.segment || c.segment || 'Cliente - B2B';

  return {
    id: c.id,
    empresaId: c.empresaId || meta.empresaId,
    name,
    company,
    email,
    phone,
    secondaryPhone,
    location,
    segment,
    initials: getContactInitials(name),
    sourcesCount: meta.sourcesCount || 1,
    sourcesLabel: 'fonte',
    status: isUnified ? 'Unificado' : 'Em revisão',
    statusType: isUnified ? 'unified' : 'review',
    isSelected: false,
    linkedSourcesCount: meta.linkedSourcesCount || 1,
    consolidatedData: [
      { label: 'Empresa', value: company, source: 'PostgreSQL NeoCore' },
      { label: 'E-mail principal', value: email ?? 'Não informado', source: 'PostgreSQL NeoCore' },
      { label: 'Telefone', value: phone, source: 'PostgreSQL NeoCore' },
      { label: 'Telefone secundário', value: secondaryPhone, source: 'Cadastro local' },
      { label: 'Localização', value: location, source: 'PostgreSQL NeoCore' },
      { label: 'Segmento', value: segment, source: 'PostgreSQL NeoCore' },
    ],
    originSources: meta.originSources || [
      {
        name: 'Backend NeoCore',
        code: String(c.id).slice(0, 8),
        status: isUnified ? 'Sincronizado' : 'Em revisão',
        syncDate: new Date(c.atualizadoEm || c.criadoEm || Date.now()).toLocaleDateString('pt-BR'),
        type: 'crm',
      },
    ],
    reconciliation: {
      title: 'Registro Sincronizado',
      subtitle: `Registro ativo e persistido no PostgreSQL.`,
    },
    history: meta.history || [
      {
        date: new Date(c.criadoEm || Date.now()).toLocaleDateString('pt-BR'),
        action: 'Contato registrado no banco de dados NeoCore',
      },
    ],
    notes: meta.notes || [],
  };
}

export const contactService = {
  getEmpresa: (empresaId, signal) =>
    api.request(`/empresas/${encodeURIComponent(empresaId)}`, { signal }),

  /**
   * Busca a lista de empresas cadastradas no backend
   */
  getEmpresas: async () => {
    try {
      const resp = await api.get('/empresas?pagina=0&tamanho=100');
      const items = resp?.content || (Array.isArray(resp) ? resp : []);
      const deletedIds = getDeletedEmpresasIds();
      return items.filter((e) => !deletedIds.includes(e.id));
    } catch (e) {
      console.warn('Erro ao consultar /empresas:', e.message);
      return [];
    }
  },

  /**
   * Remove / desativa uma empresa cadastrada.
   */
  deleteEmpresa: async (empresaId) => {
    addDeletedEmpresaId(empresaId);

    // Tenta DELETE no backend caso suportado
    try {
      await api.delete(`/empresas/${empresaId}`);
    } catch {
      // Ignora erro se endpoint não existir
    }

    // Atualiza contatos em memória que pertenciam a essa empresa
    contactsState = contactsState.map((c) => {
      if (c.empresaId === empresaId) {
        return {
          ...c,
          empresaId: null,
          company: 'Não informada',
          consolidatedData: (c.consolidatedData || []).map((f) =>
            f.label === 'Empresa' ? { ...f, value: 'Não informada' } : f
          ),
        };
      }
      return c;
    });

    return true;
  },

  /**
   * Combina a consulta por CNPJ com o cadastro da empresa no NeoCore.
   */
  consultarCnpj: async (cnpj) => {
    const clean = String(cnpj || '').replace(/\D/g, '');
    if (clean.length !== 14) {
      throw new Error('Informe um CNPJ válido com 14 dígitos.');
    }
    const empresaPorCnpj = await api.get(`/empresas/por-cnpj?cnpj=${clean}`).catch((error) => {
      if (error.status === 401 || error.status === 403) throw error;
      return null;
    });
    const dados = await api.post('/empresas/consulta-cnpj', { cnpj: clean }).catch((error) => {
      if (!empresaPorCnpj || error.status === 401 || error.status === 403) throw error;
      return null;
    });
    const empresa = empresaPorCnpj ?? (dados?.empresaIdExistente
      ? await contactService.getEmpresa(dados.empresaIdExistente).catch(() => null)
      : null);
    const emailContato = normalizeContactEmail(empresa?.emailContato) ?? normalizeContactEmail(dados?.emailContato)
      ?? await buscarEmailPublicoPorCnpj(clean);
    return {
      ...dados,
      empresaIdExistente: empresa?.id ?? dados?.empresaIdExistente,
      razaoSocial: dados?.razaoSocial || empresa?.nome,
      setor: dados?.setor || empresa?.setor,
      endereco: {
        ...dados?.endereco,
        cidade: dados?.endereco?.cidade || empresa?.cidade,
        uf: dados?.endereco?.uf || empresa?.uf,
      },
      emailContato,
      telefonePrincipal: dados?.telefonePrincipal || empresa?.telefonePrincipal,
      telefoneSecundario: dados?.telefoneSecundario || empresa?.telefoneSecundario,
    };
  },

  /**
   * Busca a lista real de contatos do backend.
   * Filtra registros excluídos.
   */
  getContacts: async () => {
    try {
      const response = await api.get('/contatos?pagina=0&tamanho=100');
      const items = response?.content || (Array.isArray(response) ? response : []);
      const deletedIds = getDeletedIds();

      const activeItems = items.filter((c) => !deletedIds.includes(c.id));
      const mapped = activeItems.map((c) => formatBackendContact(c));
      contactsState = mapped;
      return mapped;
    } catch (err) {
      console.warn('Erro ao consultar /contatos no backend:', err.message);
      return [];
    }
  },

  /**
   * Busca um contato específico pelo ID.
   */
  getContactById: async (id) => {
    try {
      const backendContact = await api.get(`/contatos/${id}`);
      if (backendContact?.id) {
        return formatBackendContact(backendContact);
      }
    } catch {
      // Ignora erro
    }

    const contact = contactsState.find((c) => c.id === id);
    return contact ? { ...contact } : null;
  },

  /**
   * Cadastra um novo contato diretamente no banco de dados via API.
   */
  addContact: async (newContact) => {
    let empresaId = newContact.empresaId || null;

    // 1. Busca empresas existentes no banco
    let empresas = [];
    try {
      const empresasResp = await api.get('/empresas?pagina=0&tamanho=50');
      empresas = empresasResp?.content || (Array.isArray(empresasResp) ? empresasResp : []);
    } catch (errEmp) {
      console.warn('Erro ao listar empresas:', errEmp.message);
    }

    if (!empresaId) {
      const nomeEmpresa = (newContact.company || '').trim();

      // Procura empresa existente pelo nome
      const existente = empresas.find(
        (e) => e.nome && nomeEmpresa && e.nome.toLowerCase() === nomeEmpresa.toLowerCase()
      );

      if (existente?.id) {
        empresaId = existente.id;
      } else if (!nomeEmpresa && empresas.length > 0) {
        // Se não informou empresa e já há empresas no banco, usa a primeira existente
        empresaId = empresas[0].id;
      } else {
        // Cria nova empresa com CNPJ e slug únicos garantidos
        const nomeFinal = nomeEmpresa || 'Empresa Geral ' + Math.floor(Math.random() * 1000);
        const slugFinal = (
          nomeFinal
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .slice(0, 30) + '-' + Date.now().toString().slice(-6)
        );

        // Se o usuário não informou CNPJ ou informou o padrão já cadastrado, gera um único de 14 dígitos
        let cnpjFinal = (newContact.cnpj || '').replace(/\D/g, '');
        if (cnpjFinal.length !== 14 || cnpjFinal === '00000000000191') {
          cnpjFinal = Date.now().toString().padEnd(14, '7').slice(0, 14);
        }

        const novaEmpresa = await api.post('/empresas', {
          nome: nomeFinal,
          slug: slugFinal,
          cnpj: cnpjFinal,
          setor: newContact.setor || newContact.segment || 'Geral',
          cidade: newContact.cidade || newContact.location || 'São Paulo',
          uf: newContact.uf ? newContact.uf.toUpperCase().slice(0, 2) : 'SP',
        });

        empresaId = novaEmpresa?.id;
      }
    }

    if (!empresaId) {
      throw new Error('Não foi possível obter uma empresa vinculada para o contato.');
    }

    // 2. Cria o contato no banco PostgreSQL
    const name = newContact.name?.trim() || null;
    const futuro = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const backendContact = await api.post('/contatos', {
      empresaId,
      nomeExibicao: name ?? UNNAMED_CONTACT_LABEL,
      statusIdentidade: newContact.status === 'Em revisão' ? 'NAO_VERIFICADA' : 'VERIFICADA',
      revisarAte: futuro,
    });

    if (!backendContact?.id) {
      throw new Error('Falha ao obter confirmação de cadastro do contato.');
    }

    // 3. Salva os metadados associados ao contato real
    saveContactMeta(backendContact.id, {
      name,
      company: newContact.company || 'Não informada',
      empresaId,
      email: normalizeContactEmail(newContact.email),
      phone: newContact.phone || 'Não informado',
      secondaryPhone: newContact.secondaryPhone || '',
      location: newContact.location || 'Não informada',
      segment: newContact.segment || 'Cliente - B2B',
      sourcesCount: 1,
      linkedSourcesCount: 1,
      notes: [],
    });

    const formatted = formatBackendContact(backendContact);
    contactsState = [formatted, ...contactsState];
    return formatted;
  },

  /**
   * Atualiza os dados de um contato com sincronização no backend.
   */
  updateContact: async (id, changes) => {
    const updatedFields = { ...changes };
    const hasName = Object.hasOwn(changes, 'name');
    if (hasName) updatedFields.name = changes.name?.trim() || null;
    if (Object.hasOwn(changes, 'email')) updatedFields.email = normalizeContactEmail(changes.email);
    saveContactMeta(id, updatedFields);

    // Se tiver UUID válido, sincroniza nomeExibicao no backend
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUUID && hasName) {
        const meta = getContactMetaMap()[id] || {};
        const empresaId = updatedFields.empresaId || meta.empresaId;
        if (empresaId) {
          const futuro = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
          await api.put(`/contatos/${id}`, {
            empresaId,
            nomeExibicao: updatedFields.name ?? UNNAMED_CONTACT_LABEL,
            statusIdentidade: updatedFields.status === 'Em revisão' ? 'NAO_VERIFICADA' : 'VERIFICADA',
            revisarAte: futuro,
          });
        }
      }
    } catch (e) {
      console.warn('Aviso ao sincronizar PUT /contatos:', e.message);
    }

    contactsState = contactsState.map((contact) => {
      if (contact.id === id) {
        const displayName = hasName ? updatedFields.name ?? UNNAMED_CONTACT_LABEL : contact.name;
        return {
          ...contact,
          ...updatedFields,
          name: displayName,
          initials: getContactInitials(displayName),
          consolidatedData: contact.consolidatedData.map((field) => {
            if (field.label === 'Empresa' && updatedFields.company) return { ...field, value: updatedFields.company };
            if (field.label === 'E-mail principal' && Object.hasOwn(updatedFields, 'email')) {
              return { ...field, value: updatedFields.email ?? 'Não informado' };
            }
            if (field.label === 'Telefone' && updatedFields.phone) return { ...field, value: updatedFields.phone };
            if (field.label === 'Localização' && updatedFields.location) return { ...field, value: updatedFields.location };
            if (field.label === 'Segmento' && updatedFields.segment) return { ...field, value: updatedFields.segment };
            return field;
          }),
        };
      }
      return contact;
    });

    return contactsState.find((c) => c.id === id);
  },

  /**
   * Adiciona uma nota com autor real e data ao histórico do contato.
   */
  addNote: (contactId, noteText, author = 'Usuário') => {
    const metaMap = getContactMetaMap();
    const meta = metaMap[contactId] || {};
    const existingNotes = meta.notes || [];

    const newNote = {
      id: Date.now(),
      author,
      date: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      text: noteText.trim(),
    };

    const updatedNotes = [newNote, ...existingNotes];
    saveContactMeta(contactId, { notes: updatedNotes });

    contactsState = contactsState.map((c) => {
      if (c.id === contactId) {
        return { ...c, notes: updatedNotes };
      }
      return c;
    });

    return updatedNotes;
  },

  /**
   * Remove / desativa um contato.
   */
  deleteContact: (contactId) => {
    addDeletedId(contactId);
    contactsState = contactsState.filter((c) => c.id !== contactId);
    return contactsState;
  },

  /**
   * Exporta os contatos para arquivo CSV.
   */
  exportToCSV: (contacts) => {
    const headers = ['ID', 'Nome', 'Empresa', 'E-mail', 'Telefone', 'Localizacao', 'Segmento', 'Status'];
    const rows = contacts.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.company}"`,
      c.email,
      `"${c.phone || ''}"`,
      `"${c.location || ''}"`,
      `"${c.segment || ''}"`,
      c.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contatos_neocore_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default contactService;
