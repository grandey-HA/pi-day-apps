import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, SliderRow, PiCompare, Card } from './shared'

const COLOR = '#8b5cf6'
const PRESETS = [100, 1_000, 10_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000]
const PRESET_LABELS = ['100', '10³', '10⁴', '10⁵', '10⁶', '10⁷', '10⁸', '10⁹']

export default function BaselSeries() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ sum: 0, computed: 0 })
  const animRef = useRef(0)
  const runningRef = useRef(false)

  const [maxTerms, setMaxTerms] = useState(500)
  const [speed, setSpeed] = useState(10_000)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ sum: 0, computed: 0, pi: 0 })

  const draw = useCallback((sum: number, computed: number) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    const PAD = 36
    const chartW = W - PAD * 2
    const chartH = H - PAD * 2

    const target = Math.PI ** 2 / 6
    const maxVal = target * 1.1

    // Target dashed line
    ctx.strokeStyle = `${COLOR}44`
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    const ty = PAD + chartH - (target / maxVal) * chartH
    ctx.moveTo(PAD, ty); ctx.lineTo(W - PAD, ty)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = COLOR
    ctx.font = '10px Space Mono'
    ctx.fillText('π²/6', W - PAD - 28, ty - 4)

    // Bars for first 120 terms
    const visTerms = Math.min(computed, 120)
    const barW = Math.max(1, chartW / Math.max(visTerms, 1) - 1)
    let cumSum = 0
    const points: [number, number][] = []

    for (let i = 0; i < visTerms; i++) {
      const term = 1 / ((i + 1) ** 2)
      cumSum += term
      const barH = (term / maxVal) * chartH
      const x = PAD + (i / Math.max(visTerms, 1)) * chartW
      const y = PAD + chartH - barH
      const intensity = i / Math.max(visTerms - 1, 1)
      ctx.fillStyle = `hsla(${270 - intensity * 60}, 70%, ${50 + intensity * 20}%, 0.6)`
      ctx.fillRect(x, y, Math.max(barW - 1, 1), barH)
      points.push([PAD + ((i + 0.5) / visTerms) * chartW, PAD + chartH - (cumSum / maxVal) * chartH])
    }

    // Cumulative line through visible terms
    if (points.length > 1) {
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.shadowBlur = 6; ctx.shadowColor = '#fbbf24'
      ctx.stroke(); ctx.shadowBlur = 0
    }

    // Full sum dot at right edge
    if (sum > 0) {
      const fy = PAD + chartH - (sum / maxVal) * chartH
      ctx.beginPath(); ctx.arc(W - PAD - 6, fy, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#fbbf24'; ctx.fill()
      ctx.shadowBlur = 8; ctx.shadowColor = '#fbbf24'; ctx.fill(); ctx.shadowBlur = 0
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, PAD + chartH); ctx.lineTo(W - PAD, PAD + chartH)
    ctx.stroke()

    // Header info
    const pi = sum > 0 ? Math.sqrt(sum * 6) : 0
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '10px Space Mono'
    ctx.fillText(`Σ(1/n²) = ${sum.toFixed(8)}  →  √(6·Σ) = ${pi.toFixed(8)}`, PAD, PAD - 8)
  }, [])

  const step = useCallback(() => {
    if (!runningRef.current) return
    const s = stateRef.current
    const batch = speed
    for (let i = 0; i < batch && s.computed < maxTerms; i++) {
      s.computed++
      s.sum += 1 / (s.computed * s.computed)
    }
    const pi = Math.sqrt(s.sum * 6)
    setStats({ sum: s.sum, computed: s.computed, pi })
    draw(s.sum, s.computed)

    if (s.computed < maxTerms) {
      animRef.current = requestAnimationFrame(step)
    } else {
      runningRef.current = false
      setRunning(false)
    }
  }, [speed, maxTerms, draw])

  const reset = useCallback(() => {
    runningRef.current = false
    cancelAnimationFrame(animRef.current)
    setRunning(false)
    stateRef.current = { sum: 0, computed: 0 }
    setStats({ sum: 0, computed: 0, pi: 0 })
    draw(0, 0)
  }, [draw])

  const toggleRun = useCallback(() => {
    if (running) {
      runningRef.current = false
      cancelAnimationFrame(animRef.current)
      setRunning(false)
    } else {
      if (stateRef.current.computed >= maxTerms) reset()
      runningRef.current = true
      setRunning(true)
      animRef.current = requestAnimationFrame(step)
    }
  }, [running, step, reset, maxTerms])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = 580; canvas.height = 200
    draw(0, 0)
  }, [draw])

  return (
    <AppLayout
      title="Série de Basel"
      icon="∑"
      color={COLOR}
      subtitle="La somme de 1/n² converge vers π²/6 — identité d'Euler (1734)."
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Stat label="Termes calculés" value={stats.computed.toLocaleString()} color={COLOR} />
        <Stat label="Σ(1/n²)" value={stats.sum > 0 ? stats.sum.toFixed(8) : '—'} color="#fbbf24" mono />
        <Stat label="√(6·Σ) ≈ π" value={stats.pi > 0 ? stats.pi.toFixed(8) : '—'} color={COLOR} mono />
        <Stat label="Erreur" value={stats.pi > 0 ? Math.abs(stats.pi - Math.PI).toExponential(2) : '—'} />
      </div>

      {stats.pi > 0 && <div style={{ marginBottom: 8 }}><PiCompare estimate={stats.pi} /></div>}

      <Card style={{ marginBottom: 8 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 10, width: '100%', border: '1px solid rgba(139,92,246,0.15)' }} />
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginRight: 2 }}>Cible :</span>
          {PRESETS.map((p, i) => (
            <Btn key={p} onClick={() => { setMaxTerms(p); reset() }} color={COLOR} active={maxTerms === p}>
              {PRESET_LABELS[i]}
            </Btn>
          ))}
        </div>
        <SliderRow label="Vitesse (termes/frame)" value={speed} min={1000} max={1_000_000} step={1000} onChange={setSpeed} color={COLOR}
          format={v => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M/fr` : `${(v / 1e3).toFixed(0)}k/fr`} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn onClick={toggleRun} color={COLOR} active={running}>
            {running ? '⏸ Pause' : stats.computed > 0 ? '▶ Reprendre' : '▶ Lancer'}
          </Btn>
          <Btn onClick={reset} color="#f87171">↺ Reset</Btn>
          <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'Space Mono' }}>
            {stats.computed > 0 ? `${((stats.computed / maxTerms) * 100).toFixed(1)}%` : '0.0%'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>
          Barres = termes 1/n² (120 premiers affichés). Point doré = Σ courante. Pointillé = π²/6.
        </div>
      </Card>
    </AppLayout>
  )
}
