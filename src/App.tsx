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
import DuckFriend from './apps/DuckFriend'

const APPS = [
  { id: 0, icon: '🎲', label: 'Monte Carlo', color: '#00e5ff', component: MonteCarlo },
  { id: 1, icon: '📍', label: "Aiguilles de Buffon", color: '#f472b6', component: BuffonNeedles },
  { id: 2, icon: '∑', label: 'Série de Basel', color: '#8b5cf6', component: BaselSeries },
  { id: 3, icon: '∫', label: 'Intégrale Gaussienne', color: '#34d399', component: GaussianIntegral },
  { id: 4, icon: '⬡', label: "Polygones d'Archimède", color: '#fbbf24', component: ArchimedesPolygons },
  { id: 5, icon: '√', label: 'Racine de π', color: '#f87171', component: SqrtPi },
  { id: 6, icon: '❄', label: 'Flocon de Koch', color: '#a78bfa', component: KochFractal },
  { id: 7, icon: '⌨', label: 'Chasse aux décimales', color: '#fb923c', component: DecimalHunt },
  { id: 8, icon: '○', label: 'π dans les Cercles', color: '#2dd4bf', component: PiCircles },
  { id: 9, icon: '🏆', label: 'Quiz π Interactif', color: '#e879f9', component: PiQuiz },
]

const DUCK_APP = { id: 10, icon: '🦆', label: 'Duck Friend', color: '#f59e0b', component: DuckFriend }

const HEADER_H = 50
const TAB_H = 36

function PiBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let animId: number
    const particles: { x: number; y: number; vy: number; vx: number; opacity: number; size: number; char: string }[] = []
    const CHARS = ['π', '3', '.', '1', '4', '1', '5', '9', '2', '6', '5', '3', '5']
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.5 - 0.2,
        opacity: Math.random() * 0.15 + 0.03, size: Math.random() * 18 + 8,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
      })
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.opacity
        ctx.font = `${p.size}px Space Mono`; ctx.fillStyle = '#8b5cf6'
        ctx.fillText(p.char, p.x, p.y); ctx.restore()
        p.x += p.vx; p.y += p.vy
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
    <span style={{ fontFamily: 'Space Mono', fontSize: 11 }}>
      {str.split('').map((c, i) => (
        <span key={i} style={{ color: c === pi[i] ? '#34d399' : '#f87171' }}>{c}</span>
      ))}
    </span>
  )
}

export default function App() {
  const [active, setActive] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [duckUnlocked, setDuckUnlocked] = useState(false)
  const [showDuckModal, setShowDuckModal] = useState(false)
  const [duckInput, setDuckInput] = useState('')
  const [duckError, setDuckError] = useState(false)

  const allApps = duckUnlocked ? [...APPS, DUCK_APP] : APPS
  const activeApp = allApps.find(a => a.id === active) ?? APPS[0]
  const ActiveComponent = activeApp.component

  const submitDuckPassword = () => {
    if (duckInput.toLowerCase() === 'moncanard') {
      setDuckUnlocked(true)
      setShowDuckModal(false)
      setDuckInput('')
      setDuckError(false)
      setActive(10)
    } else {
      setDuckError(true)
      setTimeout(() => setDuckError(false), 800)
    }
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <PiBackground />

      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139,92,246,0.2)',
        padding: '0 20px', height: HEADER_H,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 26, fontFamily: 'Space Mono',
            background: 'linear-gradient(135deg, #00e5ff, #8b5cf6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700,
          }}>π</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.05em' }}>Pi Day 2026</div>
            <div style={{ fontSize: 10, color: 'var(--text2)', fontFamily: 'Space Mono' }}>14.03 · 10 expériences</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text2)',
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            padding: '4px 10px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ color: 'var(--cyan)' }}>π ≈</span>
            <PiValue value={Math.PI} />
          </div>
          <button onClick={() => setMenuOpen(v => !v)} style={{
            background: 'var(--glass)', border: '1px solid var(--glass-border)',
            color: 'var(--text)', borderRadius: 7, padding: '5px 11px', fontSize: 12, fontWeight: 600,
          }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {showDuckModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setShowDuckModal(false); setDuckInput('') }}>
          <div style={{
            background: 'rgba(15,15,30,0.98)', border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 16, padding: '28px 32px', width: 300,
            boxShadow: '0 0 40px rgba(245,158,11,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>🦆</div>
            <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 4 }}>Zone restreinte</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center', marginBottom: 18 }}>Mot de passe requis</div>
            <input
              autoFocus
              type="password"
              value={duckInput}
              onChange={e => setDuckInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitDuckPassword()}
              placeholder="mot de passe..."
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
                background: duckError ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${duckError ? '#f87171' : 'rgba(245,158,11,0.3)'}`,
                color: 'var(--text)', outline: 'none', fontFamily: 'Space Mono',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            />
            {duckError && <div style={{ fontSize: 11, color: '#f87171', marginTop: 6, textAlign: 'center' }}>Mauvais mot de passe 🦆</div>}
            <button type="button" onClick={submitDuckPassword} style={{
              width: '100%', marginTop: 14, padding: '10px', borderRadius: 8,
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
              color: '#f59e0b', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Entrer</button>
          </div>
        </div>
      )}

      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(5,5,15,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'flex-end',
        }} onClick={() => setMenuOpen(false)}>
          <nav style={{
            width: 260, height: '100%',
            background: 'rgba(10,10,26,0.98)',
            borderLeft: '1px solid rgba(139,92,246,0.3)',
            paddingTop: HEADER_H + TAB_H + 8, overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            {allApps.map(app => (
              <button type="button" key={app.id} onClick={() => { setActive(app.id); setMenuOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 14px', textAlign: 'left',
                  background: active === app.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                  border: 'none', borderLeft: `3px solid ${active === app.id ? app.color : 'transparent'}`,
                  color: active === app.id ? app.color : 'var(--text)',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}>
                <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{app.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{app.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      <div style={{
        position: 'fixed', top: HEADER_H, left: 0, right: 0, zIndex: 80,
        background: 'rgba(5,5,15,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto', display: 'flex', height: TAB_H, alignItems: 'center',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {allApps.map(app => (
          <button type="button" key={app.id} onClick={() => setActive(app.id)}
            style={{
              flex: '0 0 auto', padding: '0 13px', height: TAB_H,
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none',
              borderBottom: active === app.id ? `2px solid ${app.color}` : '2px solid transparent',
              color: active === app.id ? app.color : 'var(--text2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
            <span style={{ fontSize: 13 }}>{app.icon}</span>
            <span>{app.label}</span>
          </button>
        ))}
        {!duckUnlocked && (
          <button type="button" onClick={() => setShowDuckModal(true)}
            title="???"
            style={{
              flex: '0 0 auto', padding: '0 10px', height: TAB_H,
              background: 'none', border: 'none', cursor: 'pointer',
              opacity: 0.15, fontSize: 14, transition: 'opacity 0.3s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.45')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.15')}
          >🔒</button>
        )}
      </div>

      <main style={{
        flex: 1, paddingTop: HEADER_H + TAB_H,
        minHeight: '100vh', position: 'relative', zIndex: 10,
      }}>
        <ActiveComponent />
      </main>
    </div>
  )
}
