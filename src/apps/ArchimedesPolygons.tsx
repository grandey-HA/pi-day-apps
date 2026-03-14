import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, PiCompare, Card } from './shared'

const COLOR = '#fbbf24'

function polygonPi(n: number) {
  // Inner: n * sin(π/n), outer: n * tan(π/n)
  const inner = n * Math.sin(Math.PI / n)
  const outer = n * Math.tan(Math.PI / n)
  return { inner, outer }
}

export default function ArchimedesPolygons() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sides, setSides] = useState(6)
  const [showOuter, setShowOuter] = useState(true)
  const [animating, setAnimating] = useState(false)
  const animRef = useRef(0)

  const { inner, outer } = polygonPi(sides)
  const estimate = (inner + outer) / 2

  const draw = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 30

    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    // Glow circle
    const grad = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.1)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(1, `${COLOR}08`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2)
    ctx.fill()

    // Reference circle
    ctx.beginPath()
    ctx.arc(cx, cy, R, 0, Math.PI * 2)
    ctx.strokeStyle = `${COLOR}66`
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Outer polygon (circumscribed)
    if (showOuter) {
      const Rout = R / Math.cos(Math.PI / sides)
      ctx.beginPath()
      for (let i = 0; i <= sides; i++) {
        const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
        const x = cx + Rout * Math.cos(angle)
        const y = cy + Rout * Math.sin(angle)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.strokeStyle = '#f87171aa'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#f8717108'
      ctx.fill()
    }

    // Inner polygon (inscribed)
    ctx.beginPath()
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
      const x = cx + R * Math.cos(angle)
      const y = cy + R * Math.sin(angle)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.strokeStyle = COLOR
    ctx.lineWidth = 2
    ctx.shadowBlur = 8; ctx.shadowColor = COLOR
    ctx.stroke(); ctx.shadowBlur = 0
    ctx.fillStyle = `${COLOR}0a`
    ctx.fill()

    // Vertices
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
      ctx.beginPath()
      ctx.arc(cx + R * Math.cos(angle), cy + R * Math.sin(angle), 3, 0, Math.PI * 2)
      ctx.fillStyle = COLOR
      ctx.fill()
    }

    // Center
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill()

    // Radius line
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + R, cy)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.stroke()

    // Labels
    ctx.fillStyle = COLOR
    ctx.font = 'bold 13px Space Mono'
    ctx.fillText(`n = ${sides} côtés`, cx - W / 2 + 12, cy - R + 12)
  }, [sides, showOuter])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = 440; canvas.height = 440
    draw()
  }, [draw])

  const toggleAnim = useCallback(() => {
    if (animating) {
      cancelAnimationFrame(animRef.current)
      setAnimating(false)
    } else {
      setAnimating(true)
      const tick = () => {
        setSides(s => {
          if (s >= 256) { setAnimating(false); return s }
          return s * 2
        })
        animRef.current = requestAnimationFrame(() => setTimeout(tick, 400))
      }
      animRef.current = requestAnimationFrame(() => setTimeout(tick, 400))
    }
  }, [animating])

  return (
    <AppLayout
      title="Polygones d'Archimède"
      icon="⬡"
      color={COLOR}
      subtitle="Archimède encadre π entre le périmètre du polygone inscrit et du polygone circonscrit."
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Stat label="Côtés" value={sides.toString()} color={COLOR} />
        <Stat label="Borne inf (inscrit)" value={inner.toFixed(8)} color={COLOR} mono />
        <Stat label="Borne sup (circonf.)" value={outer.toFixed(8)} color="#f87171" mono />
        <Stat label="Moyenne ≈ π" value={estimate.toFixed(8)} mono />
      </div>

      <div style={{ marginBottom: 16 }}><PiCompare estimate={estimate} /></div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Card style={{ flex: '0 0 auto' }}>
          <canvas ref={canvasRef} style={{ borderRadius: 10, border: '1px solid rgba(251,191,36,0.15)' }} />
        </Card>

        <Card style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: COLOR }}>Encadrement d'Archimède</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[6, 12, 24, 48, 96, 192, 256, 1024, 4096].map(n => {
              const { inner: i, outer: o } = polygonPi(n)
              const active = n === sides
              return (
                <button
                  key={n}
                  onClick={() => setSides(n)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: active ? `${COLOR}18` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${active ? COLOR : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 8, padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ color: active ? COLOR : 'var(--text2)', fontSize: 12, fontFamily: 'Space Mono' }}>n={n}</span>
                  <span style={{ color: 'var(--text2)', fontSize: 10, fontFamily: 'Space Mono' }}>
                    [{i.toFixed(4)}, {o.toFixed(4)}]
                  </span>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      <Card style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Btn onClick={() => setSides(s => Math.max(3, s - (s <= 12 ? 1 : s <= 48 ? 4 : Math.floor(s / 4))))} color={COLOR}>
          ← Moins
        </Btn>
        <Btn onClick={() => setSides(s => s * 2)} color={COLOR} disabled={sides > 1_000_000}>× 2</Btn>
        <Btn onClick={toggleAnim} color={COLOR} active={animating}>
          {animating ? '⏸ Stop' : '▶ Auto ×2'}
        </Btn>
        <Btn onClick={() => { setShowOuter(v => !v) }} color="#f87171" active={showOuter}>
          {showOuter ? '👁 Cacher' : '👁 Montrer'} circonscrit
        </Btn>
        <Btn onClick={() => setSides(6)} color="#f87171">↺ Reset</Btn>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'Space Mono', marginLeft: 8 }}>
          {inner.toFixed(6)} &lt; <span style={{ color: COLOR }}>π</span> &lt; {outer.toFixed(6)}
        </div>
      </Card>
    </AppLayout>
  )
}
