
import { INITIAL_CONTACTS } from '../constants/contactsData';

const STORAGE_KEY = 'neocore_contacts';

function loadContacts() {
  try {
    const savedContacts = localStorage.getItem(STORAGE_KEY);

    if (savedContacts !== null) {
      const parsedContacts = JSON.parse(savedContacts);

      if (Array.isArray(parsedContacts)) {
        return parsedContacts;
      }
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(INITIAL_CONTACTS)
    );

    return [...INITIAL_CONTACTS];
  } catch (error) {
    console.error('Erro ao carregar contatos:', error);
    return [...INITIAL_CONTACTS];
  }
}

let contactsState = loadContacts();

function saveContacts() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(contactsState)
    );
  } catch (error) {
    console.error('Erro ao salvar contatos:', error);
  }
}

function getCurrentDate() {
  return new Date().toLocaleDateString('pt-BR');
}

function getCurrentDateTime() {
  return (
    getCurrentDate() +
    ' ' +
    new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  );
}

export const contactService = {
  getContacts: async () => {
    return contactsState.map(contact => ({ ...contact }));
  },

  getContactById: async (id) => {
    const contact = contactsState.find(c => c.id === id);

    return contact ? { ...contact } : null;
  },

  addContact: async (newContact) => {
    const id = `NC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const initials = newContact.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');

    const phone = newContact.phone || '+55 (11) 90000-0000';
    const location = newContact.location || 'Brasil';
    const segment = newContact.segment || 'Cliente - B2B';
    const status = newContact.status || 'Unificado';

    const formattedContact = {
      id,
      name: newContact.name,
      company: newContact.company,
      email: newContact.email,
      phone,
      location,
      segment,
      initials: initials || 'NC',

      sourcesCount: 1,
      sourcesLabel: 'fonte',

      status,
      statusType: status === 'Em revisão' ? 'review' : 'unified',

      isSelected: false,
      linkedSourcesCount: 1,

      consolidatedData: [
        { label: 'Empresa', value: newContact.company, source: 'Entrada Manual' },
        { label: 'E-mail principal', value: newContact.email, source: 'Entrada Manual' },
        { label: 'Telefone', value: phone, source: 'Entrada Manual' },
        { label: 'Localização', value: location, source: 'Entrada Manual' },
        { label: 'Segmento', value: segment, source: 'Entrada Manual' }
      ],

      originSources: [
        {
          name: 'Cadastro Manual',
          code: id,
          status: 'Sincronizado',
          syncDate: new Date().toLocaleDateString('pt-BR') +
            ' · ' +
            new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
          type: 'crm'
        }
      ],

      reconciliation: {
        title: 'Dados cadastrados com sucesso',
        subtitle: `Perfil criado em ${getCurrentDate()}.`
      },

      history: [
        {
          date: getCurrentDateTime(),
          action: 'Contato criado manualmente no sistema'
        }
      ],

      notes: []
    };

    contactsState = [formattedContact, ...contactsState];

    saveContacts();

    return { ...formattedContact };
  },

  updateContact: async (id, updatedFields) => {
    contactsState = contactsState.map(contact => {
      if (contact.id !== id) {
        return contact;
      }

      const updated = {
        ...contact,
        ...updatedFields
      };

      const fieldsToUpdate = {
        'Empresa': updatedFields.company,
        'E-mail principal': updatedFields.email,
        'Telefone': updatedFields.phone,
        'Localização': updatedFields.location,
        'Segmento': updatedFields.segment
      };

      updated.consolidatedData = (
        contact.consolidatedData || []
      ).map(field => {
        const newValue = fieldsToUpdate[field.label];

        if (newValue !== undefined && newValue !== '') {
          return { ...field, value: newValue };
        }

        return field;
      });

      return updated;
    });

    saveContacts();

    const updated = contactsState.find(c => c.id === id);

    return updated ? { ...updated } : null;
  },

  exportToCSV: (contacts) => {
    const headers = [
      'ID',
      'Nome',
      'Empresa',
      'E-mail',
      'Telefone',
      'Localizacao',
      'Segmento',
      'Fontes',
      'Status'
    ];

    const escapeCSV = (value) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = contacts.map(c => [
      c.id,
      c.name,
      c.company,
      c.email,
      c.phone,
      c.location,
      c.segment,
      c.sourcesCount,
      c.status
    ].map(escapeCSV));

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `contatos_neocore_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
};
