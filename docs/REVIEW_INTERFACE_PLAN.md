# Plano de Melhoria: Interface de Revisão Humana

**Data:** 2026-01-14
**Versão:** 1.0
**Autor:** Gemini Agent

---

## 1. Objetivo

Projetar e planejar uma interface de usuário aprimorada para a revisão humana das minutas judiciais geradas pelo sistema Lex Intelligentia. A meta é otimizar a eficiência da revisão, garantir a segurança e o compliance (CNJ 615/2025), e proporcionar uma experiência intuitiva para magistrados e assessores.

---

## 2. Princípios de Design e UX (User Experience)

*   **Transparência:** Deixar claro quais partes do texto foram geradas pela IA e quais informações foram utilizadas como base.
*   **Eficiência:** Minimizar cliques e navegação, priorizando ações rápidas de revisão e feedback.
*   **Confiança:** Apresentar informações de QA e compliance de forma clara, ajudando o revisor a confiar (ou desconfiar) da minuta.
*   **Feedback Loop:** Facilitar a coleta de feedback para o aprimoramento contínuo dos modelos.
*   **Simplicidade:** Manter a interface limpa e focada na tarefa principal de revisão.

---

## 3. Funcionalidades Chave

### 3.1. Visualização da Minuta

*   **Editor de Texto:** Um editor de texto rico (Rich Text Editor) que permita formatação básica (negrito, itálico, listas) e edições diretas na minuta.
*   **Destaque de IA:** Trechos da minuta gerados pela IA devem ser visualmente destacados (e.g., cor de fundo suave, borda lateral). Isso é crucial para a transparência.
*   **Comparativo de Versões (Diff):** Se o Agente Crítico ou um ciclo de auto-revisão for implementado, a interface deve permitir comparar diferentes rascunhos da minuta.

### 3.2. Informações de Contexto e Fundamentação

*   **Painel Lateral/Expansível de Contexto:** Exibir o `FIRAC` completo (Fatos, Questões, Regras, Aplicação, Conclusão) do processo em um painel adjacente à minuta.
*   **Fundamentação RAG:** Se a funcionalidade RAG estiver ativa, exibir os trechos da jurisprudência ou legislação consultados pelo agente, com links clicáveis para as fontes originais (se disponível). Isso permite que o revisor verifique a fundamentação rapidamente.
*   **Entidades Extraídas:** Mostrar as entidades chave (partes, valores, datas, leis) extraídas pelo Gemini Router para validação. 

### 3.3. Controles de QA e Compliance

*   **Score QA:** Apresentar o `Score QA Final` e a `Classificação de Risco (CNJ 615)` de forma proeminente (e.g., um grande medidor ou selo colorido).
*   **Detalhes do QA:** Uma seção expansível para mostrar os detalhes dos checks estruturais e semânticos (e.g., "Relatório ausente: ❌").
*   **Marcadores de Revisão:** Listar e permitir a navegação rápida para os pontos marcados com `[REVISAR]` pelo agente, facilitando a identificação dos pontos críticos.
*   **Feedback do Agente Crítico:** Se presente, exibir o feedback do Agente Crítico de forma clara, preferencialmente como sugestões aplicáveis ou pontos de atenção.
*   **Flag "Revisado e Aprovado":** Um botão de confirmação (`checkbox` ou `toggle`) que o revisor deve marcar para indicar que a minuta foi humana e minuciosamente revisada e está pronta para uso. Essa ação deve ser auditada.

### 3.4. Ações e Feedback Loop

*   **Botões de Ação:**
    *   `Aprovar Minuta`: Finaliza a revisão e envia para o próximo passo do fluxo (e.g., sistema judicial).
    *   `Rejeitar Minuta`: Marca a minuta como rejeitada, com um campo obrigatório para `Motivo da Rejeição` (feedback crucial para o treinamento futuro).
    *   `Editar e Aprovar`: Permite edições rápidas antes da aprovação.
    *   `Gerar Nova Versão (com feedback)`: Permite que o revisor forneça feedback e solicite ao Agente Gerador uma nova tentativa de minuta.
*   **Coleta de Feedback (Opcional):** Um campo de texto livre ou categorias pré-definidas para coletar feedback sobre a qualidade da minuta (e.g., "Fundamentação fraca", "Erros gramaticais", "Estilo inadequado").

---

## 4. Stack Tecnológica Sugerida (Exemplos)

*   **Frontend Framework:** React, Angular, Vue.js (para flexibilidade e riqueza de UI).
*   **UI Library:** Material UI, Bootstrap, Ant Design (para componentes pré-construídos e aderência a padrões de design modernos).
*   **Backend (para servir a UI e intermediar com n8n):** Node.js (Express/Fastify) ou Python (FastAPI/Django) - opcional, se o n8n não puder servir a interface diretamente.
*   **Autenticação:** Integrar com o sistema de autenticação existente do tribunal ou usar OAuth/OIDC.
*   **Comunicação com n8n:** Utilizar a API de webhooks do n8n para enviar o input para o fluxo e receber a minuta final. As ações de feedback também podem ser enviadas via webhooks para endpoints específicos no n8n que atualizam o Audit Log e/ou disparam novos processos de ajuste.
*   **Hospedagem:** Cloud pública (GCP, AWS, Azure) ou infraestrutura local do tribunal.

---

## 5. Próximos Passos

1.  **Wireframes e Mockups:** Criar esboços visuais da interface para validar o layout e o fluxo de usuário com os magistrados/assessores.
2.  **Definição da API:** Detalhar os endpoints da API que a interface consumirá para interagir com o workflow n8n.
3.  **Desenvolvimento Iterativo:** Iniciar o desenvolvimento da interface, começando pelas funcionalidades essenciais (visualização da minuta, score QA, botão de aprovação).
4.  **Integração com Audit Log:** Garantir que todas as ações de revisão (aprovação, rejeição, edições) sejam devidamente registradas no Audit Log para compliance e análise de performance.
5.  **Testes de Usabilidade:** Realizar testes com usuários reais (magistrados/assessores) para coletar feedback e refinar a interface.
