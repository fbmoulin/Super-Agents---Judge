#!/usr/bin/env node
/**
 * PDF Extractor para Processos Judiciais
 * Lex Intelligentia Judiciário v2.3
 *
 * Extrai dados de PDFs de processos reais e gera JSONs para teste
 *
 * Uso:
 *   node scripts/pdf_extractor.js [categoria]
 *   node scripts/pdf_extractor.js --all
 *
 * Exemplos:
 *   node scripts/pdf_extractor.js bancario
 *   node scripts/pdf_extractor.js --all
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
// Diretório base para processos reais
const PROCESSOS_DIR = path.join(repoRoot, 'test_cases', 'processos_reais');

// Categorias de agentes
const CATEGORIAS = [
  'bancario',
  'consumidor',
  'execucao',
  'locacao',
  'possessorias',
  'saude_cobertura',
  'saude_contratual',
  'transito',
  'usucapiao',
  'incorporacao',
  'generico'
];

// Mapeamento de categoria para assuntos comuns
const ASSUNTOS_POR_CATEGORIA = {
  bancario: 'Contratos Bancários / Empréstimo Consignado',
  consumidor: 'Direito do Consumidor / Responsabilidade do Fornecedor',
  execucao: 'Execução de Título Extrajudicial',
  locacao: 'Locação de Imóvel / Lei 8.245/91',
  possessorias: 'Ações Possessórias / Reintegração de Posse',
  saude_cobertura: 'Plano de Saúde / Cobertura de Procedimento',
  saude_contratual: 'Plano de Saúde / Questões Contratuais',
  transito: 'Acidente de Trânsito / Responsabilidade Civil',
  usucapiao: 'Usucapião / Aquisição de Propriedade',
  incorporacao: 'Incorporação Imobiliária / Lei 4.591/64',
  generico: 'Procedimento Comum Cível'
};

/**
 * Extrai texto de um PDF usando pdftotext
 */
function extractTextFromPDF(pdfPath) {
  try {
    // Usa pdftotext com layout preservado
    const result = execSync(`pdftotext -layout "${pdfPath}" -`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });
    return result;
  } catch (error) {
    console.error(`Erro ao extrair texto de ${pdfPath}:`, error.message);
    return null;
  }
}

/**
 * Extrai número do processo do nome do arquivo ou conteúdo
 */
function extractProcessNumber(filename, content) {
  // Tenta extrair do nome do arquivo primeiro
  // Formato esperado: 0001234-56.2025.8.08.0001_descricao.pdf
  const filenameMatch = filename.match(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/);
  if (filenameMatch) {
    return filenameMatch[1];
  }

  // Tenta extrair do conteúdo
  const contentMatch = content.match(/Processo(?:\s+n[ºo°]?)?[:\s]+(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/i);
  if (contentMatch) {
    return contentMatch[1];
  }

  // Formato alternativo
  const altMatch = content.match(/(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/);
  if (altMatch) {
    return altMatch[1];
  }

  return 'NUMERO_NAO_IDENTIFICADO';
}

/**
 * Extrai a classe processual do conteúdo
 */
function extractClasse(content) {
  const patterns = [
    /Classe[:\s]+([^\n]+)/i,
    /Ação[:\s]+([^\n]+)/i,
    /Procedimento[:\s]+([^\n]+)/i,
    /Natureza[:\s]+([^\n]+)/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim().substring(0, 100);
    }
  }

  return 'Procedimento Comum Cível';
}

/**
 * Extrai o valor da causa do conteúdo
 */
function extractValorCausa(content) {
  const patterns = [
    /Valor da [Cc]ausa[:\s]+R\$\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+).*valor da causa/i,
    /causa.*R\$\s*([\d.,]+)/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const value = match[1].replace(/\./g, '').replace(',', '.');
      return parseFloat(value) || 10000;
    }
  }

  return 10000; // Valor padrão
}

/**
 * Extrai seção de fatos/narração do conteúdo
 */
function extractFatos(content) {
  // Procura por seções típicas de fatos
  const patterns = [
    /(?:DOS FATOS|DA NARRATIVA|DO HISTÓRICO|I\s*[-–]\s*FATOS|FATOS)[:\s]*([\s\S]{100,3000}?)(?=(?:DO DIREITO|DA FUNDAMENTAÇÃO|DOS PEDIDOS|II\s*[-–]|REQUERIMENTOS|\n\n\n))/i,
    /(?:SÍNTESE DA INICIAL|RESUMO DOS FATOS)[:\s]*([\s\S]{100,3000}?)(?=(?:DO DIREITO|DA FUNDAMENTAÇÃO|DOS PEDIDOS))/i,
    /Trata-se de ([\s\S]{100,2000}?)(?=\n\n)/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }

  // Se não encontrar seção específica, pega o início do documento
  const inicio = content.substring(0, 3000);
  return cleanText(inicio);
}

/**
 * Extrai questões jurídicas do conteúdo
 */
function extractQuestoes(content) {
  const patterns = [
    /(?:QUESTÕES|DA FUNDAMENTAÇÃO|DO DIREITO|II\s*[-–])[:\s]*([\s\S]{100,2000}?)(?=(?:DOS PEDIDOS|REQUERIMENTOS|III\s*[-–]))/i,
    /(?:MÉRITO|DA CONTROVÉRSIA)[:\s]*([\s\S]{100,2000}?)(?=(?:DOS PEDIDOS|DISPOSITIVO))/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }

  return 'Análise das questões jurídicas do caso';
}

/**
 * Extrai pedidos do conteúdo
 */
function extractPedidos(content) {
  const patterns = [
    /(?:DOS PEDIDOS|REQUERIMENTOS|PEDIDOS|III\s*[-–])[:\s]*([\s\S]{100,2000}?)(?=(?:VALOR DA CAUSA|Termos em que|P\.\s*deferimento|Nestes termos))/i,
    /(?:requer|pede)[:\s]*([\s\S]{100,1500}?)(?=(?:Termos em que|P\.\s*deferimento))/i
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return cleanText(match[1]);
    }
  }

  return 'Procedência dos pedidos';
}

/**
 * Limpa e normaliza texto extraído
 */
function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\t+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .substring(0, 5000);
}

/**
 * Processa um único PDF
 */
function processPDF(pdfPath, categoria) {
  const filename = path.basename(pdfPath, '.pdf');
  console.log(`  Processando: ${filename}`);

  const content = extractTextFromPDF(pdfPath);
  if (!content) {
    console.log(`    ERRO: Não foi possível extrair texto`);
    return null;
  }

  const processNumber = extractProcessNumber(filename, content);
  const casoId = `real_${categoria}_${filename.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}`;

  const extracted = {
    caso_id: casoId,
    processo: processNumber,
    fatos: extractFatos(content),
    questoes: extractQuestoes(content),
    pedidos: extractPedidos(content),
    classe: extractClasse(content),
    assunto: ASSUNTOS_POR_CATEGORIA[categoria] || 'Procedimento Comum Cível',
    valor_causa: extractValorCausa(content),
    fonte_pdf: path.basename(pdfPath),
    extraido_em: new Date().toISOString(),
    categoria: categoria,
    _texto_original_chars: content.length
  };

  // Salva o JSON ao lado do PDF
  const jsonPath = pdfPath.replace('.pdf', '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(extracted, null, 2), 'utf-8');
  console.log(`    Salvo: ${path.basename(jsonPath)}`);

  return extracted;
}

/**
 * Processa todos os PDFs de uma categoria
 */
function processCategoria(categoria) {
  const categoriaDir = path.join(PROCESSOS_DIR, categoria);

  if (!fs.existsSync(categoriaDir)) {
    console.log(`  Pasta não existe: ${categoria}`);
    return [];
  }

  const files = fs.readdirSync(categoriaDir)
    .filter(f => f.toLowerCase().endsWith('.pdf'));

  if (files.length === 0) {
    console.log(`  Nenhum PDF encontrado em: ${categoria}`);
    return [];
  }

  console.log(`\n[${categoria.toUpperCase()}] Encontrados ${files.length} PDFs`);

  const results = [];
  for (const file of files) {
    const pdfPath = path.join(categoriaDir, file);
    const result = processPDF(pdfPath, categoria);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Gera relatório de extração
 */
function generateReport(results) {
  const reportPath = path.join(PROCESSOS_DIR, 'extraction_report.json');
  const report = {
    timestamp: new Date().toISOString(),
    total_pdfs: results.length,
    por_categoria: {},
    processos: results.map(r => ({
      caso_id: r.caso_id,
      processo: r.processo,
      categoria: r.categoria,
      fonte_pdf: r.fonte_pdf
    }))
  };

  // Conta por categoria
  for (const r of results) {
    report.por_categoria[r.categoria] = (report.por_categoria[r.categoria] || 0) + 1;
  }

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\nRelatório salvo em: ${reportPath}`);

  return report;
}

/**
 * Main
 */
function main() {
  const args = process.argv.slice(2);

  console.log('='.repeat(60));
  console.log('PDF EXTRACTOR - Lex Intelligentia Judiciário');
  console.log('='.repeat(60));

  let categoriasToProcess = [];

  if (args.includes('--all')) {
    categoriasToProcess = CATEGORIAS;
  } else if (args.length > 0) {
    const categoria = args[0].toLowerCase();
    if (CATEGORIAS.includes(categoria)) {
      categoriasToProcess = [categoria];
    } else {
      console.error(`Categoria inválida: ${categoria}`);
      console.log(`Categorias válidas: ${CATEGORIAS.join(', ')}`);
      process.exit(1);
    }
  } else {
    console.log('\nUso:');
    console.log('  node scripts/pdf_extractor.js [categoria]');
    console.log('  node scripts/pdf_extractor.js --all');
    console.log(`\nCategorias: ${CATEGORIAS.join(', ')}`);
    console.log('\nVerificando PDFs disponíveis...\n');

    // Lista PDFs disponíveis
    let totalPdfs = 0;
    for (const cat of CATEGORIAS) {
      const catDir = path.join(PROCESSOS_DIR, cat);
      if (fs.existsSync(catDir)) {
        const pdfs = fs.readdirSync(catDir).filter(f => f.toLowerCase().endsWith('.pdf'));
        if (pdfs.length > 0) {
          console.log(`  ${cat}: ${pdfs.length} PDF(s)`);
          totalPdfs += pdfs.length;
        }
      }
    }

    if (totalPdfs === 0) {
      console.log('  Nenhum PDF encontrado nas pastas.');
      console.log('\n  Faça upload dos PDFs para:');
      console.log(`  ${PROCESSOS_DIR}/[categoria]/`);
    } else {
      console.log(`\n  Total: ${totalPdfs} PDF(s)`);
      console.log('\n  Execute: node scripts/pdf_extractor.js --all');
    }

    return;
  }

  // Processa as categorias
  const allResults = [];
  for (const categoria of categoriasToProcess) {
    const results = processCategoria(categoria);
    allResults.push(...results);
  }

  // Gera relatório
  if (allResults.length > 0) {
    const report = generateReport(allResults);

    console.log('\n' + '='.repeat(60));
    console.log('RESUMO DA EXTRAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de PDFs processados: ${report.total_pdfs}`);
    console.log('Por categoria:');
    for (const [cat, count] of Object.entries(report.por_categoria)) {
      console.log(`  ${cat}: ${count}`);
    }
    console.log('\nPróximo passo:');
    console.log('  node scripts/agent_validator.js --real');
    console.log('='.repeat(60));
  } else {
    console.log('\nNenhum PDF foi processado.');
    console.log('Faça upload de PDFs para as pastas de categoria.');
  }
}

main();
