import { NextRequest, NextResponse } from 'next/server'
import {
  calculateQualityScores,
  type AgentDefinition,
  type TestCaseInput,
  type CompareAgentsResponse,
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

  return lines.join('\n')
}

async function runAgent(
  agent: AgentDefinition,
  testCase: TestCaseInput
): Promise<SandboxTestResponse> {
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

Gere a minuta completa seguindo a estrutura obrigatória (I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO).`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
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

  const textContent = message.content.find((c) => c.type === 'text')
  if (!textContent || !textContent.text) {
    throw new Error('No text content in response')
  }

  const minuta = textContent.text
  const palavras = minuta.split(/\s+/).filter((w: string) => w.length > 0).length
  const qualityScores = calculateQualityScores(minuta, agent)
  const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0)

  return {
    output: { minuta, palavras },
    qualityScores,
    metrics: {
      executionTimeMs,
      tokensUsed,
      model: 'claude-sonnet-4-20250514',
    },
    runId: `run_${Date.now().toString(36)}`,
  }
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
    const { agentA, agentB, testCase } = body as {
      agentA: AgentDefinition
      agentB: AgentDefinition
      testCase: TestCaseInput
    }

    if (!agentA || !agentB || !testCase) {
      return NextResponse.json(
        { error: 'agentA, agentB, and testCase are required' },
        { status: 400 }
      )
    }

    // Run both agents in parallel
    const [runA, runB] = await Promise.all([
      runAgent(agentA, testCase),
      runAgent(agentB, testCase),
    ])

    // Calculate comparison
    const scoreDiff = runA.qualityScores.overall - runB.qualityScores.overall
    let winner: 'A' | 'B' | 'tie'
    let analysis: string

    if (Math.abs(scoreDiff) < 5) {
      winner = 'tie'
      analysis = 'Os dois agentes apresentaram desempenho similar neste caso.'
    } else if (scoreDiff > 0) {
      winner = 'A'
      analysis = `O agente A (${agentA.titulo}) obteve score ${scoreDiff} pontos maior.`
    } else {
      winner = 'B'
      analysis = `O agente B (${agentB.titulo}) obteve score ${Math.abs(scoreDiff)} pontos maior.`
    }

    // Add detailed analysis
    const improvements: string[] = []

    if (runA.qualityScores.structure !== runB.qualityScores.structure) {
      const better = runA.qualityScores.structure > runB.qualityScores.structure ? 'A' : 'B'
      improvements.push(`Estrutura: Agente ${better} teve melhor estruturação`)
    }

    if (runA.qualityScores.citation !== runB.qualityScores.citation) {
      const better = runA.qualityScores.citation > runB.qualityScores.citation ? 'A' : 'B'
      improvements.push(`Citações: Agente ${better} citou mais adequadamente`)
    }

    if (runA.qualityScores.reasoning !== runB.qualityScores.reasoning) {
      const better = runA.qualityScores.reasoning > runB.qualityScores.reasoning ? 'A' : 'B'
      improvements.push(`Raciocínio: Agente ${better} apresentou melhor fundamentação`)
    }

    if (improvements.length > 0) {
      analysis += '\n\nDiferenças:\n' + improvements.map((i) => `• ${i}`).join('\n')
    }

    const responseData: CompareAgentsResponse = {
      runA,
      runB,
      comparison: {
        scoreDiff,
        winner,
        analysis,
      },
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Compare agents error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compare agents' },
      { status: 500 }
    )
  }
}
