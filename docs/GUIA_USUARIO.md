# Guia do Usuário - Lex Intelligentia Judiciário

Sistema de automação de minutas judiciais com 21 agentes especializados, em conformidade com a Resolução CNJ 615/2025.

---

## Índice

1. [Introdução](#1-introdução)
2. [Como Funciona](#2-como-funciona)
3. [Enviando uma Requisição](#3-enviando-uma-requisição)
4. [Entendendo a Resposta](#4-entendendo-a-resposta)
5. [Agentes Especializados](#5-agentes-especializados)
6. [Classificação de Risco](#6-classificação-de-risco)
7. [Boas Práticas](#7-boas-práticas)
8. [Trilha de Auditoria](#8-trilha-de-auditoria)
9. [Perguntas Frequentes](#9-perguntas-frequentes)
10. [Solução de Problemas](#10-solução-de-problemas)

---

## 1. Introdução

O **Lex Intelligentia Judiciário** é um sistema de inteligência artificial que auxilia magistrados e servidores na elaboração de minutas de decisões judiciais. O sistema utiliza 21 agentes especializados em diferentes áreas do direito para gerar minutas personalizadas e tecnicamente adequadas.

### Características Principais

- **21 Agentes Especializados**: Cada área do direito possui um agente treinado com jurisprudência específica
- **Conformidade CNJ 615/2025**: Todas as minutas seguem as diretrizes de IA no Judiciário
- **Revisão Humana Obrigatória**: O sistema gera sugestões que devem ser revisadas pelo magistrado
- **Trilha de Auditoria**: Todas as operações são registradas para transparência
- **Avaliação de Qualidade**: Cada minuta recebe um score de qualidade e classificação de risco

### Importante

> ⚠️ **AVISO LEGAL**: As minutas geradas são **sugestões** que requerem revisão e aprovação do magistrado. O sistema não substitui o julgamento humano e todas as decisões finais são de responsabilidade do julgador.

---

## 2. Como Funciona

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Dados do       │     │  Classificação  │     │  Agente         │
│  Processo       │ ──▶ │  Automática     │ ──▶ │  Especializado  │
│  (você envia)   │     │  (Gemini)       │     │  (Claude)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Minuta Final   │     │  Avaliação de   │     │  Geração da     │
│  + Metadados    │ ◀── │  Qualidade      │ ◀── │  Minuta         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Fluxo de Processamento

1. **Recebimento**: Você envia os dados do processo via API
2. **Classificação**: O sistema identifica automaticamente a área jurídica
3. **Roteamento**: O processo é direcionado ao agente especializado adequado
4. **Geração**: O agente gera a minuta com base nos dados e jurisprudência
5. **Avaliação**: A minuta passa por verificação de qualidade
6. **Resposta**: Você recebe a minuta com score e metadados

---

## 3. Enviando uma Requisição

### Endpoint

```
POST /webhook/lex-intelligentia
Content-Type: application/json
```

### Campos da Requisição

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `classe` | string | Sim | Classe processual (ex: "Procedimento Comum Cível") |
| `assunto` | string | Sim | Assunto principal do processo |
| `fatos` | string | Sim | Narrativa fática do caso |
| `pedidos` | string | Sim | Pedidos formulados pela parte |
| `valor_causa` | string | Não | Valor da causa (ex: "R$ 50.000,00") |
| `partes` | object | Não | Informações sobre autor e réu |
| `documentos` | string | Não | Resumo dos documentos anexados |

### Exemplo de Requisição

```json
{
  "classe": "Procedimento Comum Cível",
  "assunto": "Contratos Bancários - Revisão de cláusulas",
  "fatos": "O autor celebrou contrato de empréstimo consignado com o réu em 15/03/2024, no valor de R$ 30.000,00, com taxa de juros de 3,5% ao mês. Alega que as taxas praticadas são abusivas, superiores à média de mercado divulgada pelo Banco Central. Apresenta simulações demonstrando cobrança em duplicidade de tarifas.",
  "pedidos": "1) Revisão das cláusulas contratuais abusivas; 2) Limitação dos juros à taxa média de mercado; 3) Restituição em dobro dos valores cobrados indevidamente; 4) Indenização por danos morais no valor de R$ 10.000,00",
  "valor_causa": "R$ 50.000,00",
  "partes": {
    "autor": "João da Silva",
    "reu": "Banco XYZ S.A."
  }
}
```

### Usando cURL

```bash
curl -X POST https://seu-servidor/webhook/lex-intelligentia \
  -H "Content-Type: application/json" \
  -d '{
    "classe": "Procedimento Comum Cível",
    "assunto": "Contratos Bancários",
    "fatos": "O autor celebrou contrato de empréstimo...",
    "pedidos": "Revisão de cláusulas abusivas..."
  }'
```

---

## 4. Entendendo a Resposta

### Estrutura da Resposta

```json
{
  "minuta": "I - RELATÓRIO\n\nTrata-se de ação...\n\nII - FUNDAMENTAÇÃO\n\n...\n\nIII - DISPOSITIVO\n\n...",
  "agente": "BANCARIO",
  "score": 87,
  "risco": "BAIXO",
  "requer_revisao": true,
  "confianca": 0.92,
  "audit_id": "LEX-20260131-abc123",
  "tempo_ms": 4523
}
```

### Campos da Resposta

| Campo | Descrição |
|-------|-----------|
| `minuta` | Texto completo da minuta gerada |
| `agente` | Código do agente que processou a requisição |
| `score` | Pontuação de qualidade (0-100) |
| `risco` | Classificação de risco: BAIXO, MEDIO, ALTO, CRITICO |
| `requer_revisao` | Sempre `true` - revisão humana obrigatória |
| `confianca` | Nível de confiança da classificação (0.0-1.0) |
| `audit_id` | Identificador único para auditoria |
| `tempo_ms` | Tempo de processamento em milissegundos |

### Estrutura da Minuta

Toda minuta segue a estrutura padrão:

```
I - RELATÓRIO
[Síntese dos fatos e pedidos]

II - FUNDAMENTAÇÃO
[Análise jurídica com citação de legislação e jurisprudência]

III - DISPOSITIVO
[Decisão com comandos específicos]
```

---

## 5. Agentes Especializados

O sistema possui 21 agentes, organizados em 5 categorias:

### Direito Civil e Consumidor (6 agentes)

| Agente | Especialidade | Exemplos de Casos |
|--------|---------------|-------------------|
| `BANCARIO` | Contratos bancários | Empréstimos, cartões, tarifas |
| `CONSUMIDOR` | Relações de consumo | Produtos, serviços, vícios |
| `EXECUCAO` | Execuções de título | Cheques, promissórias, contratos |
| `LOCACAO` | Locação de imóveis | Despejo, renovatória, revisional |
| `POSSESSORIAS` | Posse e propriedade | Reintegração, manutenção, usucapião |
| `GENERICO` | Casos não classificados | Fallback para demandas atípicas |

### Direito da Saúde (3 agentes)

| Agente | Especialidade | Exemplos de Casos |
|--------|---------------|-------------------|
| `SAUDE_COBERTURA` | Cobertura de planos | Negativa de procedimentos |
| `SAUDE_CONTRATUAL` | Contratos de saúde | Reajustes, rescisões |
| `SAUDE_MEDICAMENTOS` | Medicamentos | Fornecimento, off-label |

### Direito de Família (5 agentes)

| Agente | Especialidade | Exemplos de Casos |
|--------|---------------|-------------------|
| `ALIMENTOS` | Pensão alimentícia | Fixação, revisão, exoneração |
| `GUARDA` | Guarda de menores | Unilateral, compartilhada |
| `PATERNIDADE` | Investigação de paternidade | DNA, reconhecimento |
| `DIVORCIO` | Dissolução conjugal | Litigioso, partilha |
| `INVENTARIO` | Sucessões | Inventário, arrolamento |

### Direito Especializado (6 agentes)

| Agente | Especialidade | Exemplos de Casos |
|--------|---------------|-------------------|
| `TRANSITO` | Acidentes de trânsito | Colisões, atropelamentos |
| `USUCAPIAO` | Usucapião | Extraordinária, ordinária |
| `INCORPORACAO` | Incorporação imobiliária | Atraso de obra, vícios |
| `SEGUROS` | Contratos de seguro | Indenizações, recusas |
| `COBRANCA` | Cobranças | Débitos, inadimplência |
| `REPARACAO_DANOS` | Responsabilidade civil | Danos morais e materiais |

### Fazenda Pública (3 agentes)

| Agente | Especialidade | Exemplos de Casos |
|--------|---------------|-------------------|
| `EXECUCAO_FISCAL` | Execuções fiscais | Tributos, multas |
| `RESP_CIVIL_ESTADO` | Responsabilidade estatal | Erro médico, omissão |
| `MANDADO_SEGURANCA` | Mandados de segurança | Direito líquido e certo |

---

## 6. Classificação de Risco

O sistema avalia cada minuta e atribui uma classificação de risco:

### Níveis de Risco

| Nível | Score | Significado | Ação Recomendada |
|-------|-------|-------------|------------------|
| 🟢 **BAIXO** | 85-100 | Alta qualidade, estrutura completa | Revisão padrão |
| 🟡 **MEDIO** | 70-84 | Qualidade adequada, pode haver lacunas | Revisão atenta |
| 🟠 **ALTO** | 50-69 | Qualidade comprometida | Revisão detalhada |
| 🔴 **CRITICO** | 0-49 | Problemas significativos | Reescrita recomendada |

### Critérios de Avaliação

O score é calculado com base em:

1. **Estrutura** (30%)
   - Presença de Relatório, Fundamentação e Dispositivo
   - Organização lógica do texto

2. **Fundamentação** (35%)
   - Citação de legislação aplicável
   - Referência a jurisprudência (STJ, STF, Tribunais)
   - Uso de súmulas quando pertinente

3. **Dispositivo** (25%)
   - Clareza dos comandos decisórios
   - Tratamento de custas e honorários
   - Especificação de valores quando aplicável

4. **Completude** (10%)
   - Ausência de marcadores [REVISAR]
   - Coerência entre pedidos e decisão

---

## 7. Boas Práticas

### Para Melhores Resultados

#### ✅ Faça

- **Seja específico nos fatos**: Inclua datas, valores, documentos mencionados
- **Detalhe os pedidos**: Liste cada pedido de forma clara e separada
- **Informe o valor da causa**: Ajuda na análise de honorários
- **Mencione provas relevantes**: Documentos, perícias, testemunhos
- **Indique precedentes**: Se houver jurisprudência específica do caso

#### ❌ Evite

- **Textos genéricos**: "O autor sofreu danos" sem especificar quais
- **Pedidos vagos**: "Indenização" sem indicar tipo e fundamento
- **Informações incompletas**: Omitir dados essenciais do processo
- **Linguagem informal**: Use terminologia jurídica adequada

### Exemplo de Entrada Bem Estruturada

```json
{
  "classe": "Procedimento Comum Cível",
  "assunto": "Responsabilidade Civil - Acidente de Trânsito",
  "fatos": "Em 10/05/2024, às 14h30, na Av. Principal, nº 500, o veículo do réu (Placa ABC-1234, Fiat Uno) colidiu na traseira do veículo do autor (Placa XYZ-5678, VW Gol) que estava parado no semáforo. O boletim de ocorrência nº 12345/2024 registra que o réu estava em velocidade incompatível. O autor sofreu lesões cervicais (CID M54.2) e o veículo teve perda total, conforme laudo pericial. Danos materiais: R$ 25.000,00 (valor venal). Despesas médicas: R$ 3.500,00.",
  "pedidos": "1) Indenização por danos materiais no valor de R$ 28.500,00 (veículo + despesas médicas); 2) Indenização por danos morais no valor de R$ 15.000,00; 3) Pensionamento mensal de 1 salário mínimo pelo período de incapacidade (3 meses); 4) Honorários advocatícios de 20%",
  "valor_causa": "R$ 46.500,00",
  "partes": {
    "autor": "Maria Santos, CPF 123.456.789-00",
    "reu": "José Oliveira, CPF 987.654.321-00"
  },
  "documentos": "BO nº 12345/2024; Laudo pericial do veículo; Atestados médicos; Notas fiscais de despesas"
}
```

---

## 8. Trilha de Auditoria

Todas as operações são registradas para fins de transparência e conformidade com o CNJ 615/2025.

### Dados Registrados

| Campo | Descrição |
|-------|-----------|
| `audit_id` | Identificador único da operação |
| `timestamp` | Data e hora do processamento |
| `agente` | Agente que processou a requisição |
| `classificacao_risco` | Nível de risco atribuído |
| `confianca_classificacao` | Confiança na classificação automática |
| `score_qa` | Pontuação de qualidade |
| `tempo_execucao_ms` | Tempo de processamento |
| `hash_input` | Hash dos dados de entrada (privacidade) |
| `hash_output` | Hash da minuta gerada |

### Consulta de Auditoria

Para consultar uma operação específica, utilize o `audit_id` retornado na resposta.

### Retenção de Dados

- Logs de auditoria: 5 anos
- Dados de entrada/saída: Não armazenados (apenas hashes)
- Métricas agregadas: Indefinido

---

## 9. Perguntas Frequentes

### Geral

**P: O sistema pode decidir casos sozinho?**
> R: Não. O Lex Intelligentia gera sugestões de minutas que devem ser obrigatoriamente revisadas e aprovadas pelo magistrado. A decisão final é sempre humana.

**P: O sistema acessa processos do PJe/e-SAJ?**
> R: Não. O sistema recebe apenas os dados que você envia via API. Não há integração direta com sistemas processuais.

**P: As minutas são armazenadas?**
> R: Não. Apenas hashes são mantidos para auditoria. O conteúdo não é armazenado.

### Qualidade

**P: O que significa um score baixo?**
> R: Um score baixo indica que a minuta pode ter lacunas na estrutura, fundamentação ou dispositivo. Recomenda-se revisão mais cuidadosa ou reenvio com dados mais completos.

**P: Posso melhorar o score reenviando?**
> R: Sim. Enviar dados mais detalhados geralmente resulta em minutas de melhor qualidade.

**P: Por que o agente escolhido parece errado?**
> R: A classificação automática tem ~92% de precisão. Se o agente parecer inadequado, você pode reenviar com assunto mais específico.

### Técnico

**P: Qual o tempo médio de resposta?**
> R: Entre 3 e 8 segundos, dependendo da complexidade do caso.

**P: Há limite de requisições?**
> R: Consulte o administrador do sistema para limites específicos da sua instalação.

**P: O sistema funciona offline?**
> R: Não. É necessária conexão com os serviços de IA (Claude e Gemini).

---

## 10. Solução de Problemas

### Erros Comuns

#### Erro: "Campos obrigatórios ausentes"

**Causa**: Faltam campos `classe`, `assunto`, `fatos` ou `pedidos`.

**Solução**: Verifique se todos os campos obrigatórios estão presentes na requisição.

```json
{
  "classe": "...",    // Obrigatório
  "assunto": "...",   // Obrigatório
  "fatos": "...",     // Obrigatório
  "pedidos": "..."    // Obrigatório
}
```

#### Erro: "Timeout na requisição"

**Causa**: O processamento excedeu o tempo limite.

**Solução**:
1. Reduza o tamanho do texto enviado
2. Divida casos muito complexos em partes
3. Tente novamente em alguns minutos

#### Erro: "Agente não encontrado"

**Causa**: Problema na classificação automática.

**Solução**: O sistema usará o agente GENERICO automaticamente. Se persistir, contate o suporte.

#### Score muito baixo (< 50)

**Possíveis causas**:
1. Dados de entrada incompletos ou vagos
2. Caso atípico não coberto pelos agentes
3. Conflito entre pedidos e fatos

**Soluções**:
1. Reenvie com mais detalhes
2. Verifique coerência entre fatos e pedidos
3. Considere usar a minuta como base para elaboração manual

### Contato para Suporte

- **Técnico**: suporte@lex-intelligentia.gov.br
- **Dúvidas Jurídicas**: juridico@lex-intelligentia.gov.br
- **Documentação**: github.com/[org]/superagents-judge

---

## Anexo: Referência Rápida

### Requisição Mínima

```bash
curl -X POST https://servidor/webhook/lex-intelligentia \
  -H "Content-Type: application/json" \
  -d '{"classe":"...","assunto":"...","fatos":"...","pedidos":"..."}'
```

### Interpretação Rápida da Resposta

| Se você receber... | Significa que... | Você deve... |
|--------------------|------------------|--------------|
| `score >= 85` + `risco: BAIXO` | Minuta de alta qualidade | Revisar normalmente |
| `score 70-84` + `risco: MEDIO` | Minuta adequada | Revisar com atenção |
| `score < 70` + `risco: ALTO/CRITICO` | Possíveis problemas | Revisar detalhadamente |
| `agente: GENERICO` | Caso não classificado | Verificar adequação |

### Checklist de Revisão

- [ ] Relatório reflete corretamente os fatos do processo?
- [ ] Fundamentação cita legislação e jurisprudência aplicáveis?
- [ ] Dispositivo responde a todos os pedidos?
- [ ] Valores e percentuais estão corretos?
- [ ] Custas e honorários estão adequados?
- [ ] Não há marcadores [REVISAR] pendentes?

---

*Lex Intelligentia Judiciário v2.6.0 - CNJ 615/2025*
*2ª Vara Cível de Cariacica/ES*
