# Casos de Teste - Lex Intelligentia v2.1.1

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
  "assunto": "..."
}
```

## Casos Bancarios (5)

| ID | Descricao | Sumulas Esperadas |
|----|-----------|-------------------|
| bancario_01 | Emprestimo consignado fraudulento | 297, 479 STJ |
| bancario_02 | Juros abusivos em financiamento | 381, 382, 539 STJ |
| bancario_03 | Fraude em cartao de credito | 479 STJ |
| bancario_04 | Negativacao indevida por banco | 385, 388 STJ |
| bancario_05 | Acao revisional de contrato | 381, 382, 603 STJ |

## Casos Consumidor (5)

| ID | Descricao | Sumulas Esperadas |
|----|-----------|-------------------|
| consumidor_01 | Falha na prestacao de servico | Art. 14 CDC |
| consumidor_02 | Produto com defeito de fabricacao | Art. 18 CDC |
| consumidor_03 | Cobranca indevida de servico | Art. 42 CDC |
| consumidor_04 | Propaganda enganosa | Art. 37 CDC |
| consumidor_05 | Plano de saude - negativa cobertura | Sumula 302 STJ |

## Criterios de Validacao

- Score QA >= 70 para aprovacao
- Estrutura I/II/III presente
- Base legal citada
- Marcadores [REVISAR] <= 5

## Como Executar

```bash
# Definir URL do webhook
export WEBHOOK_URL="https://YOUR-N8N.app.n8n.cloud/webhook/lex-intelligentia-agentes"

# Executar todos os testes
node run_production_tests.js

# Ou testar caso individual com curl
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d @bancario/caso_01_emprestimo_consignado.json
```
