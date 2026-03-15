import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Card, Stat } from './shared'

const COLOR = '#2dd4bf'

interface CircleData {
  id: number
  cx: number
  cy: number
  r: number
  diameter: number
  circumference: number
  ratio: number
  color: string
}

const COLORS = ['#00e5ff', '#f472b6', '#fbbf24', '#34d399', '#a78bfa', '#fb923c', '#2dd4bf']

export default function PiCircles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef<{ active: boolean; startX: number; startY: number; cx: number; cy: number }>({ active: false, startX: 0, startY: 0, cx: 0, cy: 0 })
  const [circles, setCircles] = useState<CircleData[]>([])
  const [avgPi, setAvgPi] = useState(0)
  const [hint, setHint] = useState(true)

  const drawAll = useCallback((circs: CircleData[], drawing?: { cx: number; cy: number; r: number }) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height

    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke() }
    for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke() }

    // Circles
    circs.forEach((c, idx) => {
      const col = COLORS[idx % COLORS.length]
      // Fill
      ctx.beginPath(); ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
      ctx.fillStyle = col + '12'; ctx.fill()
      // Stroke
      ctx.beginPath(); ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2)
      ctx.strokeStyle = col + 'cc'; ctx.lineWidth = 2
      ctx.shadowBlur = 8; ctx.shadowColor = col; ctx.stroke(); ctx.shadowBlur = 0
      // Diameter line
      ctx.beginPath(); ctx.moveTo(c.cx - c.r, c.cy); ctx.lineTo(c.cx + c.r, c.cy)
      ctx.strokeStyle = col + '66'; ctx.lineWidth = 1; ctx.stroke()
      // Label
      ctx.fillStyle = col; ctx.font = 'bold 11px Space Mono'
      ctx.textAlign = 'center'
      ctx.fillText(`π≈${c.ratio.toFixed(3)}`, c.cx, c.cy - c.r - 6)
      ctx.fillText(`d=${c.diameter.toFixed(0)}`, c.cx, c.cy + c.r + 14)
      ctx.textAlign = 'left'
    })

    // Current drawing preview
    if (drawing && drawing.r > 5) {
      ctx.beginPath(); ctx.arc(drawing.cx, drawing.cy, drawing.r, 0, Math.PI * 2)
      ctx.strokeStyle = COLOR + 'aa'; ctx.lineWidth = 2
      ctx.setLineDash([6, 4]); ctx.stroke(); ctx.setLineDash([])
      ctx.beginPath(); ctx.arc(drawing.cx, drawing.cy, 3, 0, Math.PI * 2)
      ctx.fillStyle = COLOR; ctx.fill()
    }

    if (hint && circs.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.font = '15px Space Grotesk'
      ctx.textAlign = 'center'
      ctx.fillText('Cliquez et glissez pour dessiner un cercle', W / 2, H / 2)
      ctx.fillText('Chaque cercle mesure π = C/D', W / 2, H / 2 + 24)
      ctx.textAlign = 'left'
    }
  }, [hint])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = 560; canvas.height = 320
    drawAll(circles)
  }, [drawAll, circles])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const scaleX = canvasRef.current!.width / rect.width
    const scaleY = canvasRef.current!.height / rect.height
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e)
    drawingRef.current = { active: true, startX: x, startY: y, cx: x, cy: y }
    setHint(false)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active) return
    const { x, y } = getPos(e)
    const d = drawingRef.current
    const cx = (d.startX + x) / 2
    const cy = (d.startY + y) / 2
    const r = Math.sqrt((x - d.startX) ** 2 + (y - d.startY) ** 2) / 2
    d.cx = cx; d.cy = cy
    drawAll(circles, { cx, cy, r })
  }, [circles, drawAll])

  const onMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active) return
    const { x, y } = getPos(e)
    const d = drawingRef.current
    d.active = false
    const cx = (d.startX + x) / 2
    const cy = (d.startY + y) / 2
    const r = Math.sqrt((x - d.startX) ** 2 + (y - d.startY) ** 2) / 2
    if (r < 10) { drawAll(circles); return }

    const diameter = r * 2
    const circumference = 2 * Math.PI * r // real circumference for canvas drawing
    const ratio = circumference / diameter

    const newCircle: CircleData = {
      id: Date.now(), cx, cy, r,
      diameter, circumference, ratio,
      color: COLORS[circles.length % COLORS.length],
    }
    const newCircles = [...circles, newCircle]
    setCircles(newCircles)
    const avg = newCircles.reduce((s, c) => s + c.ratio, 0) / newCircles.length
    setAvgPi(avg)
  }, [circles, drawAll])

  return (
    <AppLayout title="π dans les Cercles" icon="○" color={COLOR}
      subtitle="Dessinez des cercles sur le canvas : chaque cercle calcule π = C/D en temps réel.">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Stat label="Cercles dessinés" value={circles.length.toString()} color={COLOR} />
        <Stat label="π moyen" value={avgPi > 0 ? avgPi.toFixed(6) : '—'} color={COLOR} mono />
        <Stat label="π réel" value={Math.PI.toFixed(6)} color="#fbbf24" mono />
        <Stat label="Erreur moy." value={avgPi > 0 ? Math.abs(avgPi - Math.PI).toExponential(2) : '—'} />
      </div>

      <Card style={{ marginBottom: 8 }}>
        <canvas ref={canvasRef}
          style={{ borderRadius: 10, width: '100%', cursor: 'crosshair', border: `1px solid ${COLOR}22`, userSelect: 'none' }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
          onMouseLeave={() => { if (drawingRef.current.active) { drawingRef.current.active = false; drawAll(circles) } }}
        />
      </Card>

      {circles.length > 0 && (
        <Card style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Résultats
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {circles.map((c, i) => (
              <div key={c.id} style={{
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS[i % COLORS.length]}44`,
                borderRadius: 8, padding: '8px 12px', fontSize: 12,
              }}>
                <div style={{ color: COLORS[i % COLORS.length], fontFamily: 'Space Mono', fontWeight: 700 }}>
                  #{i + 1}
                </div>
                <div style={{ color: 'var(--text2)' }}>d={c.diameter.toFixed(0)}px</div>
                <div style={{ fontFamily: 'Space Mono', color: Math.abs(c.ratio - Math.PI) < 0.01 ? '#34d399' : 'var(--text)' }}>
                  π≈{c.ratio.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={() => { setCircles([]); setAvgPi(0); setHint(true) }}
          style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)', color: '#f87171' }}>
          ↺ Effacer tout
        </button>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          Le canvas utilise la circonférence <span style={{ fontFamily: 'Space Mono', color: COLOR }}>C = 2πr</span> — toujours exactement π!
        </div>
      </Card>
    </AppLayout>
  )
}
