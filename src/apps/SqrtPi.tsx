import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Card } from './shared'

const COLOR = '#f87171'

export default function SqrtPi() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spiralCanvasRef = useRef<HTMLCanvasElement>(null)
  const [t, setT] = useState(0)
  const animRef = useRef(0)
  const [animating, setAnimating] = useState(true)

  const sqrtPi = Math.sqrt(Math.PI)

  const drawSpiral = useCallback((time: number) => {
    const canvas = spiralCanvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2
    const maxR = Math.min(W, H) / 2 - 20

    // √π spiral: as θ goes from 0 to 2π, the total arc length involves √π
    // Cornu spiral / Fresnel integral inspired
    const steps = 800
    const maxTheta = time * 0.8 + 0.01

    ctx.beginPath()
    let prevX = cx, prevY = cy
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * maxTheta
      const r = maxR * Math.sqrt(theta / (Math.PI * 2)) * sqrtPi * 0.6
      const x = cx + r * Math.cos(theta)
      const y = cy + r * Math.sin(theta)
      const progress = i / steps
      ctx.strokeStyle = `hsl(${0 + progress * 30}, 70%, ${50 + progress * 20}%)`
      ctx.lineWidth = 1.5 + progress * 1.5
      if (i > 0) {
        ctx.beginPath()
        ctx.moveTo(prevX, prevY)
        ctx.lineTo(x, y)
        ctx.shadowBlur = 4; ctx.shadowColor = COLOR
        ctx.stroke()
        ctx.shadowBlur = 0
      }
      prevX = x; prevY = y
    }

    // √π label in center
    ctx.fillStyle = COLOR
    ctx.font = 'bold 20px Space Mono'
    ctx.textAlign = 'center'
    ctx.fillText(`√π ≈ ${sqrtPi.toFixed(6)}`, cx, cy - 10)
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '12px Space Mono'
    ctx.fillText(`θ = ${(maxTheta / Math.PI).toFixed(2)}π`, cx, cy + 12)
    ctx.textAlign = 'left'
  }, [sqrtPi])

  const drawProof = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    // Show the geometric proof: area under Gaussian = √π
    // Quarter circle with r=1 has area π/4, full circle = π = (√π)²
    const PAD = 40
    const R = (Math.min(W, H) - PAD * 2) / 2
    const cx = PAD + R, cy = PAD + R

    // Glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
    grad.addColorStop(0, `${COLOR}18`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill()

    // Full circle = (√π)²
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.strokeStyle = `${COLOR}66`
    ctx.lineWidth = 1; ctx.stroke()

    // Quarter filled
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, R, 0, Math.PI / 2)
    ctx.closePath()
    ctx.fillStyle = `${COLOR}22`
    ctx.fill()
    ctx.strokeStyle = COLOR; ctx.lineWidth = 2
    ctx.shadowBlur = 6; ctx.shadowColor = COLOR
    ctx.stroke(); ctx.shadowBlur = 0

    // Radius
    ctx.beginPath()
    ctx.moveTo(cx, cy); ctx.lineTo(cx + R, cy)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '11px Space Mono'
    ctx.fillText('r = 1', cx + R / 2 - 15, cy - 6)

    // √π label
    ctx.fillStyle = COLOR
    ctx.font = 'bold 14px Space Mono'
    ctx.fillText(`A = π·r² = π`, cx - 30, cy + 50)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '11px Space Mono'
    ctx.fillText(`√(π) = ${sqrtPi.toFixed(6)}`, cx - 30, cy + 68)

    // Side of equivalent square
    const sqSide = sqrtPi * R / 1
    ctx.beginPath()
    ctx.strokeStyle = '#8b5cf6'
    ctx.lineWidth = 1.5
    ctx.strokeRect(cx + R + 20, cy - sqSide / 2, sqSide, sqSide)
    ctx.fillStyle = '#8b5cf644'
    ctx.fillRect(cx + R + 20, cy - sqSide / 2, sqSide, sqSide)
    ctx.fillStyle = '#8b5cf6'
    ctx.font = '11px Space Mono'
    ctx.fillText(`carré = (√π)²`, cx + R + 24, cy - sqSide / 2 - 6)
  }, [sqrtPi])

  useEffect(() => {
    const canvas = canvasRef.current!
    const spiral = spiralCanvasRef.current!
    canvas.width = 300; canvas.height = 300
    spiral.width = 300; spiral.height = 300
    drawProof()
  }, [drawProof])

  useEffect(() => {
    if (!animating) return
    let time = t
    const tick = () => {
      time += 0.04
      if (time > Math.PI * 8) time = 0
      setT(time)
      drawSpiral(time)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [animating, drawSpiral, t])

  return (
    <AppLayout
      title="Racine Carrée de π"
      icon="√"
      color={COLOR}
      subtitle="√π ≈ 1.7724538... apparaît dans l'intégrale gaussienne et la fonction Gamma : Γ(1/2) = √π."
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Stat label="√π" value={sqrtPi.toFixed(8)} color={COLOR} mono />
        <Stat label="(√π)²" value={Math.PI.toFixed(8)} color="#8b5cf6" mono />
        <Stat label="Γ(1/2)" value={sqrtPi.toFixed(8)} color="#fbbf24" mono />
        <Stat label="erf(∞)" value="1.000000" />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Card style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>Spirale de √π</div>
          <canvas ref={spiralCanvasRef} style={{ borderRadius: 10, border: `1px solid ${COLOR}33` }} />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button
              onClick={() => setAnimating(v => !v)}
              style={{
                padding: '6px 14px', fontSize: 12, borderRadius: 7,
                background: animating ? `${COLOR}22` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${animating ? COLOR : 'rgba(255,255,255,0.1)'}`,
                color: animating ? COLOR : 'var(--text)', cursor: 'pointer',
              }}
            >{animating ? '⏸ Pause' : '▶ Animer'}</button>
          </div>
        </Card>

        <Card style={{ flex: '0 0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>Preuve géométrique</div>
          <canvas ref={canvasRef} style={{ borderRadius: 10, border: `1px solid ${COLOR}33` }} />
        </Card>

        <Card style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLOR, marginBottom: 12 }}>Apparitions de √π</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { formula: '∫₋∞^∞ e⁻ˣ² dx', value: '= √π', label: 'Intégrale gaussienne' },
              { formula: 'Γ(1/2)', value: '= √π', label: 'Fonction Gamma' },
              { formula: '∫₀^∞ e⁻ˣ/√x dx', value: '= √π', label: 'Autre forme Gamma' },
              { formula: 'erf(x) → 1', value: '∫₀^∞ = √π/2', label: 'Fonction erreur' },
              { formula: '√π / 2', value: `= ${(sqrtPi/2).toFixed(6)}`, label: 'Prob. normale' },
            ].map(item => (
              <div key={item.formula} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontFamily: 'Space Mono', fontSize: 13, color: COLOR }}>
                  {item.formula} <span style={{ color: '#fbbf24' }}>{item.value}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
