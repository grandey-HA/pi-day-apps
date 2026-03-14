import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, SliderRow, PiCompare, Card } from './shared'

const COLOR = '#00e5ff'
const MAX_POINTS = 100_000

export default function MonteCarlo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const histCanvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ inside: 0, total: 0, points: [] as [number, number, boolean][], history: [] as number[] })
  const animRef = useRef<number>(0)
  const runningRef = useRef(false)

  const [speed, setSpeed] = useState(200)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ inside: 0, total: 0, pi: 0 })

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath(); ctx.moveTo(i * W / 10, 0); ctx.lineTo(i * W / 10, H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * H / 10); ctx.lineTo(W, i * H / 10); ctx.stroke()
    }

    // Circle
    ctx.beginPath()
    ctx.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2)
    ctx.strokeStyle = `${COLOR}66`
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Glowing circle
    ctx.beginPath()
    ctx.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2)
    ctx.strokeStyle = `${COLOR}22`
    ctx.lineWidth = 6
    ctx.stroke()

    // Points
    const pts = stateRef.current.points
    const R = 1
    for (let i = 0; i < pts.length; i++) {
      const [nx, ny, inside] = pts[i]
      const x = nx * W, y = ny * H
      ctx.beginPath()
      ctx.arc(x, y, R, 0, Math.PI * 2)
      ctx.fillStyle = inside ? `${COLOR}cc` : '#f472b688'
      ctx.fill()
    }
  }, [])

  const drawHistory = useCallback(() => {
    const canvas = histCanvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    const hist = stateRef.current.history
    if (hist.length < 2) return

    // π line
    ctx.beginPath()
    ctx.moveTo(0, H / 2)
    ctx.lineTo(W, H / 2)
    ctx.strokeStyle = `${COLOR}44`
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = 'var(--text2)'
    ctx.font = '10px Space Mono'
    ctx.fillText('π', W - 16, H / 2 - 4)

    // Convergence line
    const range = 1.0
    ctx.beginPath()
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * W
      const y = H / 2 - ((v - Math.PI) / range) * (H / 2 - 10)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = COLOR
    ctx.lineWidth = 2
    ctx.shadowBlur = 6
    ctx.shadowColor = COLOR
    ctx.stroke()
    ctx.shadowBlur = 0
  }, [])

  const step = useCallback(() => {
    if (!runningRef.current) return
    const s = stateRef.current
    const batchSize = speed
    for (let i = 0; i < batchSize && s.total < MAX_POINTS; i++) {
      const x = Math.random(), y = Math.random()
      const inside = (x - 0.5) ** 2 + (y - 0.5) ** 2 < 0.25
      if (inside) s.inside++
      s.total++
      if (s.points.length < 8000) s.points.push([x, y, inside])
    }
    const pi = s.total > 0 ? (4 * s.inside) / s.total : 0
    s.history.push(pi)
    if (s.history.length > 300) s.history.shift()

    setStats({ inside: s.inside, total: s.total, pi })
    drawCanvas()
    drawHistory()

    if (s.total < MAX_POINTS) {
      animRef.current = requestAnimationFrame(step)
    } else {
      runningRef.current = false
      setRunning(false)
    }
  }, [speed, drawCanvas, drawHistory])

  const toggleRun = useCallback(() => {
    if (running) {
      runningRef.current = false
      cancelAnimationFrame(animRef.current)
      setRunning(false)
    } else {
      runningRef.current = true
      setRunning(true)
      animRef.current = requestAnimationFrame(step)
    }
  }, [running, step])

  const reset = useCallback(() => {
    runningRef.current = false
    cancelAnimationFrame(animRef.current)
    setRunning(false)
    stateRef.current = { inside: 0, total: 0, points: [], history: [] }
    setStats({ inside: 0, total: 0, pi: 0 })
    drawCanvas()
    drawHistory()
  }, [drawCanvas, drawHistory])

  useEffect(() => {
    const canvas = canvasRef.current!
    const hist = histCanvasRef.current!
    const ro = new ResizeObserver(() => {
      const rect = canvas.parentElement!.getBoundingClientRect()
      const size = Math.min(rect.width, 400)
      canvas.width = size
      canvas.height = size
      hist.width = rect.width - size - 20
      hist.height = size
      drawCanvas()
      drawHistory()
    })
    ro.observe(canvas.parentElement!)
    return () => ro.disconnect()
  }, [drawCanvas, drawHistory])

  return (
    <AppLayout
      title="Simulation Monte Carlo"
      icon="🎲"
      color={COLOR}
      subtitle="Des points aléatoires dans un carré révèlent π grâce au rapport cercle/carré."
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Stat label="Points lancés" value={stats.total.toLocaleString()} color={COLOR} />
        <Stat label="Dans le cercle" value={stats.inside.toLocaleString()} color="#34d399" />
        <Stat label="Estimation π" value={stats.pi > 0 ? stats.pi.toFixed(6) : '—'} color={COLOR} mono />
        <Stat label="Progression" value={`${((stats.total / MAX_POINTS) * 100).toFixed(1)}%`} />
      </div>

      {stats.pi > 0 && <div style={{ marginBottom: 16 }}><PiCompare estimate={stats.pi} /></div>}

      <Card style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div ref={el => { if (el) {
          const canvas = canvasRef.current!
          canvas.width = 400; canvas.height = 400
        }}} style={{ flex: '0 0 auto' }}>
          <canvas ref={canvasRef} style={{ borderRadius: 12, border: '1px solid rgba(0,229,255,0.15)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <canvas ref={histCanvasRef} style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', width: '100%', height: 200 }} />
          <div style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'center', fontFamily: 'Space Mono' }}>
            Convergence vers π au fil du temps
          </div>
        </div>
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SliderRow label="Vitesse (points/frame)" value={speed} min={50} max={2000} step={50} onChange={setSpeed} color={COLOR}
          format={v => `${v.toLocaleString()}/fr`} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={toggleRun} color={COLOR} active={running}>
            {running ? '⏸ Pause' : stats.total > 0 ? '▶ Reprendre' : '▶ Lancer'}
          </Btn>
          <Btn onClick={reset} color="#f87171">↺ Réinitialiser</Btn>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          Formule : <span style={{ fontFamily: 'Space Mono', color: COLOR }}>π ≈ 4 × (points dans le cercle) / (total points)</span>
          <br />La probabilité qu'un point tombe dans le cercle inscrit est π/4.
        </div>
      </Card>
    </AppLayout>
  )
}
