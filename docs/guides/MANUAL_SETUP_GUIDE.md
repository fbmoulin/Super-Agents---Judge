# Guia de Configuração Manual - Phase 3.1 & 4.0

> **Tempo estimado:** 15-20 minutos
> **Pré-requisitos:** Acesso ao n8n Cloud e conta Upstash (ou criar uma)

---

## Parte 1: Configurar n8n Cloud (Phase 3.1)

### 1.1 Acessar n8n Cloud

1. Abra o navegador e acesse:
   ```
   https://lexintel.app.n8n.cloud
   ```

2. Faça login com suas credenciais

3. Após login, você verá o dashboard principal do n8n

---

### 1.2 Adicionar Variáveis de Ambiente

1. **Navegar para Settings:**
   - Clique no ícone de engrenagem (⚙️) no canto inferior esquerdo
   - Ou acesse diretamente: `Settings`

2. **Acessar Variables:**
   - No menu lateral, clique em `Variables`
   - Você verá a lista de variáveis existentes (pode estar vazia)

3. **Adicionar SUPABASE_URL:**
   - Clique no botão `+ Add Variable` ou `Create Variable`
   - Preencha:
     ```
     Key:   SUPABASE_URL
     Value: https://uxhfwlerodittdmrcgnp.supabase.co
     ```
   - Clique `Save` ou `Create`

4. **Adicionar SUPABASE_ANON_KEY:**
   - Clique novamente em `+ Add Variable`
   - Preencha:
     ```
     Key:   SUPABASE_ANON_KEY
     Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aGZ3bGVyb2RpdHRkbXJjZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjEwNDYsImV4cCI6MjA4MzQ5NzA0Nn0.C8_ouc3D2eRgpjkbfifnfpSwIK8ZIiYL-tbDDLZgUek
     ```
   - Clique `Save` ou `Create`

5. **Verificar:**
   - Ambas variáveis devem aparecer na lista:
     - ✅ `SUPABASE_URL`
     - ✅ `SUPABASE_ANON_KEY`

---

### 1.3 Importar Workflow v3.1 (se necessário)

> **Nota:** Se o workflow já está no n8n Cloud, pule para a seção 1.4

1. **Baixar o arquivo:**
   - O arquivo está em: `n8n_workflow_v3.1_metrics.json`

2. **Importar no n8n:**
   - No n8n Cloud, clique em `Workflows` no menu lateral
   - Clique no botão `...` ou menu de opções
   - Selecione `Import from File`
   - Selecione o arquivo `n8n_workflow_v3.1_metrics.json`

3. **Ativar o workflow:**
   - Abra o workflow importado
   - No canto superior direito, toggle o switch para `Active`

---

### 1.4 Verificar Configuração

1. **Testar conexão (opcional):**
   - Abra o workflow
   - Encontre o node `Metrics Logger` (ou similar)
   - Clique no node e verifique se as variáveis estão referenciadas:
     - `{{ $env.SUPABASE_URL }}`
     - `{{ $env.SUPABASE_ANON_KEY }}`

2. **Checar webhook URL:**
   - O webhook deve estar em:
     ```
     https://lexintel.app.n8n.cloud/webhook/lex-intelligentia-agentes
     ```

---

## Parte 2: Configurar Redis/Upstash (Phase 4.0)

### 2.1 Criar Conta Upstash (se não tiver)

1. Acesse: https://console.upstash.com

2. Clique em `Sign Up` ou faça login com:
   - GitHub
   - Google
   - Email

---

### 2.2 Criar Database Redis

1. **No dashboard Upstash:**
   - Clique em `Create Database` ou `+ New Database`

2. **Configurar o database:**
   ```
   Name: lex-intelligentia-cache
   Type: Regional (recomendado) ou Global
   Region: US-East-1 (mais próximo do n8n Cloud)
   ```

3. **Opções avançadas (deixar padrão):**
   - TLS: Enabled ✅
   - Eviction: Enabled ✅

4. **Clique em `Create`**

---

### 2.3 Copiar Credenciais

Após criar o database, você verá a página de detalhes:

1. **Localizar REST API:**
   - Role para baixo até encontrar `REST API` ou `HTTP API`

2. **Copiar as credenciais:**

   ```
   UPSTASH_REDIS_REST_URL
   ─────────────────────────────────────
   https://prepared-termite-12345.upstash.io

   UPSTASH_REDIS_REST_TOKEN
   ─────────────────────────────────────
   AXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Guardar temporariamente:**
   - Anote essas duas informações (vamos usar no próximo passo)

---

### 2.4 Adicionar Redis ao n8n Cloud

1. **Voltar ao n8n Cloud:**
   ```
   https://lexintel.app.n8n.cloud
   ```

2. **Ir para Settings → Variables**

3. **Adicionar REDIS_REST_URL:**
   ```
   Key:   REDIS_REST_URL
   Value: https://prepared-termite-12345.upstash.io
   ```
   (substitua pela sua URL real)

4. **Adicionar REDIS_REST_TOKEN:**
   ```
   Key:   REDIS_REST_TOKEN
   Value: AXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   (substitua pelo seu token real)

5. **Verificar:**
   - Agora você deve ter 4 variáveis:
     - ✅ `SUPABASE_URL`
     - ✅ `SUPABASE_ANON_KEY`
     - ✅ `REDIS_REST_URL`
     - ✅ `REDIS_REST_TOKEN`

---

## Parte 3: Verificação Final

### Checklist de Configuração

| Item | Status |
|------|--------|
| n8n Cloud - SUPABASE_URL configurado | ⬜ |
| n8n Cloud - SUPABASE_ANON_KEY configurado | ⬜ |
| n8n Cloud - Workflow v3.1 importado e ativo | ⬜ |
| Upstash - Database Redis criado | ⬜ |
| n8n Cloud - REDIS_REST_URL configurado | ⬜ |
| n8n Cloud - REDIS_REST_TOKEN configurado | ⬜ |

---

## Parte 4: Teste Rápido (Opcional)

### Testar Supabase Connection

Você pode testar a conexão Supabase diretamente no terminal:

```bash
curl -X GET "https://uxhfwlerodittdmrcgnp.supabase.co/rest/v1/executions?limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aGZ3bGVyb2RpdHRkbXJjZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjEwNDYsImV4cCI6MjA4MzQ5NzA0Nn0.C8_ouc3D2eRgpjkbfifnfpSwIK8ZIiYL-tbDDLZgUek" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4aGZ3bGVyb2RpdHRkbXJjZ25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjEwNDYsImV4cCI6MjA4MzQ5NzA0Nn0.C8_ouc3D2eRgpjkbfifnfpSwIK8ZIiYL-tbDDLZgUek"
```

**Resposta esperada:** `[]` ou lista de executions

### Testar Redis Connection

Após configurar o Upstash, teste com (substitua pelos seus valores):

```bash
curl "https://YOUR-URL.upstash.io/set/test/hello" \
  -H "Authorization: Bearer YOUR-TOKEN"

curl "https://YOUR-URL.upstash.io/get/test" \
  -H "Authorization: Bearer YOUR-TOKEN"
```

**Resposta esperada:** `{"result":"OK"}` e depois `{"result":"hello"}`

---

## Troubleshooting

### Problema: Variável não aparece no workflow

**Solução:** Após adicionar variáveis, pode ser necessário:
1. Salvar o workflow
2. Desativar e reativar o workflow
3. Ou fazer refresh na página

### Problema: Erro 401 no Supabase

**Causa:** Token inválido ou expirado
**Solução:** Verificar se copiou o SUPABASE_ANON_KEY completo (é bem longo)

### Problema: Upstash não conecta

**Causa:** Região muito distante ou firewall
**Solução:**
1. Verificar se o database está na região correta
2. Testar com curl no terminal primeiro

---

## Próximos Passos

Após completar este guia, informe:

```
"Configuração manual concluída"
```

Eu então:
1. Executarei o teste end-to-end
2. Criarei os nodes de cache no workflow
3. Commitar a versão 4.0

---

*Guia criado: 2026-01-25 | Versão: 1.0*
