'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

export type ScenarioStep = {
  step: number
  label: string
  description: string
  action: () => Promise<{ ok: boolean; [key: string]: unknown }>
}

type ScenarioCardProps = ScenarioStep & {
  result: { ok: boolean; [key: string]: unknown } | null
  error: string | null
  onResult: (result: { ok: boolean; [key: string]: unknown } | null, error: string | null) => void
}

export function ScenarioCard({ step, label, description, action, result, error, onResult }: ScenarioCardProps) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await action()
        onResult(res, null)
      } catch (err) {
        onResult(null, err instanceof Error ? err.message : String(err))
      }
    })
  }

  return (
    <div className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      {/* Step number badge */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-orange)] text-sm font-bold text-white">
        {step}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div>
          <p className="font-semibold text-zinc-900">{label}</p>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleClick}
            disabled={isPending}
            variant={result?.ok === true ? 'ghost' : 'default'}
          >
            {isPending ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                En cours…
              </>
            ) : result?.ok === true ? (
              'Refaire'
            ) : (
              'Faire maintenant'
            )}
          </Button>

          {result !== null && !isPending && (
            <span className={`text-sm font-medium ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
              {result.ok ? '✓ Fait' : '✗ Erreur'}
            </span>
          )}

          {error && !isPending && (
            <span className="text-sm font-medium text-red-600">✗ {error}</span>
          )}
        </div>

        {result !== null && !isPending && (
          <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}
