import { INITIAL_CONTACTS } from '../constants/contactsData';

let contactsState = [...INITIAL_CONTACTS];

export const contactService = {
  getContacts: async () => {
    return Promise.resolve([...contactsState]);
  },

  getContactById: async (id) => {
    const contact = contactsState.find((c) => c.id === id);
    return Promise.resolve(contact ? { ...contact } : null);
  },

  addContact: async (newContact) => {
    const id = `NC-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const initials = newContact.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');

    const formattedContact = {
      id,
      name: newContact.name,
      company: newContact.company,
      email: newContact.email,
      phone: newContact.phone || '+55 (11) 90000-0000',
      location: newContact.location || 'Brasil',
      segment: newContact.segment || 'Cliente - B2B',
      initials: initials || 'NC',
      sourcesCount: 1,
      sourcesLabel: 'fonte',
      status: newContact.status || 'Unificado',
      statusType: newContact.status === 'Em revisão' ? 'review' : 'unified',
      isSelected: false,
      linkedSourcesCount: 1,
      consolidatedData: [
        { label: 'Empresa', value: newContact.company, source: 'Entrada Manual' },
        { label: 'E-mail principal', value: newContact.email, source: 'Entrada Manual' },
        { label: 'Telefone', value: newContact.phone || '+55 (11) 90000-0000', source: 'Entrada Manual' },
        { label: 'Localização', value: newContact.location || 'Brasil', source: 'Entrada Manual' },
        { label: 'Segmento', value: newContact.segment || 'Cliente - B2B', source: 'Entrada Manual' }
      ],
      originSources: [
        {
          name: 'Cadastro Manual',
          code: id,
          status: 'Sincronizado',
          syncDate: new Date().toLocaleDateString('pt-BR') + ' · ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'crm'
        }
      ],
      reconciliation: {
        title: 'Dados cadastrados com sucesso',
        subtitle: `Perfil criado em ${new Date().toLocaleDateString('pt-BR')}.`
      },
      history: [
        {
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          action: 'Contato criado manualmente no sistema'
        }
      ],
      notes: []
    };

    contactsState = [formattedContact, ...contactsState];
    return Promise.resolve(formattedContact);
  },

  updateContact: async (id, updatedFields) => {
    contactsState = contactsState.map((contact) => {
      if (contact.id === id) {
        const updated = {
          ...contact,
          ...updatedFields,
          consolidatedData: contact.consolidatedData.map((field) => {
            if (field.label === 'Empresa' && updatedFields.company) return { ...field, value: updatedFields.company };
            if (field.label === 'E-mail principal' && updatedFields.email) return { ...field, value: updatedFields.email };
            if (field.label === 'Telefone' && updatedFields.phone) return { ...field, value: updatedFields.phone };
            if (field.label === 'Localização' && updatedFields.location) return { ...field, value: updatedFields.location };
            if (field.label === 'Segmento' && updatedFields.segment) return { ...field, value: updatedFields.segment };
            return field;
          })
        };
        return updated;
      }
      return contact;
    });

    const updated = contactsState.find((c) => c.id === id);
    return Promise.resolve(updated);
  },

  exportToCSV: (contacts) => {
    const headers = ['ID', 'Nome', 'Empresa', 'E-mail', 'Telefone', 'Localizacao', 'Segmento', 'Fontes', 'Status'];
    const rows = contacts.map((c) => [
      c.id,
      `"${c.name}"`,
      `"${c.company}"`,
      c.email,
      `"${c.phone || ''}"`,
      `"${c.location || ''}"`,
      `"${c.segment || ''}"`,
      c.sourcesCount,
      c.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contatos_neocore_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
