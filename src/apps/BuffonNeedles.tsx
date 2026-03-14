import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, SliderRow, PiCompare, Card } from './shared'

const COLOR = '#f472b6'
const LINE_SPACING = 60

export default function BuffonNeedles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ crosses: 0, total: 0, needles: [] as { x: number; y: number; angle: number; crosses: boolean }[] })
  const animRef = useRef(0)
  const runningRef = useRef(false)

  const [speed, setSpeed] = useState(5)
  const [needleLen, setNeedleLen] = useState(40)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState({ crosses: 0, total: 0, pi: 0 })

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    // Parallel lines
    const numLines = Math.floor(H / LINE_SPACING) + 1
    for (let i = 0; i <= numLines; i++) {
      const y = i * LINE_SPACING
      ctx.beginPath()
      ctx.moveTo(0, y); ctx.lineTo(W, y)
      ctx.strokeStyle = `${COLOR}33`
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, y); ctx.lineTo(W, y)
      ctx.strokeStyle = `${COLOR}08`
      ctx.lineWidth = 6
      ctx.stroke()
    }

    // Needles (show last 500)
    const needles = stateRef.current.needles.slice(-500)
    needles.forEach(n => {
      const dx = Math.cos(n.angle) * needleLen / 2
      const dy = Math.sin(n.angle) * needleLen / 2
      ctx.beginPath()
      ctx.moveTo(n.x - dx, n.y - dy)
      ctx.lineTo(n.x + dx, n.y + dy)
      ctx.strokeStyle = n.crosses ? `${COLOR}dd` : 'rgba(255,255,255,0.2)'
      ctx.lineWidth = n.crosses ? 2 : 1
      if (n.crosses) { ctx.shadowBlur = 4; ctx.shadowColor = COLOR }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Midpoint
      ctx.beginPath()
      ctx.arc(n.x, n.y, 2, 0, Math.PI * 2)
      ctx.fillStyle = n.crosses ? COLOR : 'rgba(255,255,255,0.3)'
      ctx.fill()
    })
  }, [needleLen])

  const step = useCallback(() => {
    if (!runningRef.current) return
    const s = stateRef.current
    const canvas = canvasRef.current!
    const W = canvas.width, H = canvas.height

    for (let i = 0; i < speed; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      const angle = Math.random() * Math.PI
      const dy = Math.sin(angle) * needleLen / 2
      const y1 = y - dy, y2 = y + dy
      const line1 = Math.floor(y1 / LINE_SPACING) * LINE_SPACING
      const line2 = Math.floor(y2 / LINE_SPACING) * LINE_SPACING
      const crosses = line1 !== line2 || y1 * y2 < 0
        || Math.floor(Math.min(y1, y2) / LINE_SPACING) !== Math.floor(Math.max(y1, y2) / LINE_SPACING)

      if (crosses) s.crosses++
      s.total++
      s.needles.push({ x, y, angle, crosses })
      if (s.needles.length > 2000) s.needles.shift()
    }

    const pi = s.crosses > 0 ? (2 * needleLen * s.total) / (LINE_SPACING * s.crosses) : 0
    setStats({ crosses: s.crosses, total: s.total, pi })
    drawCanvas()
    animRef.current = requestAnimationFrame(step)
  }, [speed, needleLen, drawCanvas])

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
    stateRef.current = { crosses: 0, total: 0, needles: [] }
    setStats({ crosses: 0, total: 0, pi: 0 })
    drawCanvas()
  }, [drawCanvas])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = 600
    canvas.height = 380
    drawCanvas()
  }, [drawCanvas])

  return (
    <AppLayout
      title="Aiguilles de Buffon"
      icon="📍"
      color={COLOR}
      subtitle="Des aiguilles jetées au hasard sur des lignes parallèles estiment π via leur probabilité de croisement."
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Stat label="Aiguilles lancées" value={stats.total.toLocaleString()} />
        <Stat label="Croisements" value={stats.crosses.toLocaleString()} color={COLOR} />
        <Stat label="Estimation π" value={stats.pi > 0 ? stats.pi.toFixed(6) : '—'} color={COLOR} mono />
        <Stat label="Prob. croisement" value={stats.total > 0 ? (stats.crosses / stats.total * 100).toFixed(1) + '%' : '—'} />
      </div>

      {stats.pi > 0 && <div style={{ marginBottom: 16 }}><PiCompare estimate={stats.pi} /></div>}

      <Card style={{ marginBottom: 16 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 10, width: '100%', border: '1px solid rgba(244,114,182,0.15)' }} />
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SliderRow label="Vitesse (aiguilles/frame)" value={speed} min={1} max={50} onChange={setSpeed} color={COLOR}
          format={v => `${v}/fr`} />
        <SliderRow label="Longueur aiguille" value={needleLen} min={20} max={LINE_SPACING - 5} onChange={v => { setNeedleLen(v); reset() }}
          color={COLOR} format={v => `${v}px`} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={toggleRun} color={COLOR} active={running}>
            {running ? '⏸ Pause' : '▶ Lancer'}
          </Btn>
          <Btn onClick={reset} color="#f87171">↺ Reset</Btn>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          Formule de Buffon : <span style={{ fontFamily: 'Space Mono', color: COLOR }}>π ≈ 2L·N / (D·C)</span>
          <br />L = longueur aiguille, D = espacement lignes, N = total, C = croisements
        </div>
      </Card>
    </AppLayout>
  )
}
