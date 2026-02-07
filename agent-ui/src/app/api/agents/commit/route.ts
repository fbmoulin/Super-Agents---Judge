import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type { AgentDefinition, CommitAgentResponse } from '@/types/agent-builder'

// Path to system prompts file (relative to project root)
const SYSTEM_PROMPTS_PATH = path.join(
  process.cwd(),
  '..',
  'config',
  'prompts',
  'system_prompts.json'
)

interface SystemPrompt {
  titulo: string
  funcao: string
  regras: string[]
  sumulas: string[]
  baseLegal?: string[]
  parametros?: Record<string, { min: number; max: number; description?: string }>
}

interface SystemPromptsFile {
  [key: string]: SystemPrompt
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { agent, message } = body as {
      agent: AgentDefinition
      message?: string
    }

    if (!agent || !agent.id) {
      return NextResponse.json(
        { error: 'Agent is required' },
        { status: 400 }
      )
    }

    // Validate agent has minimum requirements
    if (!agent.titulo || !agent.regras || agent.regras.length === 0) {
      return NextResponse.json(
        { error: 'Agent must have titulo and at least one rule' },
        { status: 400 }
      )
    }

    // Read current system prompts file
    let systemPrompts: SystemPromptsFile = {}

    try {
      const fileContent = await fs.readFile(SYSTEM_PROMPTS_PATH, 'utf-8')
      systemPrompts = JSON.parse(fileContent)
    } catch (err) {
      // File doesn't exist or is invalid, start with empty object
      console.warn('Could not read system_prompts.json, creating new:', err)
    }

    // Convert AgentDefinition to SystemPrompt format
    const systemPrompt: SystemPrompt = {
      titulo: agent.titulo,
      funcao: agent.funcao,
      regras: agent.regras,
      sumulas: agent.sumulas,
    }

    if (agent.baseLegal && agent.baseLegal.length > 0) {
      systemPrompt.baseLegal = agent.baseLegal
    }

    if (agent.parametros && Object.keys(agent.parametros).length > 0) {
      systemPrompt.parametros = agent.parametros
    }

    // Check if agent already exists
    const existingAgent = systemPrompts[agent.id]
    const isUpdate = !!existingAgent

    // Determine version
    let newVersion = agent.version
    if (isUpdate) {
      // Increment patch version
      const [major, minor, patch] = agent.version.split('.').map(Number)
      newVersion = `${major}.${minor}.${patch + 1}`
    }

    // Add agent to system prompts
    systemPrompts[agent.id] = systemPrompt

    // Write updated file
    await fs.writeFile(
      SYSTEM_PROMPTS_PATH,
      JSON.stringify(systemPrompts, null, 2),
      'utf-8'
    )

    // Log the commit
    console.log(
      `Agent ${agent.id} ${isUpdate ? 'updated' : 'created'} at ${new Date().toISOString()}`
    )
    if (message) {
      console.log(`Commit message: ${message}`)
    }

    const response: CommitAgentResponse = {
      success: true,
      agentId: agent.id,
      version: newVersion,
      message: isUpdate
        ? `Agente ${agent.id} atualizado para versão ${newVersion}`
        : `Agente ${agent.id} criado com versão ${newVersion}`,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Commit agent error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to commit agent',
      },
      { status: 500 }
    )
  }
}

// GET - List all committed agents
export async function GET() {
  try {
    const fileContent = await fs.readFile(SYSTEM_PROMPTS_PATH, 'utf-8')
    const systemPrompts: SystemPromptsFile = JSON.parse(fileContent)

    const agents = Object.entries(systemPrompts).map(([id, prompt]) => ({
      id,
      titulo: prompt.titulo,
      funcao: prompt.funcao,
      regrasCount: prompt.regras?.length || 0,
      sumulasCount: prompt.sumulas?.length || 0,
    }))

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Get agents error:', error)
    return NextResponse.json({ agents: [] })
  }
}
