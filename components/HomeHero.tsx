'use client'

import Image from 'next/image'
import { Pencil } from 'lucide-react'
import { Button } from '@/components'
import type { DatabaseConnection, DatabaseType } from '@/types'

const TYPE_LABEL: Record<DatabaseType, string> = {
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  sqlite: 'SQLite',
  mongodb: 'MongoDB',
  redis: 'Redis',
}

interface HomeHeroProps {
  connections: DatabaseConnection[]
  onNewConnection: () => void
  onImportConfig: () => void
  onSelectConnection: (connection: DatabaseConnection) => void
  onEditConnection: (connection: DatabaseConnection) => void
}

export default function HomeHero({
  connections,
  onNewConnection,
  onImportConfig,
  onSelectConnection,
  onEditConnection,
}: HomeHeroProps) {
  return (
    <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--border)] bg-white/95 p-5 shadow-lg backdrop-blur-xl sm:p-8 lg:p-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="hero-blob bg-[radial-gradient(circle_at_30%_20%,rgba(236,72,153,0.25),transparent_55%)]" />
        <div className="hero-blob hero-blob-delay bg-[radial-gradient(circle_at_80%_30%,rgba(251,191,36,0.22),transparent_55%)]" />
        <div className="hero-blob hero-blob-small bg-[radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.2),transparent_50%)]" />
      </div>
      <div className="grid gap-8 lg:gap-10 lg:grid-cols-[1.1fr_1fr] items-start">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Image src="/assets/logo-box.svg" alt="Velora" width={140} height={40} />
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-100 shadow-sm">
              ⚡ Quick start
            </span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight">
              Connect and run your data fast
            </h2>
            <p className="text-slate-600 leading-relaxed text-balance">
              Open a connection or paste a config. Everything stays on your device.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Badge label={`${connections.length} connections`} active={connections.length > 0} />
            <Badge label="Local-only" active />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CTAButton label="Add connection" onClick={onNewConnection} />
            <CTAButton label="Import config" onClick={onImportConfig} altPalette />
          </div>
        </div>

        <ConnectionShortcuts
          connections={connections}
          onSelectConnection={onSelectConnection}
          onEditConnection={onEditConnection}
        />
      </div>
    </div>
  )
}
function ConnectionShortcuts({
  connections,
  onSelectConnection,
  onEditConnection,
}: {
  connections: DatabaseConnection[]
  onSelectConnection: (connection: DatabaseConnection) => void
  onEditConnection: (connection: DatabaseConnection) => void
}) {
  return (
    <section className="rounded-2xl border border-rose-100 bg-white/80 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Open a connection</h3>
      {connections.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Add a connection and it will show up here.</p>
      ) : (
        <ul className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
          {connections.map((connection) => (
            <li key={connection.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelectConnection(connection)}
                className="min-w-0 flex-1 rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-left transition-colors hover:border-pink-300 hover:bg-rose-50"
              >
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {connection.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-rose-700">
                  {TYPE_LABEL[connection.type]} · {connection.database}
                </span>
              </button>
              <Button
                type="button"
                variant="icon"
                className="text-pink-600 hover:bg-pink-50 hover:text-pink-700"
                title="Edit connection"
                aria-label={`Edit ${connection.name}`}
                onClick={() => onEditConnection(connection)}
              >
                <Pencil size={14} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Badge({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-semibold shadow-sm ${
        active
          ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
          : 'bg-slate-50 border-slate-100 text-slate-400'
      }`}
    >
      {label}
    </span>
  )
}
function CTAButton({
  label,
  onClick,
  altPalette,
}: {
  label: string
  onClick: () => void
  altPalette?: boolean
}) {
  const gradientClass = altPalette
    ? 'from-pink-400 via-rose-400 to-rose-500'
    : 'from-rose-500 via-pink-500 to-pink-400'
  return (
    <Button
      variant="primary"
      onClick={onClick}
      className={`w-full min-w-0 flex-1 justify-center rounded-xl bg-gradient-to-r py-3 text-base font-semibold shadow-md ${gradientClass}`}
    >
      <span className="text-lg leading-none">＋</span> {label}
    </Button>
  )
}
