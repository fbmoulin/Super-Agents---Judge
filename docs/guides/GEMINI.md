# GEMINI.md - Project Overview: Lex Intelligentia Judiciário

## Directory Overview

This directory contains the configuration, documentation, and workflow definitions for **Lex Intelligentia Judiciário**, a multi-agent AI system designed for the automation of judicial drafts (decisions and sentences). It is a non-code project built to run on the n8n workflow automation platform.

The system's primary goal is to assist a Brazilian Civil Court (2ª Vara Cível de Cariacica/ES) by taking a structured analysis of a legal case (in FIRAC format), routing it to a specialized AI agent, generating a high-quality draft, performing a quality assurance check, and logging the operation for compliance with national regulations (CNJ 615/2025).

The core technologies involved are:
*   **Orchestration:** n8n
*   **AI Models:** Anthropic Claude and Google Gemini
*   **Database:** PostgreSQL (for audit logs)
*   **Deployment:** Docker

## Key Files

*   `n8n_workflow_agentes_especializados_v2.1.json`: This is the main project artifact. It's the n8n workflow file containing the entire automation pipeline, including the semantic router, specialized AI agents, QA checks, and compliance logging.

*   `README_LEX_INTELLIGENTIA.md`: The primary documentation. It provides a comprehensive overview of the system's architecture, the different AI agents, installation steps, and usage instructions.

*   `LexIntelligentia_Judiciario_Prompts_Agentes_Especializados.md`: A critical documentation file that contains the detailed system prompts for each specialized AI agent (e.g., Banking, Consumer Law, Real Estate). These prompts define the personality, rules, and legal knowledge base for each agent.

*   `GUIA_INTEGRACAO_AGENTES.md`: A step-by-step guide explaining how to integrate this workflow into an existing n8n instance that already handles the initial stages of PDF processing and case analysis.

*   `docs/plans/2026-01-14-lex-intelligentia-v2.1-optimization-plan.md`: Details the plan and justification for upgrading the system to version 2.1, focusing on using Google's Gemini 2.5 Flash model for routing and QA to improve quality and reduce operational costs.

*   `init_db_audit_logs.sql`: The SQL script to create the necessary database schema for the audit logs, ensuring compliance with judicial AI regulations.

## Usage

The contents of this directory are intended to be used within an n8n environment.

1.  **Setup:** A running n8n instance is required, along with a PostgreSQL database. The `README.md` provides instructions on how to set up the required infrastructure using Docker.
2.  **Import Workflow:** The main `n8n_workflow_agentes_especializados_v2.1.json` file should be imported into your n8n instance.
3.  **Configuration:** You must configure credentials within n8n for the AI services used:
    *   Anthropic API (for Claude Sonnet 4)
    *   Google AI API (for Gemini 2.5 Flash)
4.  **Integration:** The workflow is triggered via a webhook. The `GUIA_INTEGRACAO_AGENTES.md` explains how to call this webhook from an existing process, passing the required case data (FIRAC analysis).
5.  **Documentation:** The various markdown files should be consulted to understand the system's logic, prompts, and architecture before and during use.
