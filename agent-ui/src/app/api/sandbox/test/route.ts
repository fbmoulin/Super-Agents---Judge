import { NextRequest, NextResponse } from 'next/server'
import {
  calculateQualityScores,
  type AgentDefinition,
  type TestCaseInput,
  type SandboxTestResponse,
} from '@/types/agent-builder'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>
  usage?: { input_tokens: number; output_tokens: number }
}

/**
 * Generates the system prompt from an agent definition
 */
function generateSystemPrompt(agent: AgentDefinition): string {
  const lines: string[] = []

  lines.push(`# ${agent.titulo}`)
  lines.push('')

  if (agent.funcao) {
    lines.push(`## Função`)
    lines.push(agent.funcao)
    lines.push('')
  }

  if (agent.regras.length > 0) {
    lines.push(`## Regras Obrigatórias`)
    agent.regras.forEach((regra, index) => {
      lines.push(`${index + 1}. ${regra}`)
    })
    lines.push('')
  }

  if (agent.sumulas.length > 0) {
    lines.push(`## Súmulas Aplicáveis`)
    lines.push(`Súmulas STJ/STF: ${agent.sumulas.join(', ')}`)
    lines.push('')
  }

  if (agent.baseLegal.length > 0) {
    lines.push(`## Base Legal`)
    agent.baseLegal.forEach((base) => {
      lines.push(`- ${base}`)
    })
    lines.push('')
  }

  if (agent.parametros && Object.keys(agent.parametros).length > 0) {
    lines.push(`## Parâmetros de Referência`)
    Object.entries(agent.parametros).forEach(([key, param]) => {
      const formatted = `R$ ${param.min.toLocaleString('pt-BR')} - R$ ${param.max.toLocaleString('pt-BR')}`
      const desc = param.description ? ` (${param.description})` : ''
      lines.push(`- ${key}: ${formatted}${desc}`)
    })
    lines.push('')
  }

  lines.push(`## Estrutura da Minuta`)
  lines.push(`A minuta DEVE seguir a estrutura:`)
  lines.push(`I - RELATÓRIO: Resumo dos fatos e pedidos`)
  lines.push(`II - FUNDAMENTAÇÃO: Análise jurídica com citação de legislação e jurisprudência`)
  lines.push(`III - DISPOSITIVO: Decisão final com determinações específicas`)
  lines.push('')

  lines.push(`## Conformidade`)
  lines.push(`Este agente opera em conformidade com a Resolução CNJ 615/2025.`)
  lines.push(`Todas as minutas geradas requerem supervisão humana obrigatória.`)

  return lines.join('\n')
}

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { agent, testCase } = body as {
      agent: AgentDefinition
      testCase: TestCaseInput
    }

    if (!agent || !testCase) {
      return NextResponse.json(
        { error: 'Agent and testCase are required' },
        { status: 400 }
      )
    }

    if (!testCase.fatos || !testCase.questoes || !testCase.pedidos) {
      return NextResponse.json(
        { error: 'Test case must include fatos, questoes, and pedidos' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    const systemPrompt = generateSystemPrompt(agent)

    const userPrompt = `Analise o caso abaixo e gere uma minuta de decisão/sentença judicial.

## FATOS
${testCase.fatos}

## QUESTÕES JURÍDICAS
${testCase.questoes}

## PEDIDOS
${testCase.pedidos}

---

Gere a minuta completa seguindo a estrutura obrigatória (I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO).
Cite as súmulas e base legal relevantes.
Seja objetivo e fundamentado.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    const executionTimeMs = Date.now() - startTime

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API error: ${response.status}`)
    }

    const message: AnthropicResponse = await response.json()

    // Extract text content
    const textContent = message.content.find((c) => c.type === 'text')
    if (!textContent || !textContent.text) {
      throw new Error('No text content in response')
    }

    const minuta = textContent.text
    const palavras = minuta.split(/\s+/).filter((w: string) => w.length > 0).length

    // Calculate quality scores
    const qualityScores = calculateQualityScores(minuta, agent)

    // Calculate tokens used
    const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)

    const responseData: SandboxTestResponse = {
      output: {
        minuta,
        palavras,
      },
      qualityScores,
      metrics: {
        executionTimeMs,
        tokensUsed,
        model: 'claude-sonnet-4-20250514',
      },
      runId: `run_${Date.now().toString(36)}`,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Sandbox test error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run test' },
      { status: 500 }
    )
  }
}
