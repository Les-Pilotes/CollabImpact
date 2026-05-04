import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { DevPageClient } from './DevPageClient'

export const metadata = { title: 'Dev Tools — Admin' }

export default async function DevPage() {
  if (process.env.ENABLE_DEV_PAGE !== 'true' && process.env.NODE_ENV !== 'development') {
    notFound()
  }

  await requireAdmin()

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Outils de développement</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Simulez le cycle complet d&apos;un événement en quelques clics.
        </p>
      </div>
      <DevPageClient />
    </div>
  )
}
