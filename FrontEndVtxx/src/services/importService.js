/**
 * Serviço de Importação em Lote integrado ao backend NeoCore (Spring Boot / PostgreSQL).
 * Chama o endpoint POST /importacoes/cnpj e cadastra os contatos correspondentes.
 */
import api from './api';
import { contactService } from './contactService';

function limparCnpj(val) {
  if (!val) return '00000000000191';
  const digits = String(val).replace(/\D/g, '');
  if (digits.length === 14) return digits;
  return digits.padEnd(14, '0').slice(0, 14);
}

function gerarSlug(nome) {
  return String(nome || 'empresa')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 50);
}

export const importService = {
  /**
   * Envia uma lista de empresas para importação em lote no PostgreSQL via API.
   * @param {Array} rawList Lista de objetos com nome, cnpj, setor, cidade, uf, email, telefone
   */
  importBatch: async (rawList) => {
    if (!Array.isArray(rawList) || rawList.length === 0) {
      throw new Error('Nenhum registro para importar.');
    }

    const payloadEmpresas = rawList.slice(0, 100).map((item, idx) => {
      const nome = (item.nome || item.company || `Empresa Importada ${idx + 1}`).trim();
      const cnpj = limparCnpj(item.cnpj);
      const uf = (item.uf || item.state || 'SP').trim().slice(0, 2).toUpperCase();

      return {
        nome,
        slug: gerarSlug(nome) + '-' + Date.now() + '-' + idx,
        cnpj,
        setor: (item.setor || item.segment || 'Tecnologia').trim().slice(0, 80),
        cidade: (item.cidade || item.city || 'São Paulo').trim().slice(0, 100),
        uf: uf.length === 2 ? uf : 'SP',
        descricao: item.descricao || 'Importado via painel NeoCore',
        urlSite: item.urlSite || item.site || null,
      };
    });

    // 1. Chama POST /importacoes/cnpj
    const importedEmpresas = await api.post('/importacoes/cnpj', {
      empresas: payloadEmpresas,
    });

    const empresasResult = Array.isArray(importedEmpresas) ? importedEmpresas : [];

    // 2. Cria contatos correspondentes no banco para que apareçam imediatamente na listagem
    const contatosCriados = [];
    for (let i = 0; i < empresasResult.length; i++) {
      const emp = empresasResult[i];
      const rawOriginal = rawList[i] || {};
      const nomeContato = rawOriginal.nomeContato || rawOriginal.name || `Representante ${emp.nome}`;

      try {
        const novoContato = await contactService.addContact({
          name: nomeContato,
          company: emp.nome,
          email: rawOriginal.email || `contato@${gerarSlug(emp.nome)}.com.br`,
          phone: rawOriginal.phone || rawOriginal.telefone || 'Não informado',
          location: `${emp.cidade}, ${emp.uf}`,
          segment: emp.setor || 'Cliente - B2B',
          status: 'Unificado',
        });
        contatosCriados.push(novoContato);
      } catch (err) {
        console.warn(`Erro ao criar contato para empresa ${emp.nome}:`, err.message);
      }
    }

    return {
      totalEmpresas: empresasResult.length,
      totalContatos: contatosCriados.length,
      empresas: empresasResult,
      contatos: contatosCriados,
    };
  },

  /**
   * Processa texto CSV e extrai registros estruturados
   */
  parseCSV: (text) => {
    if (!text || typeof text !== 'string') return [];
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(/[;,]/).map(h => h.trim().toLowerCase());
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/[;,]/).map(p => p.trim());
      if (parts.length === 0 || !parts[0]) continue;

      const record = {};
      headers.forEach((header, colIdx) => {
        const val = parts[colIdx] || '';
        if (header.includes('nome') || header.includes('name')) record.name = val;
        else if (header.includes('empresa') || header.includes('company')) record.company = val;
        else if (header.includes('cnpj')) record.cnpj = val;
        else if (header.includes('mail')) record.email = val;
        else if (header.includes('tel') || header.includes('fone')) record.phone = val;
        else if (header.includes('cidade') || header.includes('city')) record.city = val;
        else if (header.includes('uf') || header.includes('estado')) record.uf = val;
        else if (header.includes('setor') || header.includes('segment')) record.setor = val;
      });

      if (!record.company && record.name) {
        record.company = record.name + ' Ltda';
      }
      if (record.name || record.company) {
        results.push(record);
      }
    }

    return results;
  }
};

