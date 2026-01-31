#!/usr/bin/env node
/**
 * LLM Evaluator - Uses Gemini to score legal minutas
 *
 * Evaluates on 3 dimensions:
 * - ESTRUTURA (33%): Has Relatório, Fundamentação, Dispositivo
 * - JURIDICO (33%): Correct súmulas, articles, reasoning
 * - UTILIDADE (33%): Ready for use, minimal [REVISAR] markers
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY or GOOGLE_API_KEY environment variable required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const EVALUATION_PROMPT = `Você é um avaliador de minutas judiciais. Avalie a minuta abaixo em 3 dimensões.

## MINUTA A AVALIAR
{minuta}

## DOMÍNIO ESPERADO
{domain}

## SÚMULAS ESPERADAS
{expected_sumulas}

---

## CRITÉRIOS DE AVALIAÇÃO

### 1. ESTRUTURA (0-100)
- 100: Tem I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO claramente separados
- 85: Tem as 3 seções mas formatação inconsistente
- 70: Falta 1 seção ou seções misturadas
- 50: Falta 2 seções
- 0: Sem estrutura reconhecível

### 2. JURÍDICO (0-100)
- 100: Súmulas corretas, artigos pertinentes, raciocínio lógico
- 85: Pequenas imprecisões mas juridicamente sólido
- 70: Faltam súmulas importantes ou artigos imprecisos
- 50: Fundamentação fraca ou súmulas erradas
- 0: Sem base jurídica ou completamente errado

### 3. UTILIDADE (0-100)
- 100: Pronta para uso, sem [REVISAR], dispositivo claro
- 85: 1-2 marcadores [REVISAR], dispositivo claro
- 70: 3-5 marcadores ou dispositivo ambíguo
- 50: Muitos marcadores ou dispositivo incompleto
- 0: Não utilizável

---

## RESPOSTA
Retorne APENAS um JSON válido (sem markdown, sem explicação):
{"estrutura": N, "juridico": N, "utilidade": N, "problemas": ["problema 1", "problema 2"], "sugestoes": ["sugestão 1"]}`;

async function evaluateMinuta(minuta, domain, expectedSumulas = []) {
  const prompt = EVALUATION_PROMPT
    .replace('{minuta}', minuta)
    .replace('{domain}', domain)
    .replace('{expected_sumulas}', expectedSumulas.join(', ') || 'Não especificadas');

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: 'application/json'
      }
    });

    const text = result.response.text();
    const evaluation = JSON.parse(text);

    // Calculate overall score (equal weights)
    evaluation.overall = Math.round(
      (evaluation.estrutura + evaluation.juridico + evaluation.utilidade) / 3
    );

    return evaluation;
  } catch (error) {
    console.error('Evaluation error:', error.message);
    return {
      estrutura: 0,
      juridico: 0,
      utilidade: 0,
      overall: 0,
      problemas: [`Erro na avaliação: ${error.message}`],
      sugestoes: []
    };
  }
}

// Export for use as module
module.exports = { evaluateMinuta };

// CLI usage
if (require.main === module) {
  const fs = require('fs');

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node llm_evaluator.js <minuta_file.txt> [domain] [sumulas]');
    console.log('Example: node llm_evaluator.js output.txt BANCARIO "297,382"');
    process.exit(1);
  }

  const minutaFile = args[0];
  const domain = args[1] || 'GENERICO';
  const sumulas = args[2] ? args[2].split(',') : [];

  if (!fs.existsSync(minutaFile)) {
    console.error(`File not found: ${minutaFile}`);
    process.exit(1);
  }

  const minuta = fs.readFileSync(minutaFile, 'utf-8');

  evaluateMinuta(minuta, domain, sumulas).then(result => {
    console.log('\n📊 LLM Evaluation Results:');
    console.log('─'.repeat(40));
    console.log(`  Estrutura: ${result.estrutura}%`);
    console.log(`  Jurídico:  ${result.juridico}%`);
    console.log(`  Utilidade: ${result.utilidade}%`);
    console.log('─'.repeat(40));
    console.log(`  OVERALL:   ${result.overall}%`);

    if (result.problemas?.length) {
      console.log('\n⚠️  Problemas:');
      result.problemas.forEach(p => console.log(`  - ${p}`));
    }

    if (result.sugestoes?.length) {
      console.log('\n💡 Sugestões:');
      result.sugestoes.forEach(s => console.log(`  - ${s}`));
    }
  });
}
