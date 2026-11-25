import { contactService } from './contactService';

/**
 * Serviço de importação e processamento de dados (CSV / API).
 */

// Gera e baixa o modelo CSV recomendado
export function baixarModeloCsv() {
  const headers = ['razao_social', 'cnpj', 'email', 'setor', 'cidade', 'uf', 'telefone'];
  const rows = [
    ['"Horizonte Tecnologia Ltda"', '"11222333000181"', 'contato@horizonte.tech', 'Tecnologia / SaaS', 'São Paulo', 'SP', '+55 (11) 98765-4321'],
    ['"Brasil Comércio de Calçados"', '"12345678000190"', 'contato@brasilcalcados.com.br', 'Varejo', 'Campinas', 'SP', '+55 (19) 99876-5432'],
    ['"Ateliê Moda & Arte"', '"22333444000102"', 'atendimento@ateliemoda.com', 'Moda & Design', 'Rio de Janeiro', 'RJ', '+55 (21) 97654-3210'],
    ['"Logística Express Brasil"', '"33444555000113"', 'operacoes@logexpress.com.br', 'Logística', 'Curitiba', 'PR', '+55 (41) 98123-4567'],
    ['"Inovação Farmacêutica"', '"44555666000124"', 'sac@inovacaofarma.com.br', 'Saúde', 'Belo Horizonte', 'MG', '+55 (31) 98765-1234']
  ];

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'modelo_importacao_neocore.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Analisador de CSV compatível com delimitadores vírgula e ponto-e-vírgula
export function parseCsvText(text) {
  if (!text || typeof text !== 'string') return { headers: [], rows: [] };

  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  // Detecta se o delimitador é ponto e vírgula ou vírgula
  const firstLine = lines[0];
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  const parseLine = (line) => {
    const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter}]*))`, 'g');
    const values = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      values.push((val || '').trim());
      if (regex.lastIndex >= line.length) break;
    }
    return values;
  };

  const headers = parseLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = parseLine(lines[i]);
    if (rawValues.every(v => v === '')) continue; // ignora linha vazia

    const rowObj = {};
    headers.forEach((header, idx) => {
      rowObj[header] = rawValues[idx] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// Limpa e normaliza CNPJ para exatamente 14 dígitos numéricos
export function normalizarCnpj(valor) {
  if (!valor) return '';
  const digits = valor.replace(/\D/g, '');
  if (digits.length === 14) return digits;
  if (digits.length < 14) return digits.padStart(14, '0');
  return digits.slice(0, 14);
}

// Validação e categorização dos registros antes do envio
export function validarRegistros(rows, mapping, switches = {}) {
  const seenCnpjs = new Set();
  const seenEmails = new Set();
  const validos = [];
  const comAlertas = [];
  let duplicadosCount = 0;

  rows.forEach((row, index) => {
    // Extrai valores com base no mapeamento
    const razaoSocial = row[mapping.razao_social] || row['razao_social'] || row['nome'] || row['Nome'] || row['Razão social'] || `Empresa ${index + 1}`;
    const rawCnpj = row[mapping.cnpj_cpf] || row['cnpj'] || row['CNPJ'] || row['cnpj_cpf'] || '';
    const email = row[mapping.email_contato] || row['email'] || row['E-mail'] || row['email_contato'] || '';
    const setor = row[mapping.setor] || row['setor'] || row['Setor'] || row['segmento'] || 'Cliente - B2B';
    const cidade = row[mapping.cidade] || row['cidade'] || row['Cidade'] || 'São Paulo';
    const uf = (row[mapping.uf] || row['uf'] || row['UF'] || 'SP').trim().slice(0, 2).toUpperCase();
    const telefone = row[mapping.telefone] || row['telefone'] || row['Telefone'] || '+55 (11) 90000-0000';

    const cnpj = switches.normalizar !== false ? normalizarCnpj(rawCnpj) : rawCnpj.replace(/\D/g, '');

    const alertas = [];

    // Verificação de duplicados
    if (switches.duplicados !== false) {
      if (cnpj && seenCnpjs.has(cnpj)) {
        alertas.push('CNPJ duplicado neste arquivo');
        duplicadosCount++;
      } else if (cnpj) {
        seenCnpjs.add(cnpj);
      }

      if (email && seenEmails.has(email)) {
        alertas.push('E-mail duplicado neste arquivo');
      } else if (email) {
        seenEmails.add(email);
      }
    }

    if (!cnpj || cnpj.length !== 14) {
      alertas.push('CNPJ incompleto ou inválido');
    }

    if (!email || !email.includes('@')) {
      alertas.push('E-mail inválido ou ausente');
    }

    const itemNormalizado = {
      id: index + 1,
      nome: razaoSocial,
      slug: razaoSocial.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      cnpj: cnpj || '00000000000100',
      setor: setor || 'Cliente - B2B',
      cidade: cidade || 'São Paulo',
      uf: uf.length === 2 ? uf : 'SP',
      email,
      telefone,
      alertas,
      status: alertas.length === 0 ? 'válido' : 'alerta',
      raw: row
    };

    if (alertas.length === 0) {
      validos.push(itemNormalizado);
    } else {
      comAlertas.push(itemNormalizado);
    }
  });

  const total = rows.length;
  const taxaAprovacao = total > 0 ? Math.round((validos.length / total) * 100) : 100;

  return {
    total,
    validos,
    comAlertas,
    duplicadosCount,
    taxaAprovacao
  };
}


/**
 * Importa empresas para o armazenamento local do NeoCore.
 * Os contatos ficam salvos no localStorage.
 */
export async function enviarImportacaoApi(empresasParaImportar) {
  const resultados = [];

  try {
    for (const emp of empresasParaImportar) {
      const contato = await contactService.addContact({
        name: emp.nome,
        company: emp.nome,
        email: emp.email || '',
        phone: emp.telefone || '',
        location: `${emp.cidade || ''}, ${emp.uf || ''} - Brasil`,
        segment: emp.setor || 'Cliente - B2B',
        status: emp.alertas?.length > 0 ? 'Em revisão' : 'Unificado'
      });

      resultados.push(contato);
    }

    return {
      sucesso: true,
      conectouBackend: false,
      totalImportado: resultados.length,
      resultadosBackend: resultados
    };
  } catch (erro) {
    console.error('Erro ao importar empresas:', erro);

    return {
      sucesso: false,
      conectouBackend: false,
      totalImportado: resultados.length,
      resultadosBackend: resultados
    };
  }
}
  