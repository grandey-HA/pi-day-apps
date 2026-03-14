import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, Card } from './shared'

const COLOR = '#a78bfa'

type Point = [number, number]

function kochSegment(p1: Point, p2: Point): Point[] {
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1]
  const p3: Point = [p1[0] + dx / 3, p1[1] + dy / 3]
  const p5: Point = [p1[0] + 2 * dx / 3, p1[1] + 2 * dy / 3]
  const p4: Point = [
    p3[0] + (dx / 3) * Math.cos(-Math.PI / 3) - (dy / 3) * Math.sin(-Math.PI / 3),
    p3[1] + (dx / 3) * Math.sin(-Math.PI / 3) + (dy / 3) * Math.cos(-Math.PI / 3),
  ]
  return [p1, p3, p4, p5, p2]
}

function kochSnowflake(iterations: number, size: number, cx: number, cy: number): Point[][] {
  const h = size * Math.sqrt(3) / 2
  let trianglePoints: Point[] = [
    [cx, cy - h * 2 / 3],
    [cx + size / 2, cy + h / 3],
    [cx - size / 2, cy + h / 3],
    [cx, cy - h * 2 / 3],
  ]

  let segments: Point[][] = []
  for (let i = 0; i < trianglePoints.length - 1; i++) {
    segments.push([trianglePoints[i], trianglePoints[i + 1]])
  }

  for (let iter = 0; iter < iterations; iter++) {
    const newSegments: Point[][] = []
    for (const [p1, p2] of segments) {
      const pts = kochSegment(p1, p2)
      for (let i = 0; i < pts.length - 1; i++) {
        newSegments.push([pts[i], pts[i + 1]])
      }
    }
    segments = newSegments
  }

  return segments
}

export default function KochFractal() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [iterations, setIterations] = useState(0)
  const [showPi, setShowPi] = useState(true)

  const numSegments = 3 * Math.pow(4, iterations)
  const segLength = Math.pow(1 / 3, iterations)
  const perimeter = 3 * numSegments * segLength // relative to initial side = 1

  const draw = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    const size = Math.min(W, H) * 0.8
    const segments = kochSnowflake(iterations, size, W / 2, H / 2 + size * 0.05)

    // Draw snowflake
    if (segments.length > 0) {
      ctx.beginPath()
      ctx.moveTo(segments[0][0][0], segments[0][0][1])
      for (const [, p2] of segments) {
        ctx.lineTo(p2[0], p2[1])
      }
      ctx.closePath()
      ctx.fillStyle = `${COLOR}10`
      ctx.fill()

      // Gradient stroke
      segments.forEach(([p1, p2], i) => {
        const hue = 270 + (i / segments.length) * 40
        ctx.beginPath()
        ctx.moveTo(p1[0], p1[1])
        ctx.lineTo(p2[0], p2[1])
        ctx.strokeStyle = `hsl(${hue}, 70%, 70%)`
        ctx.lineWidth = Math.max(0.5, 2 - iterations * 0.3)
        ctx.stroke()
      })

      // Glow pass
      ctx.beginPath()
      ctx.moveTo(segments[0][0][0], segments[0][0][1])
      for (const [, p2] of segments) ctx.lineTo(p2[0], p2[1])
      ctx.strokeStyle = `${COLOR}44`
      ctx.lineWidth = Math.max(1, 4 - iterations * 0.5)
      ctx.shadowBlur = 12; ctx.shadowColor = COLOR
      ctx.stroke(); ctx.shadowBlur = 0
    }

    if (showPi) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '12px Space Mono'
      ctx.fillText(`Itération ${iterations} · ${numSegments.toLocaleString()} segments`, 12, 22)
      ctx.fillText(`Périmètre relatif = (4/3)^${iterations} = ${perimeter.toFixed(4)}`, 12, 38)
      ctx.fillStyle = COLOR
      ctx.font = 'bold 13px Space Mono'
      ctx.fillText(`Périmètre → ∞ mais aire → finie!`, 12, 58)
    }
  }, [iterations, showPi, numSegments, segLength, perimeter])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = 520; canvas.height = 480
    draw()
  }, [draw])

  return (
    <AppLayout
      title="Flocon de Koch et π"
      icon="❄"
      color={COLOR}
      subtitle="Le flocon de Koch a un périmètre infini mais une aire finie — et π se cache dans ses cercles limitants."
    >
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Stat label="Itérations" value={iterations.toString()} color={COLOR} />
        <Stat label="Segments" value={numSegments.toLocaleString()} />
        <Stat label="Longueur seg." value={segLength.toFixed(6)} color="#fbbf24" mono />
        <Stat label="Périmètre relatif" value={perimeter.toFixed(4)} color={COLOR} mono />
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Card style={{ flex: '0 0 auto' }}>
          <canvas ref={canvasRef} style={{ borderRadius: 10, border: `1px solid ${COLOR}22` }} />
        </Card>

        <Card style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLOR, marginBottom: 12 }}>π dans les fractales</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'Space Mono', color: COLOR, marginBottom: 4 }}>Aire du flocon</div>
              <div style={{ color: 'var(--text2)' }}>A = (2√3/5) × s² converge</div>
              <div style={{ fontFamily: 'Space Mono', color: '#fbbf24', marginTop: 4 }}>
                A∞ = (8/5) × A₀
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'Space Mono', color: COLOR, marginBottom: 4 }}>Dimension fractale</div>
              <div style={{ fontFamily: 'Space Mono', color: '#34d399' }}>
                d = log(4)/log(3) ≈ 1.2619
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'Space Mono', color: COLOR, marginBottom: 4 }}>Cercle inscrit</div>
              <div style={{ color: 'var(--text2)' }}>Rayon du cercle inscrit dans<br />le triangle équilatéral initial :</div>
              <div style={{ fontFamily: 'Space Mono', color: '#fbbf24', marginTop: 4 }}>
                r = s/(2√3) → circumférence = πs/√3
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontFamily: 'Space Mono', color: COLOR, marginBottom: 4 }}>Périmètre → ∞</div>
              <div style={{ color: 'var(--text2)' }}>Chaque itération ×(4/3)</div>
              <div style={{ fontFamily: 'Space Mono', color: '#f87171', marginTop: 4 }}>
                P_n = 3 × (4/3)^n → ∞
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {[0, 1, 2, 3, 4, 5, 6].map(n => (
          <Btn key={n} onClick={() => setIterations(n)} color={COLOR} active={iterations === n}>n={n}</Btn>
        ))}
        <Btn onClick={() => setShowPi(v => !v)} color="#fbbf24" active={showPi}>Infos</Btn>
      </Card>
    </AppLayout>
  )
}
