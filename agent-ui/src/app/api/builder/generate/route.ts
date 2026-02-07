import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// Knowledge base data (simplified - in production, load from files)
const sumulasData: Record<string, string[]> = {
  bancario: ['297', '381', '382', '379', '539', '565', '603'],
  consumidor: ['297', '469', '302', '608', '609'],
  saude: ['302', '469', '597', '608', '609'],
  ambiental: ['629', '623', '613'],
  trabalhista: ['331', '368', '443', '444'],
  previdenciario: ['111', '149', '563'],
  tributario: ['546', '555', '560'],
  imobiliario: ['239', '308', '478'],
}

const baseLegalData: Record<string, string[]> = {
  bancario: [
    'Código de Defesa do Consumidor (Lei 8.078/90)',
    'Código Civil (Lei 10.406/02)',
    'Lei 4.595/64 (Sistema Financeiro)',
  ],
  consumidor: [
    'Código de Defesa do Consumidor (Lei 8.078/90)',
    'Código Civil (Lei 10.406/02)',
  ],
  saude: [
    'Lei 9.656/98 (Planos de Saúde)',
    'Código de Defesa do Consumidor (Lei 8.078/90)',
    'Resolução ANS 428/2017',
  ],
  ambiental: [
    'Lei 9.605/98 (Crimes Ambientais)',
    'Lei 6.938/81 (Política Nacional do Meio Ambiente)',
    'Art. 225 da Constituição Federal',
    'Código Florestal (Lei 12.651/12)',
  ],
  trabalhista: [
    'CLT (Decreto-Lei 5.452/43)',
    'Art. 7º da Constituição Federal',
    'Lei 13.467/17 (Reforma Trabalhista)',
  ],
  previdenciario: [
    'Lei 8.213/91 (Plano de Benefícios)',
    'Lei 8.212/91 (Custeio da Seguridade)',
    'Art. 201-202 da Constituição Federal',
  ],
  tributario: [
    'Código Tributário Nacional (Lei 5.172/66)',
    'Lei 6.830/80 (Execução Fiscal)',
    'Art. 145-162 da Constituição Federal',
  ],
  imobiliario: [
    'Código Civil (Lei 10.406/02)',
    'Lei 8.245/91 (Locações)',
    'Lei 10.931/04 (Alienação Fiduciária)',
  ],
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>
  usage?: { input_tokens: number; output_tokens: number }
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
    const { theme, context } = body

    if (!theme || typeof theme !== 'string') {
      return NextResponse.json(
        { error: 'Theme is required' },
        { status: 400 }
      )
    }

    // Identify domain from theme
    const themeLower = theme.toLowerCase()
    let domain = 'generico'

    if (themeLower.includes('banco') || themeLower.includes('bancário') || themeLower.includes('financ')) {
      domain = 'bancario'
    } else if (themeLower.includes('consumidor') || themeLower.includes('consumo')) {
      domain = 'consumidor'
    } else if (themeLower.includes('saúde') || themeLower.includes('saude') || themeLower.includes('plano')) {
      domain = 'saude'
    } else if (themeLower.includes('ambiental') || themeLower.includes('meio ambiente')) {
      domain = 'ambiental'
    } else if (themeLower.includes('trabalh') || themeLower.includes('trabalhista')) {
      domain = 'trabalhista'
    } else if (themeLower.includes('previdenci') || themeLower.includes('inss') || themeLower.includes('aposentadoria')) {
      domain = 'previdenciario'
    } else if (themeLower.includes('tributár') || themeLower.includes('tributar') || themeLower.includes('fiscal')) {
      domain = 'tributario'
    } else if (themeLower.includes('imobiliár') || themeLower.includes('imobiliar') || themeLower.includes('locação')) {
      domain = 'imobiliario'
    }

    // Get relevant súmulas and base legal
    const relevantSumulas = sumulasData[domain] || []
    const relevantBaseLegal = baseLegalData[domain] || []

    const systemPrompt = `Você é um especialista em criação de agentes judiciais para o sistema Lex Intelligentia.
Sua tarefa é gerar a definição de um novo agente especializado em uma área do direito.

O agente deve seguir estas diretrizes:
1. Gerar minutas de decisões/sentenças na área específica
2. Seguir a estrutura: I-RELATÓRIO, II-FUNDAMENTAÇÃO, III-DISPOSITIVO
3. Citar súmulas e legislação relevantes
4. Ser objetivo e fundamentado

Súmulas disponíveis para o domínio "${domain}": ${relevantSumulas.join(', ')}
Base legal sugerida: ${relevantBaseLegal.join('; ')}

Responda APENAS em JSON válido, sem markdown ou explicações adicionais.`

    const userPrompt = `Crie a definição de um agente judicial para: "${theme}"
${context ? `Contexto adicional: ${context}` : ''}

Responda com um JSON no seguinte formato:
{
  "titulo": "AGENTE JUDICIAL: [ÁREA]",
  "funcao": "Descrição da função do agente",
  "regras": ["Regra 1", "Regra 2", ...],
  "sumulas": ["número1", "número2", ...],
  "baseLegal": ["Lei X", "Art. Y", ...],
  "parametros": {
    "nomeParametro": { "min": 0, "max": 0, "description": "..." }
  },
  "tags": ["tag1", "tag2"],
  "description": "Descrição adicional"
}

Inclua de 5 a 8 regras específicas para a área.
Selecione as súmulas mais relevantes da lista disponível.
Adicione base legal específica além das sugeridas se necessário.
Inclua parâmetros de valores quando aplicável (ex: danos morais, multas).`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

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

    // Parse JSON from response
    let agentData
    try {
      // Try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      agentData = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw response:', textContent.text)
      throw new Error('Failed to parse agent definition from AI response')
    }

    // Build suggested súmulas with full info
    const suggestedSumulas = (agentData.sumulas || []).map((numero: string) => ({
      numero,
      texto: `Súmula ${numero}`, // In production, fetch from sumulas.json
      relevance: 0.9,
    }))

    return NextResponse.json({
      agent: {
        titulo: agentData.titulo,
        funcao: agentData.funcao,
        regras: agentData.regras || [],
        sumulas: agentData.sumulas || [],
        baseLegal: agentData.baseLegal || relevantBaseLegal,
        parametros: agentData.parametros || {},
        tags: agentData.tags || [domain],
        description: agentData.description || '',
      },
      suggestedSumulas,
      confidence: 0.85,
    })
  } catch (error) {
    console.error('Generate agent error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate agent' },
      { status: 500 }
    )
  }
}
