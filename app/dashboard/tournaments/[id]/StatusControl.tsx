'use client'

import { useState, useTransition } from 'react'
import { updateTournamentStatus } from '@/lib/actions/tournaments'
import type { TournamentStatus } from '@/lib/queries/tournaments'

const TRANSITIONS: Record<TournamentStatus, { next: TournamentStatus; label: string } | null> = {
  draft: { next: 'open',  label: 'فتح التسجيل' },
  open:  { next: 'live',  label: 'ابدأ البطولة' },
  live:  { next: 'done',  label: 'أنهِ البطولة' },
  done:  null,
}

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: 'مسودة',
  open:  'التسجيل مفتوح',
  live:  'مباشر',
  done:  'منتهية',
}

type Props = { id: string; currentStatus: TournamentStatus }

export function StatusControl({ id, currentStatus }: Props) {
  const [error, setError]   = useState<string | null>(null)
  const [isPending, startT] = useTransition()

  const transition = TRANSITIONS[currentStatus]

  function advance() {
    if (!transition) return
    setError(null)
    startT(async () => {
      const res = await updateTournamentStatus(id, transition.next)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{
        fontSize: '0.75rem', fontWeight: 600,
        padding: '3px 10px', borderRadius: '99px',
        background: 'var(--surface-3)', color: 'var(--text-2)',
      }}>
        {STATUS_LABELS[currentStatus]}
      </span>

      {transition && (
        <button
          onClick={advance}
          disabled={isPending}
          style={{
            padding: '5px 14px',
            background: currentStatus === 'live' ? 'var(--danger)' : 'var(--accent)',
            color: '#000', fontWeight: 700,
            fontSize: '0.8125rem', border: 'none',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? '...' : transition.label}
        </button>
      )}

      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>
      )}
    </div>
  )
}
