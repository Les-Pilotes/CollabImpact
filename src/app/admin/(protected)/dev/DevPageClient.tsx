'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { ScenarioCard } from './ScenarioCard'
import {
  seedParticipants,
  timeTravel,
  markRandomAttendance,
  triggerCron,
  submitFakesFeedbacks,
  resetDevData,
} from './actions'

type StepResult = { ok: boolean; [key: string]: unknown } | null
type StepError = string | null

export function DevPageClient() {
  const [stepResults, setStepResults] = useState<Record<number, StepResult>>({})
  const [stepErrors, setStepErrors] = useState<Record<number, StepError>>({})
  const [log, setLog] = useState<string[]>([])

  const [isResetting, startReset] = useTransition()

  function addLog(msg: string) {
    setLog((prev) => [...prev, msg])
  }

  function makeHandler(step: number, label: string) {
    return (result: StepResult, error: StepError) => {
      setStepResults((prev) => ({ ...prev, [step]: result }))
      setStepErrors((prev) => ({ ...prev, [step]: error }))
      if (result?.ok) {
        addLog(`Étape ${step} — ✓ ${label} — ${JSON.stringify(result)}`)
      } else {
        addLog(`Étape ${step} — ✗ Erreur — ${error ?? JSON.stringify(result)}`)
      }
    }
  }

  const STEPS = [
    {
      step: 1,
      label: '🌱 Seeder 20 participantes',
      description: 'Crée 20 fausses inscrites avec des statuts variés',
      action: () => seedParticipants(20),
    },
    {
      step: 2,
      label: '⏱ Voyager à J-7',
      description: "Décale la date de l'événement à aujourd'hui + 7 jours",
      action: () => timeTravel('j7'),
    },
    {
      step: 3,
      label: '▶️ Lancer le cron J-7',
      description: 'Envoie les emails de rappel J-7 aux inscrites éligibles',
      action: () => triggerCron('j7'),
    },
    {
      step: 4,
      label: '⏱ Voyager à J-2',
      description: "Décale la date de l'événement à aujourd'hui + 2 jours",
      action: () => timeTravel('j2'),
    },
    {
      step: 5,
      label: '▶️ Lancer le cron J-2',
      description: 'Envoie les emails de confirmation J-2 aux inscrites éligibles',
      action: () => triggerCron('j2'),
    },
    {
      step: 6,
      label: '✅ Marquer présentes/absentes',
      description: 'Marque 12 présentes et 3 absentes parmi les confirmées J-2',
      action: () => markRandomAttendance(12, 3),
    },
    {
      step: 7,
      label: '▶️ Lancer le cron Feedback',
      description: 'Envoie les emails de demande de feedback aux présentes',
      action: () => triggerCron('feedback'),
    },
    {
      step: 8,
      label: '📝 Soumettre 8 feedbacks',
      description: 'Génère 8 faux feedbacks pour les présentes',
      action: () => submitFakesFeedbacks(8),
    },
  ]

  function handleReset() {
    if (!window.confirm('Réinitialiser toutes les données de test ? (inscriptions + participantes fictives + tâches)')) return
    startReset(async () => {
      try {
        const result = await resetDevData()
        setStepResults({})
        setStepErrors({})
        addLog(`🧹 Reset — ${result.ok ? '✓ Données effacées' : '✗ Erreur'}`)
      } catch (err) {
        addLog(`🧹 Reset — ✗ Erreur : ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Warning banner */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-sm font-medium text-amber-800">
          ⚠️ Page de développement — non visible en production
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleReset}
          disabled={isResetting}
        >
          {isResetting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Réinitialisation…
            </>
          ) : (
            '🧹 Tout réinitialiser'
          )}
        </Button>
      </div>

      {/* Scenario steps */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-zinc-900">Scénario de test (8 étapes)</h2>
        <div className="space-y-3">
          {STEPS.map(({ step, label, description, action }) => (
            <ScenarioCard
              key={step}
              step={step}
              label={label}
              description={description}
              action={action}
              result={stepResults[step] ?? null}
              error={stepErrors[step] ?? null}
              onResult={makeHandler(step, label)}
            />
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-zinc-900">Actions rapides</h2>
        <div className="space-y-4">
          <QuickSection label="🌱 Participantes">
            <QuickButton label="Seed 20 participantes" action={() => seedParticipants(20)} onLog={addLog} />
          </QuickSection>

          <QuickSection label="⏱ Voyage dans le temps">
            <QuickButton label="J-7" action={() => timeTravel('j7')} onLog={addLog} />
            <QuickButton label="J-2" action={() => timeTravel('j2')} onLog={addLog} />
            <QuickButton label="Jour J" action={() => timeTravel('jour_j')} onLog={addLog} />
            <QuickButton label="J+1" action={() => timeTravel('j_plus_1')} onLog={addLog} />
          </QuickSection>

          <QuickSection label="✅ Émargement">
            <QuickButton label="Marquer présences (12+3)" action={() => markRandomAttendance(12, 3)} onLog={addLog} />
          </QuickSection>

          <QuickSection label="▶️ Crons">
            <QuickButton label="Cron J7" action={() => triggerCron('j7')} onLog={addLog} />
            <QuickButton label="Cron J2" action={() => triggerCron('j2')} onLog={addLog} />
            <QuickButton label="Cron Feedback" action={() => triggerCron('feedback')} onLog={addLog} />
          </QuickSection>

          <QuickSection label="📝 Feedbacks">
            <QuickButton label="8 feedbacks aléatoires" action={() => submitFakesFeedbacks(8)} onLog={addLog} />
          </QuickSection>

          <QuickSection label="🧹 Reset">
            <QuickButton label="Reset toutes les données" action={resetDevData} onLog={addLog} confirm="Réinitialiser toutes les données ?" />
          </QuickSection>
        </div>
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Journal</h2>
            <button onClick={() => setLog([])} className="text-xs text-zinc-400 hover:text-zinc-600">
              Effacer
            </button>
          </div>
          <div className="rounded-xl bg-zinc-900 p-4 font-mono text-xs text-emerald-400 space-y-1 max-h-64 overflow-y-auto">
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Quick helpers ───────────────────────────────────────────────────────────

function QuickSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-52 shrink-0 text-sm font-medium text-zinc-600">{label}</span>
      {children}
    </div>
  )
}

function QuickButton({
  label,
  action,
  onLog,
  confirm: confirmMsg,
}: {
  label: string
  action: () => Promise<{ ok: boolean; [key: string]: unknown }>
  onLog: (msg: string) => void
  confirm?: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    startTransition(async () => {
      try {
        const result = await action()
        onLog(`${label} — ${result.ok ? '✓' : '✗'} ${JSON.stringify(result)}`)
      } catch (err) {
        onLog(`${label} — ✗ Erreur : ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={isPending}>
      {isPending ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {label}
    </Button>
  )
}
