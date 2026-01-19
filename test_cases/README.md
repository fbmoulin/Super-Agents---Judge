# Casos de Teste - Lex Intelligentia v2.2

## Estrutura dos Casos

Cada arquivo JSON segue o formato FIRAC:

```json
{
  "caso_id": "bancario_01",
  "descricao": "Emprestimo consignado fraudulento",
  "fatos": "...",
  "questoes": "...",
  "pedidos": "...",
  "classe": "Procedimento Comum Civel",
  "assunto": "...",
  "valor_causa": 30000.00,
  "expectativa": {
    "agente_esperado": "agent_BANCARIO",
    "score_minimo": 75,
    "artigos_esperados": ["297", "479"]
  }
}
```

## Domínios de Teste

### Bancário (5 casos) ✅

| ID | Descrição | Status | Confiança |
|----|-----------|--------|-----------|
| bancario_01 | Empréstimo consignado fraudulento | ✅ Validado | 0.98 |
| bancario_02 | Juros abusivos em financiamento | ⏳ Pendente | - |
| bancario_03 | Fraude em cartão de crédito | ⏳ Pendente | - |
| bancario_04 | Negativação indevida por banco | ⏳ Pendente | - |
| bancario_05 | Ação revisional de contrato | ⏳ Pendente | - |

**Súmulas Esperadas:** 297, 381, 382, 379, 539, 565, 603/STJ

### Consumidor (5 casos) ✅

| ID | Descrição | Status | Confiança |
|----|-----------|--------|-----------|
| consumidor_01 | Falha na prestação de serviço | ⏳ Pendente | - |
| consumidor_02 | Produto com defeito de fabricação | ⏳ Pendente | - |
| consumidor_03 | Cobrança indevida de serviço | ✅ Validado | 0.95 |
| consumidor_04 | Propaganda enganosa | ⏳ Pendente | - |
| consumidor_05 | Plano de saúde - negativa | ⏳ Pendente | - |

**Súmulas Esperadas:** 385, 388, 479, 469/STJ, Arts. CDC

### Execução (1 caso) ⚠️

| ID | Descrição | Status | Confiança |
|----|-----------|--------|-----------|
| execucao_01 | Título extrajudicial - cheque | ⚠️ Falhou | 0.30 |

**Issue:** Router truncation (maxOutputTokens insuficiente)
**Artigos Esperados:** Arts. 784, 786, 919, 921 CPC

### Locação (1 caso) ✅

| ID | Descrição | Status | Confiança |
|----|-----------|--------|-----------|
| locacao_01 | Despejo por falta de pagamento | ✅ Validado | 0.98 |

**Artigos Esperados:** Arts. 9, 46, 47, 51, 62 Lei 8.245/91

### Possessórias (1 caso) ✅

| ID | Descrição | Status | Confiança |
|----|-----------|--------|-----------|
| possessorias_01 | Reintegração de posse - esbulho | ✅ Validado | 0.98 |

**Artigos Esperados:** Arts. 556, 561 CPC

### Saúde Cobertura (casos) ⏳

| ID | Descrição | Status |
|----|-----------|--------|
| saude_cobertura_01 | Negativa de procedimento | ⏳ Pendente |
| saude_cobertura_02 | Urgência/emergência | ⏳ Pendente |

**Súmulas Esperadas:** 302, 469, 597, 608, 609/STJ

### Saúde Contratual (casos) ⏳

| ID | Descrição | Status |
|----|-----------|--------|
| saude_contratual_01 | Reajuste abusivo | ⏳ Pendente |
| saude_contratual_02 | Rescisão unilateral | ⏳ Pendente |

**Base Legal:** Tema 952/STJ, Art. 15 Lei 9.656/98

### Trânsito (casos) ⏳

| ID | Descrição | Status |
|----|-----------|--------|
| transito_01 | Colisão traseira | ⏳ Pendente |
| transito_02 | Atropelamento | ⏳ Pendente |

**Base Legal:** Arts. 186, 927, 932, 944, 950 CC

### Usucapião (casos) ⏳

| ID | Descrição | Status |
|----|-----------|--------|
| usucapiao_01 | Usucapião extraordinária | ⏳ Pendente |
| usucapiao_02 | Usucapião especial urbana | ⏳ Pendente |

**Base Legal:** Arts. 1.238-1.244 CC, Arts. 183, 191 CF

### Incorporação (casos) ⏳

| ID | Descrição | Status |
|----|-----------|--------|
| incorporacao_01 | Atraso na entrega | ⏳ Pendente |
| incorporacao_02 | Rescisão com restituição | ⏳ Pendente |

**Base Legal:** Temas 970, 996/STJ, Súmula 543, Lei 4.591/64

### Genérico (1 caso) ⏳

| ID | Descrição | Status |
|----|-----------|--------|
| generico_01 | Ação declaratória atípica | ⏳ Pendente |

**Nota:** Fallback com [REVISAR] abundante

## Critérios de Validação

- Score QA >= 70 para aprovação
- Estrutura I/II/III presente
- Base legal citada
- Marcadores [REVISAR] <= 5
- Confiança router >= 0.85 (ideal)

## Como Executar

### Todos os Testes

```bash
# Definir URL do webhook (test mode)
export WEBHOOK_URL="https://YOUR-N8N.app.n8n.cloud/webhook-test/lex-intelligentia-agentes"

# Executar todos os testes
cd test_cases
node run_production_tests.js
```

### Teste Individual

```bash
# Com curl
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @bancario/caso_01_emprestimo_consignado.json
```

### PowerShell (Windows)

```powershell
$caso = Get-Content "bancario/caso_01_emprestimo_consignado.json" | ConvertFrom-Json
Invoke-RestMethod -Uri $env:WEBHOOK_URL -Method Post -Body ($caso | ConvertTo-Json) -ContentType "application/json"
```

## Resultados dos Testes

Os resultados são salvos em `test_results/`:

| Arquivo | Descrição |
|---------|-----------|
| `PRODUCTION_TEST_REPORT_*.md` | Relatórios de produção |
| `test_report_*.json` | Resultados detalhados em JSON |

## Estrutura de Diretórios

```
test_cases/
├── bancario/           # 5 casos
├── consumidor/         # 5 casos
├── execucao/           # 1 caso
├── locacao/            # 1 caso
├── possessorias/       # 1 caso
├── saude_cobertura/    # casos plano saúde
├── saude_contratual/   # casos contratual
├── transito/           # casos trânsito
├── usucapiao/          # casos usucapião
├── incorporacao/       # casos atraso imóvel
├── generico/           # casos atípicos
├── test_results/       # relatórios
├── run_production_tests.js  # script de testes
└── README.md           # este arquivo
```

---

*Atualizado: 2026-01-19 | Lex Intelligentia v2.2*
