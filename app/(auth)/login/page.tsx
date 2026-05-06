'use client'

import { useState, useTransition } from 'react'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await login(email, password)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="var(--accent-dim)" />
            <path
              d="M10 26 C10 26 14 10 18 10 C22 10 26 26 26 26"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="18" cy="19" r="3.5" fill="var(--accent)" />
          </svg>
          <span style={styles.brand}>PadelElite</span>
        </div>

        <h1 style={styles.title}>تسجيل الدخول</h1>
        <p style={styles.subtitle}>أدخل بياناتك للمتابعة</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              style={styles.input}
              dir="ltr"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={styles.input}
              dir="ltr"
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorDot} />
              {friendlyError(error)}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            style={{ ...styles.btn, ...(isPending ? styles.btnDisabled : {}) }}
          >
            {isPending ? 'جاري الدخول…' : 'دخول'}
          </button>
        </form>

        <p style={styles.hint}>
          لا يمكن إنشاء حساب ذاتياً — تواصل مع الإدارة
        </p>
      </div>
    </div>
  )
}

function friendlyError(msg: string) {
  if (msg.includes('Invalid login')) return 'البريد أو كلمة المرور غير صحيحة'
  if (msg.includes('Email not confirmed')) return 'البريد الإلكتروني لم يتم تأكيده بعد'
  if (msg.includes('Too many requests')) return 'محاولات كثيرة — انتظر قليلاً'
  return msg
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '1.5rem',
    direction: 'rtl',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: 'var(--radius-xl)',
    padding: '2.5rem 2rem',
    boxShadow: 'var(--shadow-lg)',
  },
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    marginBottom: '2rem',
  },
  brand: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-1)',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-1)',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-2)',
    marginTop: '0.375rem',
    marginBottom: '2rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.125rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--text-2)',
  },
  input: {
    padding: '0.75rem 0.875rem',
    fontSize: '0.9375rem',
    width: '100%',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--danger-dim)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius)',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#FCA5A5',
  },
  errorDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--danger)',
    flexShrink: 0,
  },
  btn: {
    marginTop: '0.25rem',
    padding: '0.875rem',
    background: 'var(--accent)',
    color: '#000',
    fontWeight: 700,
    fontSize: '0.9375rem',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'background 0.15s, opacity 0.15s',
    letterSpacing: '-0.01em',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  hint: {
    marginTop: '1.5rem',
    fontSize: '0.75rem',
    color: 'var(--text-3)',
    textAlign: 'center',
  },
}
