# Processos Reais para Validação

Esta pasta contém PDFs de processos reais para testar os agentes especializados.

## Estrutura

```
processos_reais/
├── bancario/           # Ações bancárias, empréstimos, fraudes
├── consumidor/         # CDC, danos morais, falha de serviço
├── execucao/           # Títulos extrajudiciais, cumprimento sentença
├── locacao/            # Despejo, renovatória, Lei 8.245/91
├── possessorias/       # Reintegração, manutenção de posse
├── saude_cobertura/    # Negativa de procedimentos, ANS
├── saude_contratual/   # Reajustes, rescisão, carência
├── transito/           # Acidentes, responsabilidade civil
├── usucapiao/          # Todas modalidades
├── incorporacao/       # Atraso entrega, defeitos construtivos
└── generico/           # Casos atípicos
```

## Como Usar

### 1. Faça upload dos PDFs

Coloque os PDFs na pasta correspondente ao tipo de ação.

**Convenção de nomes:**
```
[numero_processo]_[descricao_curta].pdf

Exemplos:
0001234-56.2025.8.08.0001_emprestimo_fraudulento.pdf
0009876-54.2025.8.08.0024_despejo_falta_pagamento.pdf
```

### 2. Extraia os dados do PDF

Use o script de extração (a ser criado) ou extraia manualmente:

```json
{
  "caso_id": "real_bancario_001",
  "processo": "0001234-56.2025.8.08.0001",
  "fatos": "[Extrair da petição inicial]",
  "questoes": "[Questões jurídicas identificadas]",
  "pedidos": "[Pedidos do autor]",
  "classe": "Procedimento Comum Cível",
  "assunto": "[Assunto do processo]",
  "valor_causa": 50000.00
}
```

### 3. Execute o teste

```bash
export ANTHROPIC_API_KEY=sk-ant-...
node scripts/agent_validator.js bancario
```

## Privacidade

⚠️ **IMPORTANTE**: Antes de fazer upload:

1. **Anonimize dados pessoais**:
   - Nomes das partes → "AUTOR" / "RÉU"
   - CPF/CNPJ → "XXX.XXX.XXX-XX"
   - Endereços → "Rua X, nº Y, Cidade/UF"
   - Telefones → "(XX) XXXXX-XXXX"

2. **Remova documentos sensíveis**:
   - Procurações com dados reais
   - Documentos de identidade
   - Comprovantes com dados bancários

3. **Mantenha apenas o essencial**:
   - Petição inicial (fatos, pedidos)
   - Contestação (se houver)
   - Decisões anteriores (se relevante)

## Formato Esperado

Cada processo deve ter um arquivo JSON correspondente:

```
processos_reais/
├── bancario/
│   ├── processo_001.pdf
│   ├── processo_001.json    ← Dados extraídos
│   ├── processo_002.pdf
│   └── processo_002.json
```

---

*Lex Intelligentia Judiciário - Validação com Processos Reais*
