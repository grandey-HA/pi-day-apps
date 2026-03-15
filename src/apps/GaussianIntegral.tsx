import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, SliderRow, Card } from './shared'

const COLOR = '#34d399'


export default function GaussianIntegral() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [xMax, setXMax] = useState(3)
  const [samples, setSamples] = useState(5000)
  const [result, setResult] = useState(0)
  const [points, setPoints] = useState<{ x: number; y: number; under: boolean }[]>([])
  const [running, setRunning] = useState(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const PAD = 40

    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    const chartW = W - PAD * 2
    const chartH = H - PAD * 2
    const toX = (x: number) => PAD + ((x + xMax) / (2 * xMax)) * chartW
    const toY = (y: number) => PAD + chartH - y * chartH

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath(); ctx.moveTo(PAD + i * chartW / 10, PAD); ctx.lineTo(PAD + i * chartW / 10, PAD + chartH); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(PAD, PAD + i * chartH / 10); ctx.lineTo(W - PAD, PAD + i * chartH / 10); ctx.stroke()
    }

    // Points
    points.slice(-2000).forEach(p => {
      const px = toX(p.x * xMax)
      const py = toY(p.y)
      ctx.beginPath()
      ctx.arc(px, py, 2, 0, Math.PI * 2)
      ctx.fillStyle = p.under ? `${COLOR}88` : 'rgba(248,113,113,0.4)'
      ctx.fill()
    })

    // Gaussian curve
    ctx.beginPath()
    for (let i = 0; i <= 200; i++) {
      const x = -xMax + (i / 200) * 2 * xMax
      const y = Math.exp(-x * x)
      const px = toX(x), py = toY(y)
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.strokeStyle = COLOR
    ctx.lineWidth = 2.5
    ctx.shadowBlur = 8; ctx.shadowColor = COLOR
    ctx.stroke(); ctx.shadowBlur = 0

    // Fill under curve
    ctx.beginPath()
    for (let i = 0; i <= 200; i++) {
      const x = -xMax + (i / 200) * 2 * xMax
      const y = Math.exp(-x * x)
      const px = toX(x), py = toY(y)
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
    }
    ctx.lineTo(toX(xMax), toY(0))
    ctx.lineTo(toX(-xMax), toY(0))
    ctx.closePath()
    ctx.fillStyle = `${COLOR}18`
    ctx.fill()

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, PAD + chartH); ctx.lineTo(W - PAD, PAD + chartH)
    ctx.moveTo(W / 2, PAD); ctx.lineTo(W / 2, PAD + chartH)
    ctx.stroke()

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px Space Mono'
    for (let x = -Math.floor(xMax); x <= Math.floor(xMax); x++) {
      if (x === 0) continue
      ctx.fillText(String(x), toX(x) - 4, PAD + chartH + 14)
    }

    // Annotation
    ctx.fillStyle = COLOR
    ctx.font = 'bold 13px Space Mono'
    ctx.fillText(`∫e⁻ˣ² dx ≈ ${result.toFixed(5)}`, PAD + 8, PAD + 20)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px Space Mono'
    ctx.fillText(`√π = ${Math.sqrt(Math.PI).toFixed(5)}`, PAD + 8, PAD + 36)
  }, [xMax, points, result])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = 600; canvas.height = 250
    draw()
  }, [draw])

  const runMonteCarlo = useCallback(() => {
    setRunning(true)
    const newPoints: { x: number; y: number; under: boolean }[] = []
    let hits = 0

    for (let i = 0; i < samples; i++) {
      const x = Math.random() * 2 - 1 // [-1,1] -> scaled by xMax
      const y = Math.random()
      const under = y < Math.exp(-((x * xMax) * (x * xMax)))
      if (under) hits++
      newPoints.push({ x, y, under })
    }

    const estimate = (hits / samples) * 2 * xMax
    setResult(estimate)
    setPoints(newPoints)
    setRunning(false)
  }, [samples, xMax])

  return (
    <AppLayout
      title="Intégrale Gaussienne"
      icon="∫"
      color={COLOR}
      subtitle="L'intégrale ∫e⁻ˣ² dx sur ℝ vaut √π — une des identités les plus surprenantes des mathématiques."
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Stat label="Estimation ∫e⁻ˣ²" value={result > 0 ? result.toFixed(6) : '—'} color={COLOR} mono />
        <Stat label="√π (vraie valeur)" value={Math.sqrt(Math.PI).toFixed(6)} color="#fbbf24" mono />
        <Stat label="Erreur" value={result > 0 ? Math.abs(result - Math.sqrt(Math.PI)).toExponential(2) : '—'} />
        <Stat label="Échantillons" value={samples.toLocaleString()} />
      </div>

      <Card style={{ marginBottom: 8 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 10, width: '100%', border: '1px solid rgba(52,211,153,0.15)' }} />
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SliderRow label="Limite d'intégration ±" value={xMax} min={1} max={5} step={0.5} onChange={v => { setXMax(v); setPoints([]) }}
          color={COLOR} format={v => `±${v}`} />
        <SliderRow label="Nombre d'échantillons" value={samples} min={100} max={20000} step={100} onChange={setSamples}
          color={COLOR} format={v => v.toLocaleString()} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={runMonteCarlo} color={COLOR} active={running} disabled={running}>
            {running ? '⏳ Calcul...' : '▶ Simuler'}
          </Btn>
          <Btn onClick={() => { setPoints([]); setResult(0) }} color="#f87171">↺ Reset</Btn>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
          Méthode : <span style={{ fontFamily: 'Space Mono', color: COLOR }}>∫₋∞^∞ e⁻ˣ² dx = √π</span>
          <br />Points verts = sous la courbe (hits), rouges = au-dessus. Ratio × aire = estimation.
        </div>
      </Card>
    </AppLayout>
  )
}
