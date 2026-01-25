# MCP da Synta (Synta MCP) — Implantar e Conectar (Windows + Claude Code)

Este guia conecta o **Synta MCP** ao **Claude Code** (ambiente Windows).

## Pré-requisitos

- **Claude Code** instalado e funcionando (`claude` no PATH)
- Uma conta na Synta para provisionar o MCP (API key / onboarding)
- (Opcional, para self-healing) credenciais de login do seu n8n

## 1) Provisionar credenciais (Synta + n8n)

### 1.1) Synta API Key

Na documentação da Synta, o fluxo é:
- Acesse `https://synta.io/mcp`
- Faça login
- Vá na seção **API Key**
- Crie uma nova API key e copie

### 1.2) n8n Instance URL & API Key

Para obter a chave do n8n (conforme o passo-a-passo da Synta):
- Abra sua instância do n8n e faça login
- Vá em **Settings → n8n API**
- Clique em **Create an API Key**, dê um label e clique em **Create**
- Copie e guarde a key (**você não verá novamente**)

## 2) Conectar no Claude Code (recomendado: OAuth)

Na página de instalação da Synta, o método recomendado (OAuth) para Claude Code usa o endpoint:

- `https://mcp.synta.io/mcp`

Execute no PowerShell:

```powershell
claude mcp add --transport http synta-mcp https://mcp.synta.io/mcp
```

## 3) Verificar no Claude Code

Dentro do Claude Code, rode o comando:

- `/mcp`

Isso deve listar o servidor `synta-mcp` carregado.

## 4) Troubleshooting rápido (Windows)

- Se o comando `claude` não existir: confirme a instalação do Claude Code e o PATH.
- Se o MCP não aparecer após adicionar: reinicie o Claude Code e execute `/mcp` novamente.
- Se você estiver usando um modo “API Key” manual, a própria Synta indica que pode exigir **Node.js** e (em alguns casos) **WSL/Git Bash**. Prefira o método OAuth acima.

## Referências

- Synta MCP — Installation: `https://mcp-docs.synta.io/installation`
- Claude Code — MCP: `https://code.claude.com/docs/pt/mcp`

