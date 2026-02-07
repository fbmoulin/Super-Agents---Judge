'use client'

import { useState, useCallback } from 'react'
import { FileText, HelpCircle, Loader2, Play } from 'lucide-react'
import type { TestCaseInput as TestCaseInputType } from '@/types/agent-builder'

interface TestCaseInputProps {
  onSubmit: (testCase: TestCaseInputType) => void
  isLoading?: boolean
  disabled?: boolean
}

// Example test cases for quick testing
const exampleCases = [
  {
    name: 'Bancário - Revisão de Contrato',
    testCase: {
      fatos: `O autor celebrou contrato de financiamento de veículo com o banco réu em 01/2023.
Alega cobrança de juros abusivos acima da média de mercado e capitalização indevida.
O valor financiado foi de R$ 50.000,00 com parcelas de R$ 1.500,00 mensais em 48 meses.`,
      questoes: `1. Os juros cobrados são abusivos?
2. Há capitalização indevida de juros?
3. O contrato deve ser revisado?`,
      pedidos: `1. Revisão das cláusulas contratuais
2. Limitação dos juros à média de mercado
3. Recálculo das prestações
4. Devolução dos valores pagos a maior`,
    },
  },
  {
    name: 'Consumidor - Negativação Indevida',
    testCase: {
      fatos: `A autora teve seu nome inscrito nos cadastros de inadimplentes por dívida que alega já ter quitado.
A negativação perdurou por 6 meses causando constrangimento e impedindo acesso a crédito.
A empresa ré não comprovou a legitimidade da cobrança.`,
      questoes: `1. A negativação foi indevida?
2. Houve dano moral?
3. Qual o valor adequado da indenização?`,
      pedidos: `1. Exclusão do nome dos cadastros restritivos
2. Declaração de inexistência do débito
3. Condenação em danos morais de R$ 15.000,00
4. Honorários advocatícios`,
    },
  },
  {
    name: 'Ambiental - Dano Ambiental',
    testCase: {
      fatos: `A empresa ré foi flagrada realizando desmatamento ilegal em área de preservação permanente.
A área desmatada corresponde a 5 hectares de mata atlântica.
O IBAMA lavrou auto de infração e multou a empresa.`,
      questoes: `1. Houve dano ambiental?
2. A responsabilidade é objetiva?
3. Qual a reparação adequada?`,
      pedidos: `1. Condenação à reparação do dano ambiental
2. Obrigação de fazer: recomposição da vegetação
3. Pagamento de indenização por danos difusos
4. Multa diária em caso de descumprimento`,
    },
  },
]

export function TestCaseInput({ onSubmit, isLoading = false, disabled = false }: TestCaseInputProps) {
  const [testCase, setTestCase] = useState<TestCaseInputType>({
    fatos: '',
    questoes: '',
    pedidos: '',
  })

  const [showExamples, setShowExamples] = useState(false)

  const handleChange = useCallback(
    (field: keyof TestCaseInputType, value: string) => {
      setTestCase((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      onSubmit(testCase)
    },
    [testCase, onSubmit]
  )

  const handleLoadExample = useCallback((example: (typeof exampleCases)[0]) => {
    setTestCase(example.testCase)
    setShowExamples(false)
  }, [])

  const isValid = testCase.fatos.trim() && testCase.questoes.trim() && testCase.pedidos.trim()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-zinc-500" />
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Caso de Teste</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <HelpCircle className="h-4 w-4" />
          {showExamples ? 'Ocultar exemplos' : 'Ver exemplos'}
        </button>
      </div>

      {/* Example cases */}
      {showExamples && (
        <div className="grid grid-cols-1 gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-xs text-zinc-500">Clique para carregar um caso de exemplo:</p>
          {exampleCases.map((example) => (
            <button
              key={example.name}
              type="button"
              onClick={() => handleLoadExample(example)}
              disabled={disabled || isLoading}
              className="rounded-md border border-zinc-200 bg-white p-2 text-left text-sm transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
            >
              {example.name}
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fatos */}
        <div className="space-y-2">
          <label
            htmlFor="fatos"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Fatos *
          </label>
          <textarea
            id="fatos"
            value={testCase.fatos}
            onChange={(e) => handleChange('fatos', e.target.value)}
            disabled={disabled || isLoading}
            rows={4}
            placeholder="Descreva os fatos do caso..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
          />
        </div>

        {/* Questões */}
        <div className="space-y-2">
          <label
            htmlFor="questoes"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Questões Jurídicas *
          </label>
          <textarea
            id="questoes"
            value={testCase.questoes}
            onChange={(e) => handleChange('questoes', e.target.value)}
            disabled={disabled || isLoading}
            rows={3}
            placeholder="Liste as questões jurídicas a serem analisadas..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
          />
        </div>

        {/* Pedidos */}
        <div className="space-y-2">
          <label
            htmlFor="pedidos"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Pedidos *
          </label>
          <textarea
            id="pedidos"
            value={testCase.pedidos}
            onChange={(e) => handleChange('pedidos', e.target.value)}
            disabled={disabled || isLoading}
            rows={3}
            placeholder="Liste os pedidos do autor..."
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-800"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={disabled || isLoading || !isValid}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Executando teste...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Executar Teste
            </>
          )}
        </button>
      </form>

      {/* Info */}
      <p className="text-xs text-zinc-500">
        O teste irá executar o agente com o caso informado e calcular métricas de qualidade
        automaticamente.
      </p>
    </div>
  )
}
