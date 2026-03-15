import type { CSSProperties, ReactNode } from 'react'

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: 12,
      ...style,
    }}>{children}</div>
  )
}

export function AppLayout({ title, icon, subtitle, color, children }: {
  title: string; icon: string; subtitle: string; color: string; children: ReactNode
}) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 16px 14px' }}>
      <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${color}22, ${color}44)`,
          border: `1px solid ${color}44`, fontSize: 18,
        }}>{icon}</div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2, marginBottom: 2 }}>{title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 12 }}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function Stat({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 9, padding: '7px 11px', minWidth: 80,
    }}>
      <div style={{ fontSize: 10, color: 'var(--text2)', marginBottom: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--text)', fontFamily: mono ? 'Space Mono' : undefined }}>{value}</div>
    </div>
  )
}

export function Btn({ children, onClick, color, active, disabled, style }: {
  children: ReactNode; onClick?: () => void; color?: string; active?: boolean; disabled?: boolean; style?: CSSProperties
}) {
  const c = color || '#8b5cf6'
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
      background: active ? `${c}33` : 'rgba(255,255,255,0.05)',
      border: `1px solid ${active ? c : 'rgba(255,255,255,0.1)'}`,
      color: active ? c : 'var(--text)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'all 0.2s',
      ...style,
    }}>{children}</button>
  )
}

export function SliderRow({ label, value, min, max, step = 1, onChange, color, format }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; color?: string; format?: (v: number) => string
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ color: color || 'var(--cyan)', fontFamily: 'Space Mono', fontSize: 11 }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ '--track-color': color || 'var(--cyan)' } as CSSProperties}
      />
    </div>
  )
}

export function PiCompare({ estimate }: { estimate: number }) {
  const err = Math.abs(estimate - Math.PI)
  const digits = err === 0 ? 10 : Math.max(0, Math.floor(-Math.log10(err)))
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 9, padding: '7px 12px', fontFamily: 'Space Mono', fontSize: 12,
    }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <span style={{ color: 'var(--text2)', fontSize: 10 }}>ESTIMATION </span>
          {formatPiCompare(estimate.toFixed(10), Math.PI.toFixed(10))}
        </div>
        <div>
          <span style={{ color: 'var(--text2)', fontSize: 10 }}>ERREUR </span>
          <span style={{ color: err < 0.001 ? '#34d399' : err < 0.01 ? '#fbbf24' : '#f87171' }}>
            {err.toExponential(3)}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--text2)', fontSize: 10 }}>DÉCIMALES </span>
          <span style={{ color: '#34d399' }}>{digits}</span>
        </div>
      </div>
    </div>
  )
}

function formatPiCompare(est: string, real: string) {
  return (
    <span>
      {est.split('').map((c, i) => (
        <span key={i} style={{ color: c === real[i] ? '#34d399' : '#f87171' }}>{c}</span>
      ))}
    </span>
  )
}
