import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, SliderRow, PiCompare, Card } from './shared'

const COLOR = '#8b5cf6'

export default function BaselSeries() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [terms, setTerms] = useState(1)
  const [autoPlay, setAutoPlay] = useState(false)
  const animRef = useRef(0)

  const maxTerms = 500

  const sum = Array.from({ length: terms }, (_, i) => 1 / ((i + 1) ** 2)).reduce((a, b) => a + b, 0)
  const pi = Math.sqrt(sum * 6)

  const draw = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    const PAD = 40
    const chartW = W - PAD * 2
    const chartH = H - PAD * 2

    // Target line (π²/6)
    const target = Math.PI ** 2 / 6
    const maxVal = target * 1.1

    ctx.strokeStyle = `${COLOR}44`
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    const ty = PAD + chartH - (target / maxVal) * chartH
    ctx.moveTo(PAD, ty); ctx.lineTo(W - PAD, ty)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = COLOR
    ctx.font = '11px Space Mono'
    ctx.fillText('π²/6', W - PAD - 30, ty - 5)

    // Bars + convergence
    const barW = Math.max(1, chartW / Math.min(terms, 120) - 1)
    const visTerms = Math.min(terms, 120)

    let cumSum = 0
    const points: [number, number][] = []

    for (let i = 0; i < visTerms; i++) {
      const term = 1 / ((i + 1) ** 2)
      cumSum += term
      const barH = (term / maxVal) * chartH
      const x = PAD + (i / visTerms) * chartW
      const y = PAD + chartH - barH

      const intensity = i / visTerms
      ctx.fillStyle = `hsla(${270 - intensity * 60}, 70%, ${50 + intensity * 20}%, 0.6)`
      ctx.fillRect(x, y, Math.max(barW - 1, 1), barH)

      points.push([PAD + ((i + 0.5) / visTerms) * chartW, PAD + chartH - (cumSum / maxVal) * chartH])
    }

    // Cumulative sum line
    if (points.length > 1) {
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1])
      }
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.shadowBlur = 6; ctx.shadowColor = '#fbbf24'
      ctx.stroke()
      ctx.shadowBlur = 0

      // Last point
      const last = points[points.length - 1]
      ctx.beginPath()
      ctx.arc(last[0], last[1], 4, 0, Math.PI * 2)
      ctx.fillStyle = '#fbbf24'
      ctx.fill()
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, PAD + chartH); ctx.lineTo(W - PAD, PAD + chartH)
    ctx.stroke()

    // Labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '10px Space Mono'
    ctx.fillText('n', W - PAD + 4, PAD + chartH + 4)
    ctx.fillText('1/n²', PAD - 35, PAD + 4)

    // Total info
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '11px Space Mono'
    ctx.fillText(`Σ(1/n²) = ${sum.toFixed(6)}  →  √(6·Σ) = ${pi.toFixed(6)}`, PAD, PAD - 10)
  }, [terms, sum, pi])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = 600; canvas.height = 240
    draw()
  }, [draw])

  useEffect(() => {
    if (!autoPlay) { cancelAnimationFrame(animRef.current); return }
    const tick = () => {
      setTerms(t => {
        if (t >= maxTerms) { setAutoPlay(false); return t }
        return Math.min(t + Math.ceil(t / 10 + 1), maxTerms)
      })
      animRef.current = requestAnimationFrame(tick)
    }
    const id = setTimeout(() => { animRef.current = requestAnimationFrame(tick) }, 100)
    return () => { clearTimeout(id); cancelAnimationFrame(animRef.current) }
  }, [autoPlay])

  return (
    <AppLayout
      title="Série de Basel"
      icon="∑"
      color={COLOR}
      subtitle="La somme de 1/n² converge vers π²/6 — une identité découverte par Euler en 1734."
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Stat label="Termes Σ" value={terms.toLocaleString()} color={COLOR} />
        <Stat label="Σ(1/n²)" value={sum.toFixed(8)} color="#fbbf24" mono />
        <Stat label="√(6·Σ) ≈ π" value={pi.toFixed(8)} color={COLOR} mono />
        <Stat label="Erreur" value={Math.abs(pi - Math.PI).toExponential(2)} />
      </div>

      <div style={{ marginBottom: 8 }}><PiCompare estimate={pi} /></div>

      <Card style={{ marginBottom: 8 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 10, width: '100%', border: '1px solid rgba(139,92,246,0.15)' }} />
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SliderRow label="Nombre de termes" value={terms} min={1} max={maxTerms} onChange={setTerms} color={COLOR}
          format={v => v.toLocaleString()} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={() => setAutoPlay(v => !v)} color={COLOR} active={autoPlay}>
            {autoPlay ? '⏸ Pause' : '▶ Animation'}
          </Btn>
          <Btn onClick={() => { setTerms(1); setAutoPlay(false) }} color="#f87171">↺ Reset</Btn>
          <Btn onClick={() => setTerms(maxTerms)} color={COLOR}>⏭ Max ({maxTerms})</Btn>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
          Identité de Basel : <span style={{ fontFamily: 'Space Mono', color: COLOR }}>∑(1/n²) = π²/6</span>
          <br />Barres violettes = termes individuels 1/n². Ligne dorée = somme cumulée. Pointillé = π²/6.
        </div>
      </Card>
    </AppLayout>
  )
}
