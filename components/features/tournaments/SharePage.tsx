'use client'

import { useState } from 'react'
import type {
  Tournament, Sponsor, MatchWithDetails, Registration, TournamentCategory,
} from '@/lib/queries/tournaments'

type Tab = 'overview' | 'bracket' | 'players' | 'sponsors'

type Props = {
  tournament: Tournament
  matches: MatchWithDetails[]
  registrations: Registration[]
  sponsors: Sponsor[]
  isAdmin?: boolean
}

const COVERS: Record<TournamentCategory, string> = {
  'ذهبية':  'linear-gradient(135deg, #78350F 0%, #F59E0B 100%)',
  'فضية':   'linear-gradient(135deg, #1E293B 0%, #94A3B8 100%)',
  'برونزية':'linear-gradient(135deg, #292524 0%, #CD7C3C 100%)',
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'bracket',  label: 'الجدول'   },
  { id: 'players',  label: 'اللاعبون' },
  { id: 'sponsors', label: 'الرعاة'   },
]

const ROUND_ORDER = ['ربع النهائي', 'نصف النهائي', 'النهائي']

function sortRounds(a: string, b: string) {
  const ia = ROUND_ORDER.indexOf(a)
  const ib = ROUND_ORDER.indexOf(b)
  if (ia !== -1 && ib !== -1) return ia - ib
  if (ia !== -1) return -1
  if (ib !== -1) return 1
  return a.localeCompare(b, 'ar')
}

export function SharePage({ tournament: t, matches, registrations, sponsors, isAdmin }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  const [copied, setCopied] = useState(false)

  const cover = t.cover_style ?? COVERS[t.category]

  function copyLink() {
    navigator.clipboard.writeText(
      `${window.location.origin}/tournament/${t.id}`
    ).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={s.page}>
      {/* ── Hero Cover ── */}
      <div style={{ ...s.hero, background: cover }}>
        <div style={s.heroInner}>
          <div style={s.heroTop}>
            <span style={s.catBadge}>{t.category}</span>
            <StatusBadge status={t.status} />
          </div>
          <h1 style={s.heroTitle}>{t.name}</h1>
          {t.prize && <p style={s.heroPrize}>🏆 {t.prize}</p>}
          <div style={s.heroMeta}>
            {(t.start_date || t.end_date) && (
              <span>📅 {fmt(t.start_date)} {t.end_date ? `— ${fmt(t.end_date)}` : ''}</span>
            )}
            {t.venue && <span>📍 {t.venue}</span>}
            <span>👥 {registrations.length} / {t.max_players}</span>
          </div>
        </div>
        <button onClick={copyLink} style={s.copyBtn}>
          {copied ? '✓ تم النسخ' : '🔗 نسخ رابط المشاركة'}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={s.tabBar} dir="rtl">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{ ...s.tab, ...(tab === id ? s.tabActive : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={s.content} dir="rtl">
        {tab === 'overview'  && <OverviewTab t={t} />}
        {tab === 'bracket'   && <BracketTab matches={matches} />}
        {tab === 'players'   && <PlayersTab registrations={registrations} />}
        {tab === 'sponsors'  && <SponsorsTab sponsors={sponsors} />}
      </div>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────

function OverviewTab({ t }: { t: Tournament }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {t.prize && (
        <div style={s.prizeCard}>
          <span style={s.prizeLabel}>الجائزة</span>
          <span style={s.prizeValue}>{t.prize}</span>
        </div>
      )}
      {t.description ? (
        <div style={s.descCard}>
          <h3 style={s.sectionTitle}>عن البطولة</h3>
          <p style={s.descText}>{t.description}</p>
        </div>
      ) : (
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>لا يوجد وصف للبطولة</p>
      )}
      <div style={s.infoGrid}>
        {t.venue    && <InfoItem icon="📍" label="الملعب"    value={t.venue} />}
        {t.start_date && <InfoItem icon="🗓" label="تاريخ البداية" value={fmt(t.start_date)} />}
        {t.end_date   && <InfoItem icon="🏁" label="تاريخ النهاية" value={fmt(t.end_date)} />}
        <InfoItem icon="👥" label="أقصى عدد لاعبين" value={String(t.max_players)} />
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={s.infoItem}>
      <span style={s.infoIcon}>{icon}</span>
      <div>
        <div style={s.infoLabel}>{label}</div>
        <div style={s.infoValue}>{value}</div>
      </div>
    </div>
  )
}

// ── Bracket Tab ──────────────────────────────────────────

function BracketTab({ matches }: { matches: MatchWithDetails[] }) {
  if (!matches.length) {
    return <Empty icon="🎾" text="لم تُضاف مباريات بعد" />
  }

  const byRound: Record<string, MatchWithDetails[]> = {}
  for (const m of matches) {
    if (!byRound[m.round]) byRound[m.round] = []
    byRound[m.round].push(m)
  }

  const rounds = Object.keys(byRound).sort(sortRounds)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {rounds.map(round => (
        <div key={round}>
          <h3 style={s.roundTitle}>{round}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {byRound[round].map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function MatchCard({ match: m }: { match: MatchWithDetails }) {
  const scoreA = m.sets.map(s => s.score_a)
  const scoreB = m.sets.map(s => s.score_b)
  const winA   = m.winner_team === 'A'
  const winB   = m.winner_team === 'B'
  const isLive = m.status === 'live'

  return (
    <div style={{ ...s.matchCard, borderColor: isLive ? 'var(--danger)' : 'var(--border)' }}>
      {isLive && <div style={s.livePill}>● مباشر</div>}

      {/* Team A */}
      <div style={{ ...s.teamRow, opacity: (m.winner_team && !winA) ? 0.5 : 1 }}>
        <TeamNames p1={m.player_a1} p2={m.player_a2} winner={winA} />
        <Scores scores={scoreA} winner={winA} />
      </div>

      <div style={s.vs}>VS</div>

      {/* Team B */}
      <div style={{ ...s.teamRow, opacity: (m.winner_team && !winB) ? 0.5 : 1 }}>
        <TeamNames p1={m.player_b1} p2={m.player_b2} winner={winB} />
        <Scores scores={scoreB} winner={winB} />
      </div>

      {m.court && (
        <div style={s.courtLabel}>ملعب {m.court}</div>
      )}
    </div>
  )
}

type PS = { id: string; full_name: string; short_name: string | null; avatar_url: string | null } | null

function TeamNames({ p1, p2, winner }: { p1: PS; p2: PS; winner: boolean }) {
  const color = winner ? 'var(--accent)' : 'var(--text-1)'
  const nameOf = (p: PS) => p ? (p.short_name ?? p.full_name.split(' ')[0]) : '؟'
  return (
    <span style={{ fontSize: '0.875rem', fontWeight: winner ? 700 : 500, color }}>
      {nameOf(p1)} / {nameOf(p2)}
    </span>
  )
}

function Scores({ scores, winner }: { scores: number[]; winner: boolean }) {
  if (!scores.length) return <span style={{ color: 'var(--text-3)', fontSize: '0.8125rem' }}>—</span>
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {scores.map((sc, i) => (
        <span key={i} style={{
          minWidth: 24, textAlign: 'center',
          fontSize: '0.875rem', fontWeight: 700,
          color: winner ? 'var(--accent)' : 'var(--text-2)',
        }}>{sc}</span>
      ))}
    </div>
  )
}

// ── Players Tab ───────────────────────────────────────────

function PlayersTab({ registrations }: { registrations: Registration[] }) {
  if (!registrations.length) {
    return <Empty icon="👥" text="لا يوجد لاعبون مسجلون بعد" />
  }

  const confirmed = registrations.filter(r => r.status === 'confirmed')
  const pending   = registrations.filter(r => r.status === 'pending')
  const all       = [...confirmed, ...pending]

  const half   = Math.ceil(all.length / 2)
  const left   = all.slice(0, half)
  const right  = all.slice(half)

  return (
    <div>
      <div style={s.playersHeader}>
        <span style={s.sectionTitle}>اللاعبون ({all.length})</span>
      </div>
      <div style={s.playersGrid}>
        <PlayerColumn players={left}  startSeed={1} />
        <PlayerColumn players={right} startSeed={half + 1} />
      </div>
    </div>
  )
}

function PlayerColumn({ players, startSeed }: { players: Registration[]; startSeed: number }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {players.map((r, i) => (
        <div key={r.id} style={{
          ...s.playerRow,
          borderColor: r.status === 'confirmed' ? 'var(--border)' : 'var(--border)',
        }}>
          <span style={s.seed}>{startSeed + i}</span>
          <div style={s.playerInitials}>
            {r.player.full_name.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div>
            <div style={s.playerName}>{r.player.short_name ?? r.player.full_name}</div>
            {r.status === 'pending' && (
              <span style={s.pendingBadge}>قيد المراجعة</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Sponsors Tab ──────────────────────────────────────────

const TIER_LABELS: Record<string, string> = {
  'ذهبي':   'الرعاة الذهبيون',
  'فضي':    'الرعاة الفضيون',
  'برونزي': 'الرعاة البرونزيون',
}
const TIER_COLORS: Record<string, string> = {
  'ذهبي':   'var(--gold)',
  'فضي':    'var(--silver)',
  'برونزي': 'var(--bronze)',
}

function SponsorsTab({ sponsors }: { sponsors: Sponsor[] }) {
  if (!sponsors.length) {
    return <Empty icon="🤝" text="لا يوجد رعاة بعد" />
  }

  const byTier: Record<string, Sponsor[]> = {}
  for (const sp of sponsors) {
    if (!byTier[sp.tier]) byTier[sp.tier] = []
    byTier[sp.tier].push(sp)
  }

  const tierOrder: Array<'ذهبي' | 'فضي' | 'برونزي'> = ['ذهبي', 'فضي', 'برونزي']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {tierOrder.filter(tier => byTier[tier]?.length).map(tier => (
        <div key={tier}>
          <h3 style={{ ...s.roundTitle, color: TIER_COLORS[tier] }}>
            {TIER_LABELS[tier]}
          </h3>
          <div style={s.sponsorsGrid}>
            {byTier[tier].map(sp => (
              <a
                key={sp.id}
                href={sp.website_url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...s.sponsorCard, borderColor: `${TIER_COLORS[tier]}33` }}
              >
                {sp.logo_url ? (
                  <img src={sp.logo_url} alt={sp.name} style={s.sponsorLogo} />
                ) : (
                  <div style={{ ...s.sponsorInitials, color: TIER_COLORS[tier] }}>
                    {sp.name[0]}
                  </div>
                )}
                <span style={s.sponsorName}>{sp.name}</span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: 'مسودة',         color: 'rgba(255,255,255,0.4)' },
    open:  { label: 'التسجيل مفتوح', color: 'var(--accent)'        },
    live:  { label: '● مباشر',       color: '#EF4444'               },
    done:  { label: 'منتهية',         color: 'rgba(255,255,255,0.5)' },
  }
  const cfg = map[status] ?? map.open
  return (
    <span style={{
      fontSize: '0.75rem', fontWeight: 700,
      padding: '3px 10px', borderRadius: '99px',
      background: 'rgba(0,0,0,0.3)',
      color: cfg.color,
      border: `1px solid ${cfg.color}40`,
    }}>{cfg.label}</span>
  )
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '3rem 1rem' }}>
      <span style={{ fontSize: '2rem' }}>{icon}</span>
      <p style={{ color: 'var(--text-2)', margin: 0 }}>{text}</p>
    </div>
  )
}

function fmt(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Styles ────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:      { direction: 'rtl', maxWidth: 760, margin: '0 auto', paddingBottom: '4rem' },
  hero:      { padding: '2rem', borderRadius: 'var(--radius-xl)', marginBottom: '0', position: 'relative', overflow: 'hidden' },
  heroInner: { marginBottom: '1.25rem' },
  heroTop:   { display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' },
  catBadge:  { fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: 'rgba(0,0,0,0.35)', color: '#fff' },
  heroTitle: { fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.03em', textShadow: '0 2px 8px rgba(0,0,0,0.4)' },
  heroPrize: { color: 'rgba(255,255,255,0.9)', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem' },
  heroMeta:  { display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.75)' },
  copyBtn:   {
    marginTop: '1.25rem', padding: '0.625rem 1.25rem',
    background: 'rgba(0,0,0,0.35)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 'var(--radius)', cursor: 'pointer',
    fontSize: '0.875rem', fontWeight: 600, backdropFilter: 'blur(4px)',
    transition: 'background 0.15s',
  },
  tabBar:    { display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginTop: '1.5rem' },
  tab:       {
    flex: 1, padding: '0.75rem 0.5rem', background: 'none',
    border: 'none', borderBottom: '2px solid transparent',
    color: 'var(--text-2)', fontSize: '0.875rem', fontWeight: 500,
    cursor: 'pointer', transition: 'color 0.12s',
    textAlign: 'center' as const,
  },
  tabActive: { color: 'var(--text-1)', borderBottomColor: 'var(--accent)', fontWeight: 700 },
  content:   { paddingTop: '1.5rem' },

  // Overview
  prizeCard:   { background: 'var(--gold-dim)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'center' as const },
  prizeLabel:  { display: 'block', fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  prizeValue:  { display: 'block', fontSize: '1.75rem', fontWeight: 800, color: 'var(--gold)' },
  descCard:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' },
  sectionTitle:{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 0.75rem' },
  descText:    { fontSize: '0.9375rem', color: 'var(--text-2)', lineHeight: 1.7, margin: 0 },
  infoGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  infoItem:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.875rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start' },
  infoIcon:    { fontSize: '1.125rem', flexShrink: 0 },
  infoLabel:   { fontSize: '0.6875rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 2 },
  infoValue:   { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)' },

  // Bracket
  roundTitle: { fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: '0.625rem' },
  matchCard:  { background: 'var(--surface)', border: '1px solid', borderRadius: 'var(--radius)', padding: '0.875rem', display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', position: 'relative' as const },
  livePill:   { position: 'absolute' as const, top: 8, left: 10, fontSize: '0.625rem', fontWeight: 700, color: '#EF4444', letterSpacing: '0.05em' },
  teamRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  vs:         { fontSize: '0.6875rem', color: 'var(--text-3)', fontWeight: 700, textAlign: 'center' as const, letterSpacing: '0.08em' },
  courtLabel: { fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 2 },

  // Players
  playersHeader: { marginBottom: '1rem' },
  playersGrid:   { display: 'flex', gap: '0.75rem' },
  playerRow:     { display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', border: '1px solid', borderRadius: 'var(--radius)', padding: '0.5rem 0.625rem' },
  seed:          { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', minWidth: 20, textAlign: 'center' as const },
  playerInitials:{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 },
  playerName:    { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)' },
  pendingBadge:  { fontSize: '0.625rem', color: 'var(--warning)', fontWeight: 600 },

  // Sponsors
  sponsorsGrid:    { display: 'flex', flexWrap: 'wrap' as const, gap: '0.75rem', marginTop: '0.5rem' },
  sponsorCard:     { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', border: '1px solid', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', textDecoration: 'none', minWidth: 100 },
  sponsorLogo:     { width: 48, height: 48, objectFit: 'contain' as const, borderRadius: 'var(--radius-sm)' },
  sponsorInitials: { width: 48, height: 48, borderRadius: 'var(--radius)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 },
  sponsorName:     { fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)', textAlign: 'center' as const },
}
