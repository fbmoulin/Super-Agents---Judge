// n8n_nodes/quality_validator.js
// Copy this into n8n Code node after AI Agent output

const decisionText = $input.first().json.output || $input.first().json.text || '';
const knowledgeBase = {
  sumulas: [297, 283, 596, 382, 379, 381, 176, 356, 472, 548, 549, 550, 552],
  temas: [952, 929, 927, 928, 905, 246, 725, 936]
};

// === STRUCTURE VALIDATION ===
const requiredSections = [
  { name: 'RELATÓRIO', pattern: /^##?\s*REL[AÁ]T[OÓ]RIO/mi, weight: 0.33 },
  { name: 'FUNDAMENTAÇÃO', pattern: /^##?\s*FUNDAMENTA[CÇ][AÃ]O/mi, weight: 0.34 },
  { name: 'DISPOSITIVO', pattern: /^##?\s*DISPOSITIVO/mi, weight: 0.33 }
];

const structureIssues = [];
let structureScore = 0;

for (const section of requiredSections) {
  if (section.pattern.test(decisionText)) {
    structureScore += section.weight;
  } else {
    structureIssues.push(`Seção ausente: ${section.name}`);
  }
}

// === CITATION VALIDATION ===
const citedSumulas = decisionText.match(/S[úu]mula\s+n?[º°]?\s*(\d+)/gi) || [];
const citedTemas = decisionText.match(/Tema\s+n?[º°]?\s*(\d+)/gi) || [];

const citationIssues = [];
let validCitations = 0;
let totalCitations = citedSumulas.length + citedTemas.length;

for (const cited of citedSumulas) {
  const num = parseInt(cited.match(/\d+/)[0]);
  if (knowledgeBase.sumulas.includes(num)) {
    validCitations++;
  } else {
    citationIssues.push(`Súmula ${num} não encontrada na base`);
  }
}

for (const cited of citedTemas) {
  const num = parseInt(cited.match(/\d+/)[0]);
  if (knowledgeBase.temas.includes(num)) {
    validCitations++;
  } else {
    citationIssues.push(`Tema ${num} não encontrado na base`);
  }
}

const citationScore = totalCitations > 0 ? validCitations / totalCitations : 0.5;

// === REASONING VALIDATION ===
const paragraphs = decisionText.split(/\n\n+/).filter(p => p.trim().length > 50);
const reasoningIssues = [];
let reasoningScore = 1.0;

// Check minimum paragraph count
if (paragraphs.length < 5) {
  reasoningIssues.push(`Poucos parágrafos substantivos: ${paragraphs.length} (mínimo: 5)`);
  reasoningScore -= 0.3;
}

// Check for case-specific facts (numbers, dates, names)
const hasSpecificFacts = /R\$\s*[\d.,]+|(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})|processo\s+n[º°]?\s*[\d.-]+/i.test(decisionText);
if (!hasSpecificFacts) {
  reasoningIssues.push('Ausência de fatos específicos do caso (valores, datas, números de processo)');
  reasoningScore -= 0.2;
}

// Check for legal reasoning pattern
const hasLegalReasoning = /art(igo)?\.?\s*\d+|lei\s+n?[º°]?\s*[\d.]+|cpc|cc|cdc|cf/i.test(decisionText);
if (!hasLegalReasoning) {
  reasoningIssues.push('Ausência de fundamentação legal explícita');
  reasoningScore -= 0.3;
}

reasoningScore = Math.max(0, reasoningScore);

// === COMPILE RESULTS ===
const allIssues = [...structureIssues, ...citationIssues, ...reasoningIssues];
const overallScore = (structureScore + citationScore + reasoningScore) / 3;

return [{
  json: {
    ...$input.first().json,
    quality: {
      structure_score: Math.round(structureScore * 100) / 100,
      citation_score: Math.round(citationScore * 100) / 100,
      reasoning_score: Math.round(reasoningScore * 100) / 100,
      overall_score: Math.round(overallScore * 100) / 100,
      issues: allIssues,
      citations_found: totalCitations,
      citations_valid: validCitations
    }
  }
}];
