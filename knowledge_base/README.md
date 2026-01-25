# Knowledge Base - LEX PROMPTER

Base de conhecimento jurídico para o sistema LEX PROMPTER de geração dinâmica de prompts.

## Estrutura

```
knowledge_base/
├── README.md                 # Este arquivo
├── sumulas.json              # Súmulas STJ/STF
├── temas_repetitivos.json    # Temas Repetitivos com teses
└── domain_mapping.json       # Mapeamento keywords → domínios
```

## Arquivos

### sumulas.json

Base de súmulas do STJ e STF pesquisáveis por domínio e keywords.

```json
{
  "sumulas": {
    "STJ": {
      "297": {
        "texto": "O CDC é aplicável às instituições financeiras",
        "domains": ["bancario", "consumidor"],
        "keywords": ["CDC", "banco", "financeira"]
      }
    }
  }
}
```

**Campos:**
- `texto`: Enunciado completo da súmula
- `domains`: Lista de domínios jurídicos aplicáveis
- `keywords`: Palavras-chave para busca

### temas_repetitivos.json

Temas repetitivos do STJ com teses vinculantes.

```json
{
  "temas": {
    "1368": {
      "tribunal": "STJ",
      "tese": "A taxa SELIC engloba juros e correção monetária...",
      "domains": ["bancario", "obrigacional"],
      "aplicacao": "Correção monetária em débitos civis",
      "detalhamento": { ... }
    }
  }
}
```

**Campos:**
- `tribunal`: STJ ou STF
- `tese`: Texto completo da tese vinculante
- `domains`: Domínios aplicáveis
- `aplicacao`: Descrição do uso
- `detalhamento`: Cenários específicos (quando disponível)

### domain_mapping.json

Mapeamento de palavras-chave para domínios jurídicos.

```json
{
  "domains": {
    "bancario": {
      "keywords": ["empréstimo", "juros", "banco"],
      "template_base": "bancario_base",
      "agente_especializado": "agent_BANCARIO",
      "sumulas_principais": ["297", "382", "539"],
      "temas_principais": ["1368", "972"]
    }
  }
}
```

**Campos:**
- `keywords`: Lista de palavras para identificar o domínio
- `template_base`: Template de prompt base
- `agente_especializado`: Agente n8n correspondente
- `sumulas_principais`: Súmulas mais relevantes
- `temas_principais`: Temas repetitivos mais relevantes
- `base_legal`: Artigos e leis fundamentais (opcional)

## Domínios Disponíveis

| Domínio | Súmulas | Temas | Agente |
|---------|---------|-------|--------|
| bancario | 297, 382, 539, 541, 30, 472, 565 | 1368, 972 | agent_BANCARIO |
| saude | 302, 469, 597, 608, 609 | 952, 1069 | agent_SAUDE_COBERTURA |
| transito | - | 1062 | agent_TRANSITO |
| incorporacao | 543 | 970, 996 | agent_INCORPORACAO |
| usucapiao | 340-STF | 985 | agent_USUCAPIAO |
| execucao | - | - | agent_EXECUCAO |
| locacao | - | - | agent_LOCACAO |
| consumidor | 297, 469 | - | agent_CONSUMIDOR |
| processual | 7 | - | agent_GENERICO |
| direitos_reais | 340-STF | - | agent_GENERICO |
| administrativo | 346-STF, 473-STF | - | agent_GENERICO |
| responsabilidade_civil | 362 | 1062 | agent_GENERICO |
| obrigacional | - | 1368 | agent_GENERICO |

## Como Usar

### Buscar Súmulas por Domínio

```javascript
const sumulas = require('./sumulas.json');
const domain = 'bancario';

Object.entries(sumulas.sumulas.STJ)
  .filter(([num, s]) => s.domains.includes(domain))
  .forEach(([num, s]) => console.log(`Súmula ${num}: ${s.texto}`));
```

### Buscar Temas por Keywords

```javascript
const temas = require('./temas_repetitivos.json');
const keywords = ['correção', 'monetária'];

Object.entries(temas.temas)
  .filter(([num, t]) => keywords.some(k => t.tese.toLowerCase().includes(k)))
  .forEach(([num, t]) => console.log(`Tema ${num}: ${t.tese}`));
```

### Identificar Domínio por Texto

```javascript
const mapping = require('./domain_mapping.json');
const texto = 'empréstimo bancário com juros abusivos';

for (const [domain, config] of Object.entries(mapping.domains)) {
  const match = config.keywords.some(k => texto.toLowerCase().includes(k));
  if (match) console.log(`Domínio identificado: ${domain}`);
}
```

## Manutenção

### Adicionar Nova Súmula

1. Editar `sumulas.json`
2. Adicionar entrada em `STJ` ou `STF`
3. Incluir `texto`, `domains`, `keywords`
4. Executar teste de validação

### Adicionar Novo Tema

1. Editar `temas_repetitivos.json`
2. Adicionar entrada com número do tema
3. Incluir `tribunal`, `tese`, `domains`, `aplicacao`
4. Opcional: adicionar `detalhamento` com cenários

### Adicionar Novo Domínio

1. Editar `domain_mapping.json`
2. Adicionar entrada em `domains`
3. Definir `keywords`, `template_base`, `agente_especializado`
4. Opcional: `sumulas_principais`, `temas_principais`, `base_legal`

## Validação

Execute o script de validação para verificar integridade:

```bash
python3 << 'EOF'
import json

# Load files
with open('sumulas.json') as f: sumulas = json.load(f)
with open('temas_repetitivos.json') as f: temas = json.load(f)
with open('domain_mapping.json') as f: mapping = json.load(f)

# Validate cross-references
all_domains = set(mapping['domains'].keys())
errors = []

for tribunal in sumulas['sumulas'].values():
    for num, s in tribunal.items():
        for dom in s.get('domains', []):
            if dom not in all_domains:
                errors.append(f"Súmula {num}: domínio '{dom}' não existe")

for num, t in temas['temas'].items():
    for dom in t.get('domains', []):
        if dom not in all_domains:
            errors.append(f"Tema {num}: domínio '{dom}' não existe")

print(f"{'✅ Válido' if not errors else '❌ Erros: ' + str(errors)}")
EOF
```

## Fontes

- [STJ - Súmulas](https://www.stj.jus.br/sites/portalp/Jurisprudencia/Sumulas)
- [STJ - Temas Repetitivos](https://processo.stj.jus.br/repetitivos/temas_repetitivos/)
- [STF - Súmulas Vinculantes](https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp)

---

*Última atualização: 2026-01-19*
