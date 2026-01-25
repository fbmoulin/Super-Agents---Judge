/**
 * LEX PROMPTER - API Anthropic Integration
 *
 * Módulo TypeScript para geração dinâmica de prompts jurídicos
 * usando a API Anthropic Claude.
 *
 * @version 1.0
 * @date 2026-01-19
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface FIRAC {
  fatos: string;
  questoes: string;
  regras_aplicaveis?: string;
  analise?: string;
  conclusao_preliminar?: string;
}

interface Classificacao {
  dominio_identificado: string | null;
  confianca: number;
  keywords_extraidas?: string[];
}

interface KnowledgeBase {
  sumulas: Record<string, Record<string, Sumula>>;
  temas: Record<string, Tema>;
  domains: Record<string, Domain>;
}

interface Sumula {
  texto: string;
  domains: string[];
  keywords: string[];
}

interface Tema {
  tribunal: string;
  tese: string;
  domains: string[];
  aplicacao: string;
  detalhamento?: Record<string, unknown>;
}

interface Domain {
  keywords: string[];
  template_base: string;
  agente_especializado: string;
  sumulas_principais: string[];
  temas_principais: string[];
  base_legal?: string[];
}

interface LexPrompterResult {
  prompt_gerado: string;
  validacao: {
    score: number;
    layers_present: Record<string, boolean>;
    aprovado: boolean;
  };
  metadata: {
    gerado_em: string;
    modelo: string;
    tokens_utilizados: number;
    tempo_ms: number;
  };
  sumulas_utilizadas: string[];
  temas_utilizados: string[];
}

// Knowledge Base loader
function loadKnowledgeBase(): KnowledgeBase {
  const basePath = path.join(__dirname, '../knowledge_base');

  const sumulas = JSON.parse(
    fs.readFileSync(path.join(basePath, 'sumulas.json'), 'utf-8')
  );

  const temas = JSON.parse(
    fs.readFileSync(path.join(basePath, 'temas_repetitivos.json'), 'utf-8')
  );

  const domains = JSON.parse(
    fs.readFileSync(path.join(basePath, 'domain_mapping.json'), 'utf-8')
  );

  return {
    sumulas: sumulas.sumulas,
    temas: temas.temas,
    domains: domains.domains
  };
}

// Find relevant súmulas based on keywords
function findRelevantSumulas(
  kb: KnowledgeBase,
  keywords: string[],
  limit: number = 5
): Array<{ numero: string; tribunal: string; texto: string }> {
  const results: Array<{ numero: string; tribunal: string; texto: string; score: number }> = [];

  for (const [tribunal, sumulas] of Object.entries(kb.sumulas)) {
    for (const [numero, sumula] of Object.entries(sumulas as Record<string, Sumula>)) {
      const matchScore = keywords.filter(k =>
        sumula.keywords.some(sk => sk.toLowerCase().includes(k.toLowerCase())) ||
        sumula.texto.toLowerCase().includes(k.toLowerCase())
      ).length;

      if (matchScore > 0) {
        results.push({
          numero,
          tribunal,
          texto: sumula.texto,
          score: matchScore
        });
      }
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ numero, tribunal, texto }) => ({ numero, tribunal, texto }));
}

// Find relevant temas based on keywords
function findRelevantTemas(
  kb: KnowledgeBase,
  keywords: string[],
  limit: number = 3
): Array<{ numero: string; tese: string }> {
  const results: Array<{ numero: string; tese: string; score: number }> = [];

  for (const [numero, tema] of Object.entries(kb.temas)) {
    const matchScore = keywords.filter(k =>
      tema.tese.toLowerCase().includes(k.toLowerCase()) ||
      tema.aplicacao.toLowerCase().includes(k.toLowerCase())
    ).length;

    if (matchScore > 0) {
      results.push({
        numero,
        tese: tema.tese,
        score: matchScore
      });
    }
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ numero, tese }) => ({ numero, tese }));
}

// Build system prompt for LEX PROMPTER
function buildSystemPrompt(
  firac: FIRAC,
  classificacao: Classificacao,
  sumulas: Array<{ numero: string; tribunal: string; texto: string }>,
  temas: Array<{ numero: string; tese: string }>
): string {
  const sumulasText = sumulas.length > 0
    ? sumulas.map(s => `- Súmula ${s.numero}/${s.tribunal}: ${s.texto}`).join('\n')
    : '- Nenhuma súmula específica identificada';

  const temasText = temas.length > 0
    ? temas.map(t => `- Tema ${t.numero}: ${t.tese.substring(0, 200)}...`).join('\n')
    : '- Nenhum tema repetitivo específico identificado';

  return `# LEX PROMPTER - Agente Gerador Dinâmico de Prompts Jurídicos v1.0

## IDENTIDADE
Você é o LEX PROMPTER, um engenheiro de prompts jurídicos especializado em criar templates enterprise-grade para o sistema judiciário brasileiro.

## MISSÃO
Gere um prompt completo e especializado para minutar a decisão/sentença do caso apresentado.

## DADOS DO CASO

### FIRAC
- **Fatos:** ${firac.fatos}
- **Questões:** ${firac.questoes}
- **Regras Aplicáveis:** ${firac.regras_aplicaveis || '[Não identificadas]'}
- **Análise:** ${firac.analise || '[Não fornecida]'}
- **Conclusão Preliminar:** ${firac.conclusao_preliminar || '[Não fornecida]'}

### CLASSIFICAÇÃO
- **Domínio:** ${classificacao.dominio_identificado || 'NÃO IDENTIFICADO'}
- **Confiança:** ${classificacao.confianca}
- **Keywords:** ${classificacao.keywords_extraidas?.join(', ') || '[Nenhuma]'}

## SÚMULAS RELEVANTES IDENTIFICADAS
${sumulasText}

## TEMAS REPETITIVOS RELEVANTES
${temasText}

## FRAMEWORK OBRIGATÓRIO - 5 CAMADAS

### CAMADA 0: INICIALIZAÇÃO
- Role: Juiz de Direito Titular, 15 anos experiência
- Versão: LEX MAGISTER v2.0 - Gerado Dinamicamente
- Compliance: CNJ 615/2025, LGPD, Art. 489 CPC
- Segurança: Mascaramento PII, anti-alucinação

### CAMADA 1: CONTEXTO NORMATIVO
- Base legal específica do caso
- Súmulas aplicáveis com texto completo
- Temas repetitivos vinculantes
- Resoluções administrativas (se houver)

### CAMADA 2: METODOLOGIA
- REGRA DE OURO: Mínimo 3 parágrafos por questão
  1. Fundamento jurídico abstrato
  2. Jurisprudência com citação literal
  3. Subsunção aos fatos
- VEDAÇÕES do Art. 489, §1º CPC
- Método bifásico para danos morais (se aplicável)

### CAMADA 3: TEMPLATES DE SAÍDA
- Estrutura: Relatório → Fundamentação → Dispositivo
- Exemplos de redação profissional

### CAMADA 4: CONTROLE DE QUALIDADE
- Checklist de validação estrutural
- Checklist jurídico
- Compliance CNJ 615/2025

## FORMATO DE SAÍDA

Retorne o prompt completo em MARKDOWN, pronto para uso imediato.
O prompt deve ser AUTOCONTIDO e seguir rigorosamente o framework de 5 camadas.`;
}

// Main LEX PROMPTER class
export class LexPrompter {
  private client: Anthropic;
  private kb: KnowledgeBase;
  private model: string = 'claude-sonnet-4-20250514';

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
    this.kb = loadKnowledgeBase();
  }

  async generatePrompt(
    firac: FIRAC,
    classificacao: Classificacao
  ): Promise<LexPrompterResult> {
    const startTime = Date.now();

    // Extract keywords from FIRAC
    const keywords = [
      ...(classificacao.keywords_extraidas || []),
      ...firac.fatos.split(/\s+/).filter(w => w.length > 4).slice(0, 10),
      ...firac.questoes.split(/\s+/).filter(w => w.length > 4).slice(0, 5)
    ];

    // Find relevant súmulas and temas
    const sumulas = findRelevantSumulas(this.kb, keywords);
    const temas = findRelevantTemas(this.kb, keywords);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(firac, classificacao, sumulas, temas);

    // Call Anthropic API
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Gere o prompt completo para este caso seguindo o framework de 5 camadas.

Lembre-se:
1. O prompt deve ser AUTOCONTIDO
2. Deve incluir as 5 camadas obrigatórias
3. Deve referenciar as súmulas e temas relevantes
4. Deve incluir checklist de qualidade
5. Formato final em Markdown`
        }
      ]
    });

    const endTime = Date.now();
    const generatedPrompt = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Validate layers
    const layers = {
      layer_0: generatedPrompt.includes('CAMADA 0') || generatedPrompt.includes('INICIALIZAÇÃO'),
      layer_1: generatedPrompt.includes('CONTEXTO NORMATIVO') || generatedPrompt.includes('BASE LEGAL'),
      layer_2: generatedPrompt.includes('METODOLOGIA') || generatedPrompt.includes('3 parágrafos'),
      layer_3: generatedPrompt.includes('TEMPLATE') || generatedPrompt.includes('RELATÓRIO'),
      layer_4: generatedPrompt.includes('CHECKLIST') || generatedPrompt.includes('QUALIDADE')
    };

    const score = Object.values(layers).filter(Boolean).length / 5;

    return {
      prompt_gerado: generatedPrompt,
      validacao: {
        score,
        layers_present: layers,
        aprovado: score >= 0.8
      },
      metadata: {
        gerado_em: new Date().toISOString(),
        modelo: this.model,
        tokens_utilizados: response.usage.output_tokens,
        tempo_ms: endTime - startTime
      },
      sumulas_utilizadas: sumulas.map(s => `${s.numero}/${s.tribunal}`),
      temas_utilizados: temas.map(t => t.numero)
    };
  }
}

// CLI usage
async function main() {
  const prompter = new LexPrompter();

  // Example case
  const firac: FIRAC = {
    fatos: 'O autor celebrou contrato de compra e venda de imóvel na planta com a ré incorporadora. O prazo de entrega era março de 2025, mas até a presente data o imóvel não foi entregue.',
    questoes: 'Responsabilidade da incorporadora pelo atraso. Cabimento de lucros cessantes. Danos morais.',
    regras_aplicaveis: 'CDC, Lei 4.591/64, Temas 970 e 996 STJ',
    analise: 'Atraso superior a 180 dias de tolerância',
    conclusao_preliminar: 'Procedência provável'
  };

  const classificacao: Classificacao = {
    dominio_identificado: null,
    confianca: 0.45,
    keywords_extraidas: ['imóvel', 'incorporadora', 'atraso', 'entrega', 'lucros cessantes']
  };

  console.log('🚀 LEX PROMPTER - Gerando prompt dinâmico...\n');

  try {
    const result = await prompter.generatePrompt(firac, classificacao);

    console.log('✅ Prompt gerado com sucesso!\n');
    console.log('📊 Validação:');
    console.log(`   Score: ${(result.validacao.score * 100).toFixed(0)}%`);
    console.log(`   Aprovado: ${result.validacao.aprovado ? 'SIM' : 'NÃO'}`);
    console.log(`   Camadas: ${JSON.stringify(result.validacao.layers_present)}`);
    console.log('\n📚 Referências utilizadas:');
    console.log(`   Súmulas: ${result.sumulas_utilizadas.join(', ') || 'Nenhuma'}`);
    console.log(`   Temas: ${result.temas_utilizados.join(', ') || 'Nenhum'}`);
    console.log('\n⏱️  Metadata:');
    console.log(`   Tempo: ${result.metadata.tempo_ms}ms`);
    console.log(`   Tokens: ${result.metadata.tokens_utilizados}`);
    console.log('\n📄 Prompt Gerado:\n');
    console.log(result.prompt_gerado);
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { FIRAC, Classificacao, LexPrompterResult };
