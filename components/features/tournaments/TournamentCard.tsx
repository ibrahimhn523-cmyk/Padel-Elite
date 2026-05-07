import Link from 'next/link'
import type { Tournament } from '@/lib/queries/tournaments'

type Props = { tournament: Tournament; href: string }

const COVERS: Record<string, string> = {
  'ذهبية':  'linear-gradient(135deg, #78350F 0%, #F59E0B 50%, #92400E 100%)',
  'فضية':   'linear-gradient(135deg, #1E293B 0%, #94A3B8 50%, #334155 100%)',
  'برونزية':'linear-gradient(135deg, #292524 0%, #CD7C3C 50%, #431407 100%)',
}

const CAT_COLOR: Record<string, string> = {
  'ذهبية': 'var(--gold)',
  'فضية':  'var(--silver)',
  'برونزية':'var(--bronze)',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة',          color: 'var(--text-3)' },
  open:  { label: 'التسجيل مفتوح',  color: 'var(--accent)' },
  live:  { label: '● مباشر الآن',   color: '#EF4444'       },
  done:  { label: 'منتهية',          color: 'var(--text-3)' },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })
}

export function TournamentCard({ tournament: t, href }: Props) {
  const cover  = t.cover_style ?? COVERS[t.category] ?? COVERS['فضية']
  const cat    = CAT_COLOR[t.category] ?? 'var(--text-2)'
  const status = STATUS_CONFIG[t.status]

  return (
    <Link href={href} style={s.card}>
      {/* ── Cover ── */}
      <div style={{ ...s.cover, background: cover }}>
        <div style={s.coverInner}>
          <span style={{ ...s.catBadge, color: '#000', background: cat }}>
            {t.category}
          </span>
          {t.logo_url && (
            <img src={t.logo_url} alt="" style={s.logo} />
          )}
        </div>
        <h3 style={s.name}>{t.name}</h3>
      </div>

      {/* ── Body ── */}
      <div style={s.body}>
        <div style={s.topRow}>
          <span style={{ ...s.statusLabel, color: status.color }}>
            {status.label}
          </span>
          {t.prize && <span style={s.prize}>{t.prize}</span>}
        </div>

        {(t.start_date || t.end_date) && (
          <div style={s.meta}>
            <span style={s.metaIcon}>📅</span>
            <span>
              {t.start_date ? fmt(t.start_date) : ''}
              {t.end_date   ? ` — ${fmt(t.end_date)}` : ''}
            </span>
          </div>
        )}
        {t.venue && (
          <div style={s.meta}>
            <span style={s.metaIcon}>📍</span>
            <span>{t.venue}</span>
          </div>
        )}
        <div style={s.playersRow}>
          <span style={s.playersLabel}>عدد اللاعبين</span>
          <span style={s.playersMax}>{t.max_players}</span>
        </div>
      </div>
    </Link>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    display:       'flex',
    flexDirection: 'column',
    background:    'var(--surface)',
    border:        '1px solid var(--border)',
    borderRadius:  'var(--radius-lg)',
    overflow:      'hidden',
    textDecoration:'none',
    transition:    'border-color 0.15s, transform 0.15s',
    cursor:        'pointer',
  },
  cover: {
    position:  'relative',
    padding:   '1.25rem',
    minHeight: '110px',
    display:   'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  coverInner: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
  },
  catBadge: {
    fontSize:     '0.6875rem',
    fontWeight:   700,
    padding:      '3px 8px',
    borderRadius: '99px',
    letterSpacing:'0.03em',
  },
  logo: {
    width: 32, height: 32,
    borderRadius: '50%',
    objectFit: 'cover',
    background: 'rgba(0,0,0,0.3)',
  },
  name: {
    fontSize:     '1.0625rem',
    fontWeight:   800,
    color:        '#fff',
    margin:       0,
    letterSpacing:'-0.02em',
    textShadow:   '0 1px 4px rgba(0,0,0,0.4)',
  },
  body: {
    padding:       '0.875rem 1rem',
    display:       'flex',
    flexDirection: 'column',
    gap:           '0.375rem',
  },
  topRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   '0.25rem',
  },
  statusLabel: {
    fontSize:   '0.75rem',
    fontWeight: 600,
  },
  prize: {
    fontSize:   '0.8125rem',
    fontWeight: 700,
    color:      'var(--gold)',
  },
  meta: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.375rem',
    fontSize:   '0.8125rem',
    color:      'var(--text-2)',
  },
  metaIcon: { fontSize: '0.75rem' },
  playersRow: {
    display:        'flex',
    justifyContent: 'space-between',
    marginTop:      '0.25rem',
    paddingTop:     '0.5rem',
    borderTop:      '1px solid var(--border)',
  },
  playersLabel: { fontSize: '0.75rem', color: 'var(--text-3)' },
  playersMax:   { fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)' },
}
