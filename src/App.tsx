import { useState, useEffect, useRef } from 'react'
import MonteCarlo from './apps/MonteCarlo'
import BuffonNeedles from './apps/BuffonNeedles'
import BaselSeries from './apps/BaselSeries'
import GaussianIntegral from './apps/GaussianIntegral'
import ArchimedesPolygons from './apps/ArchimedesPolygons'
import SqrtPi from './apps/SqrtPi'
import KochFractal from './apps/KochFractal'
import DecimalHunt from './apps/DecimalHunt'
import PiCircles from './apps/PiCircles'
import PiQuiz from './apps/PiQuiz'

const APPS = [
  { id: 0, icon: '🎲', label: 'Monte Carlo', color: '#00e5ff', component: MonteCarlo },
  { id: 1, icon: '📍', label: "Aiguilles de Buffon", color: '#f472b6', component: BuffonNeedles },
  { id: 2, icon: '∑', label: 'Série de Basel', color: '#8b5cf6', component: BaselSeries },
  { id: 3, icon: '∫', label: 'Intégrale Gaussienne', color: '#34d399', component: GaussianIntegral },
  { id: 4, icon: '⬡', label: 'Polygones d\'Archimède', color: '#fbbf24', component: ArchimedesPolygons },
  { id: 5, icon: '√', label: 'Racine de π', color: '#f87171', component: SqrtPi },
  { id: 6, icon: '❄', label: 'Flocon de Koch', color: '#a78bfa', component: KochFractal },
  { id: 7, icon: '⌨', label: 'Chasse aux décimales', color: '#fb923c', component: DecimalHunt },
  { id: 8, icon: '○', label: 'π dans les Cercles', color: '#2dd4bf', component: PiCircles },
  { id: 9, icon: '🏆', label: 'Quiz π Interactif', color: '#e879f9', component: PiQuiz },
]

function PiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number

    const particles: { x: number; y: number; vy: number; vx: number; opacity: number; size: number; char: string }[] = []
    const CHARS = ['π', '3', '.', '1', '4', '1', '5', '9', '2', '6', '5', '3', '5']

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.2,
        opacity: Math.random() * 0.15 + 0.03,
        size: Math.random() * 20 + 10,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.font = `${p.size}px Space Mono`
        ctx.fillStyle = '#8b5cf6'
        ctx.fillText(p.char, p.x, p.y)
        ctx.restore()
        p.x += p.vx
        p.y += p.vy
        if (p.y < -40) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width }
        if (p.x < -20) p.x = canvas.width + 20
        if (p.x > canvas.width + 20) p.x = -20
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

function PiValue({ value }: { value: number }) {
  const str = value.toFixed(8)
  const pi = Math.PI.toFixed(8)
  return (
    <span style={{ fontFamily: 'Space Mono', fontSize: 13 }}>
      {str.split('').map((c, i) => (
        <span key={i} style={{ color: c === pi[i] ? '#34d399' : '#f87171' }}>{c}</span>
      ))}
    </span>
  )
}

export default function App() {
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const ActiveComponent = APPS[active].component

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <PiBackground />

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(5,5,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139,92,246,0.2)',
        padding: '0 24px',
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 32, fontFamily: 'Space Mono',
            background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          }}>π</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.05em' }}>Pi Day 2026</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'Space Mono' }}>14.03 · 10 expériences</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            fontFamily: 'Space Mono', fontSize: 12, color: 'var(--text2)',
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ color: 'var(--cyan)' }}>π ≈</span>
            <PiValue value={Math.PI} />
          </div>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              background: 'var(--glass)', border: '1px solid var(--glass-border)',
              color: 'var(--text)', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {menuOpen ? '✕ Fermer' : '☰ Menu'}
          </button>
        </div>
      </header>

      {/* Side Menu Overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 90,
            background: 'rgba(5,5,15,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'flex-end',
          }}
          onClick={() => setMenuOpen(false)}
        >
          <nav
            style={{
              width: 320, height: '100%',
              background: 'rgba(10,10,26,0.98)',
              borderLeft: '1px solid rgba(139,92,246,0.3)',
              paddingTop: 80, overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '0 20px 16px', color: 'var(--text2)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Expériences
            </div>
            {APPS.map(app => (
              <button
                key={app.id}
                onClick={() => { setActive(app.id); setMenuOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '14px 20px', textAlign: 'left',
                  background: active === app.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                  border: 'none', borderLeft: `3px solid ${active === app.id ? app.color : 'transparent'}`,
                  color: active === app.id ? app.color : 'var(--text)',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{app.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{app.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab Bar */}
      <div style={{
        position: 'fixed', top: 64, left: 0, right: 0, zIndex: 80,
        background: 'rgba(5,5,15,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto', display: 'flex',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {APPS.map(app => (
          <button
            key={app.id}
            onClick={() => setActive(app.id)}
            style={{
              flex: '0 0 auto', padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'none', border: 'none',
              borderBottom: active === app.id ? `2px solid ${app.color}` : '2px solid transparent',
              color: active === app.id ? app.color : 'var(--text2)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 16 }}>{app.icon}</span>
            <span>{app.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <main style={{
        flex: 1,
        paddingTop: 118,
        minHeight: '100vh',
        position: 'relative', zIndex: 10,
      }}>
        <ActiveComponent />
      </main>
    </div>
  )
}
