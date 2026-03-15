import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, SliderRow, Card } from './shared'

const COLOR = '#f59e0b'

// ── Canvas layout constants ──────────────────────────────────────────────────
const CW = 580, CH = 220
const CY = 110            // pipe center axis

const BORE_W = 76         // bore zone width (left)
const WALL_W = 41         // non-threaded wall zone
const THREAD_L = 340      // thread engagement length
const TX = BORE_W + WALL_W        // 117 = thread zone start x
const TEX = TX + THREAD_L         // 457 = thread zone end x

const WALL_HALF = 34      // half-wall thickness from CY
const TOOTH_H = 13        // thread tooth height (px)
const PITCH = 19          // thread pitch (px, ~ API 8-round scaled)
const TAPER = 11          // outer surface taper over full thread length (px, exagéré pour lisibilité)

const PB = CY - WALL_HALF              // 76  — pin wall inner surface (tooth base, pin)
const PT = PB + TOOTH_H                // 89  — pin tooth tips (pointing DOWN toward center)
const BT = CY + WALL_HALF - TOOTH_H   // 131 — box tooth tips (pointing UP toward center)
const BB = CY + WALL_HALF             // 144 — box wall inner surface (tooth base, box)
const PIN_TOP = 20        // top of pin outer surface (wall top, no taper)
const BOX_BOT = CH - 20  // bottom of box outer surface (wall bottom, no taper)

// ── Physics ──────────────────────────────────────────────────────────────────
function computePhysics(torque: number, pInt: number, pExt: number) {
  const contactMPa = torque * 0.0015         // 0→10000 Nm → 0→15 MPa contact pression flanc
  const sealBar = contactMPa * 48            // 0→720 bar capacité d'étanchéité
  const dP = Math.max(0, pInt - pExt)
  const margin = sealBar - dP
  const leakFactor = Math.max(0, Math.min(1, -margin / 120))
  const status = leakFactor === 0 ? 'ÉTANCHE' : leakFactor < 0.35 ? 'CRITIQUE' : 'FUITE'
  return { contactMPa, sealBar, dP, margin, leakFactor, status }
}

interface Particle { x: number; y: number; speed: number; vy: number }

export default function DuckFriend() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const particlesRef = useRef<Particle[]>([])
  const timeRef = useRef(0)

  const [torque, setTorque] = useState(4500)
  const [pInt, setPInt] = useState(200)
  const [pExt, setPExt] = useState(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const { contactMPa, sealBar, dP, leakFactor } = computePhysics(torque, pInt, pExt)
    timeRef.current += 0.05

    const pNorm = Math.min(1, pInt / 700)
    const peNorm = Math.min(1, pExt / 500)
    const br = 160 + Math.round(pNorm * 90)
    const bg = 50 + Math.round(pNorm * 30)
    const N = Math.ceil(THREAD_L / PITCH) + 2
    const parts = particlesRef.current

    // ── 1. Background ──────────────────────────────────────────────────────
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, CW, CH)

    // ── 2. Bore fluid channel (inner bore, x=0..TX, y=PB..BB) ─────────────
    const boreFluid = ctx.createLinearGradient(0, PB, 0, BB)
    boreFluid.addColorStop(0, `rgba(${br}, ${bg}, 5, 0.98)`)
    boreFluid.addColorStop(0.5, `rgba(${Math.round(br * 0.6)}, ${Math.round(bg * 0.6)}, 0, 0.7)`)
    boreFluid.addColorStop(1, `rgba(${br}, ${bg}, 5, 0.98)`)
    ctx.fillStyle = boreFluid
    ctx.fillRect(0, PB, TX, BB - PB)

    // Pressure arrows in bore
    const arrowCol = leakFactor > 0.4 ? '#ff5533' : COLOR
    ctx.strokeStyle = arrowCol + 'bb'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let ay = PB + 8; ay < BB - 4; ay += 18) {
      ctx.moveTo(8, ay); ctx.lineTo(BORE_W - 10, ay)
      ctx.moveTo(BORE_W - 10, ay); ctx.lineTo(BORE_W - 18, ay - 4)
      ctx.moveTo(BORE_W - 10, ay); ctx.lineTo(BORE_W - 18, ay + 4)
    }
    ctx.stroke()

    // ── 3. Exterior zone (x=TEX..CW) ──────────────────────────────────────
    const extGrad = ctx.createLinearGradient(TEX, 0, CW, 0)
    extGrad.addColorStop(0, `rgba(5, ${50 + Math.round(peNorm * 70)}, ${165 + Math.round(peNorm * 75)}, 0.65)`)
    extGrad.addColorStop(1, 'rgba(3, 14, 50, 0.2)')
    ctx.fillStyle = extGrad
    ctx.fillRect(TEX, 0, CW - TEX, CH)

    // ── 4. PIN steel wall (upper, with taper) ─────────────────────────────
    const steelPin = ctx.createLinearGradient(0, PIN_TOP, 0, PB)
    steelPin.addColorStop(0, '#0b0b1c')
    steelPin.addColorStop(0.2, '#1e1e40')
    steelPin.addColorStop(0.5, '#3a3a65')
    steelPin.addColorStop(0.75, '#4f4f72')
    steelPin.addColorStop(1, '#393958')

    // Non-threaded segment
    ctx.fillStyle = steelPin
    ctx.fillRect(0, PIN_TOP, TX, PB - PIN_TOP)

    // Tapered threaded segment (trapezoid: outer surface slopes down toward pin nose)
    ctx.beginPath()
    ctx.moveTo(TX, PIN_TOP)
    ctx.lineTo(TEX, PIN_TOP + TAPER)
    ctx.lineTo(TEX, PB)
    ctx.lineTo(TX, PB)
    ctx.closePath()
    ctx.fill()

    // Metallic sheen
    ctx.strokeStyle = 'rgba(140, 140, 200, 0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, PIN_TOP + (PB - PIN_TOP) * 0.33)
    ctx.lineTo(TX, PIN_TOP + (PB - PIN_TOP) * 0.33)
    ctx.lineTo(TEX, (PIN_TOP + TAPER) + (PB - PIN_TOP - TAPER) * 0.33)
    ctx.stroke()

    // ── 5. BOX steel wall (lower, with taper) ─────────────────────────────
    const steelBox = ctx.createLinearGradient(0, BB, 0, BOX_BOT)
    steelBox.addColorStop(0, '#393958')
    steelBox.addColorStop(0.25, '#4f4f72')
    steelBox.addColorStop(0.5, '#3a3a65')
    steelBox.addColorStop(0.8, '#1e1e40')
    steelBox.addColorStop(1, '#0b0b1c')

    ctx.fillStyle = steelBox
    ctx.fillRect(0, BB, TX, BOX_BOT - BB)

    ctx.beginPath()
    ctx.moveTo(TX, BB)
    ctx.lineTo(TEX, BB)
    ctx.lineTo(TEX, BOX_BOT - TAPER)
    ctx.lineTo(TX, BOX_BOT)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = 'rgba(140, 140, 200, 0.28)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, BB + (BOX_BOT - BB) * 0.67)
    ctx.lineTo(TX, BB + (BOX_BOT - BB) * 0.67)
    ctx.lineTo(TEX, BB + (BOX_BOT - TAPER - BB) * 0.67)
    ctx.stroke()

    // ── 6. Root clearance gap — pressure gradient ─────────────────────────
    const bleed = 0.1 + leakFactor * 0.84
    const gapGrad = ctx.createLinearGradient(TX, 0, TEX, 0)
    gapGrad.addColorStop(0, `rgba(${br}, ${bg}, 0, ${0.55 + pNorm * 0.35})`)
    gapGrad.addColorStop(Math.min(bleed * 0.65, 0.98), `rgba(255, 55, 0, ${leakFactor * 0.7 + 0.04})`)
    gapGrad.addColorStop(Math.min(bleed, 0.99), `rgba(180, 30, 0, ${leakFactor * 0.3})`)
    gapGrad.addColorStop(1, 'rgba(5, 40, 160, 0.07)')
    ctx.fillStyle = gapGrad
    ctx.fillRect(TX, PT, THREAD_L, BT - PT)

    // ── 7. PIN teeth — triangles pointing DOWN ────────────────────────────
    const pinTeeth = ctx.createLinearGradient(0, PB, 0, PT)
    pinTeeth.addColorStop(0, '#3e3e62')
    pinTeeth.addColorStop(1, '#22223c')
    ctx.fillStyle = pinTeeth

    for (let k = 0; k < N; k++) {
      const x0 = TX + k * PITCH
      const xm = x0 + PITCH / 2
      const x1 = x0 + PITCH
      if (x0 >= TEX) break
      const xmC = Math.min(xm, TEX)
      const x1C = Math.min(x1, TEX)
      ctx.beginPath()
      ctx.moveTo(x0, PB); ctx.lineTo(xmC, PT); ctx.lineTo(x1C, PB)
      ctx.closePath(); ctx.fill()
      // Left flank highlight (load flank)
      ctx.strokeStyle = 'rgba(110, 110, 175, 0.32)'
      ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(x0, PB); ctx.lineTo(xmC, PT); ctx.stroke()
    }

    // ── 8. BOX teeth — triangles pointing UP ──────────────────────────────
    const boxTeeth = ctx.createLinearGradient(0, BB, 0, BT)
    boxTeeth.addColorStop(0, '#2c2c48')
    boxTeeth.addColorStop(1, '#42425e')
    ctx.fillStyle = boxTeeth

    for (let k = 0; k < N; k++) {
      const x0 = TX + k * PITCH + PITCH / 2
      const xm = x0 + PITCH / 2
      const x1 = x0 + PITCH
      if (x0 >= TEX) break
      const xmC = Math.min(xm, TEX)
      const x1C = Math.min(x1, TEX)
      ctx.beginPath()
      ctx.moveTo(x0, BB); ctx.lineTo(xmC, BT); ctx.lineTo(x1C, BB)
      ctx.closePath(); ctx.fill()
      // Right flank highlight (stabbing flank)
      ctx.strokeStyle = 'rgba(160, 160, 210, 0.32)'
      ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(xmC, BT); ctx.lineTo(x1C, BB); ctx.stroke()
    }

    // ── 9. Contact zone quads (between pin right flank & box left flank) ──
    const cIntensity = Math.min(1, torque / 8000) * (1 - leakFactor * 0.75)
    const cR = Math.round(leakFactor * 255)
    const cG = Math.round(Math.max(0, (1 - leakFactor) * 205))

    for (let k = 0; k < N - 1; k++) {
      const xm = TX + k * PITCH + PITCH / 2
      const x1 = TX + (k + 1) * PITCH
      if (x1 > TEX) break
      ctx.beginPath()
      ctx.moveTo(xm, PT); ctx.lineTo(x1, PB)
      ctx.lineTo(x1, BB); ctx.lineTo(xm, BT)
      ctx.closePath()
      ctx.fillStyle = `rgba(${cR}, ${cG}, 35, ${0.1 + cIntensity * 0.52})`
      ctx.fill()

      if (cIntensity > 0.12) {
        ctx.shadowBlur = cIntensity > 0.45 ? 6 : 0
        ctx.shadowColor = `rgba(${cR}, ${cG}, 0, 0.5)`
        ctx.strokeStyle = `rgba(${cR}, ${cG}, 55, ${cIntensity * 0.82})`
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(xm, PT); ctx.lineTo(x1, PB); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(xm, BT); ctx.lineTo(x1, BB); ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // ── 10. Leak particles in gap zone ────────────────────────────────────
    if (leakFactor > 0.05) {
      const spawn = leakFactor * 3.5
      for (let i = 0; i < Math.ceil(spawn); i++) {
        if (Math.random() < (i < Math.floor(spawn) ? 1 : spawn % 1)) {
          parts.push({
            x: TX + 2,
            y: PT + 4 + Math.random() * (BT - PT - 8),
            speed: 1.5 + leakFactor * 5 + Math.random() * 2,
            vy: (Math.random() - 0.5) * 0.45,
          })
        }
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      parts[i].x += parts[i].speed
      parts[i].y += parts[i].vy
      if (parts[i].x > TEX || parts[i].y < PT + 1 || parts[i].y > BT - 1) {
        parts.splice(i, 1); continue
      }
      const prog = (parts[i].x - TX) / THREAD_L
      ctx.beginPath()
      ctx.arc(parts[i].x, parts[i].y, Math.max(0.5, 2.5 - prog * 1.5), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, ${90 + Math.round(prog * 80)}, 10, ${0.9 - prog * 0.35})`
      ctx.shadowBlur = 5; ctx.shadowColor = '#ff7700'
      ctx.fill(); ctx.shadowBlur = 0
    }
    if (parts.length > 280) parts.splice(0, parts.length - 280)

    // ── 11. Labels & annotations ──────────────────────────────────────────
    ctx.setLineDash([3, 4])
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(TX, 0); ctx.lineTo(TX, CH); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(TEX, 0); ctx.lineTo(TEX, CH); ctx.stroke()
    ctx.setLineDash([])

    // Inner bore wall lines
    ctx.strokeStyle = `rgba(245, 158, 11, 0.22)`
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, PB); ctx.lineTo(TX, PB); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, BB); ctx.lineTo(TX, BB); ctx.stroke()

    // Pin nose bracket
    ctx.strokeStyle = `rgba(245, 158, 11, 0.45)`
    ctx.lineWidth = 1.5
    const noseTop = PIN_TOP + TAPER + 2, noseBot = BOX_BOT - TAPER - 2
    ctx.beginPath()
    ctx.moveTo(TEX - 3, noseTop); ctx.lineTo(TEX + 7, noseTop)
    ctx.moveTo(TEX + 7, noseTop); ctx.lineTo(TEX + 7, noseBot)
    ctx.moveTo(TEX - 3, noseBot); ctx.lineTo(TEX + 7, noseBot)
    ctx.stroke()

    // Zone labels
    ctx.font = 'bold 9px Space Mono'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#f59e0bdd'
    ctx.fillText('BORE', BORE_W / 2, 13)
    ctx.fillText(`${pInt} bar`, BORE_W / 2, CH - 5)
    ctx.fillStyle = '#6699ccdd'
    ctx.fillText('EXT', TEX + (CW - TEX) / 2, 13)
    ctx.fillText(`${pExt} bar`, TEX + (CW - TEX) / 2, CH - 5)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '8px Space Mono'
    ctx.fillText('PIN ↑', TX + THREAD_L * 0.2, 13)
    ctx.fillText('BOX ↓', TX + THREAD_L * 0.2, CH - 5)

    // Taper annotation
    ctx.fillStyle = 'rgba(245, 158, 11, 0.32)'
    ctx.font = '8px Space Mono'
    ctx.textAlign = 'right'
    ctx.fillText('conicité 1/16"', TEX - 5, PIN_TOP + TAPER - 2)

    // Physics annotation
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.font = '8px Space Mono'
    ctx.textAlign = 'left'
    ctx.fillText(`Pc=${contactMPa.toFixed(1)} MPa   cap.=${Math.round(sealBar)} bar   ΔP=${dP} bar`, TX + 5, 24)
    ctx.fillText(`marge = ${Math.round(sealBar - dP)} bar`, TX + 5, 34)

    // Seal status
    const { status } = computePhysics(torque, pInt, pExt)
    const statusColor = status === 'ÉTANCHE' ? '#34d399' : status === 'CRITIQUE' ? '#fbbf24' : '#f87171'
    const statusIcon = status === 'ÉTANCHE' ? '✓' : status === 'CRITIQUE' ? '⚠' : '✕'
    const pulse = leakFactor > 0 ? 7 + 4 * Math.sin(timeRef.current * 3) : 3
    ctx.shadowBlur = pulse; ctx.shadowColor = statusColor
    ctx.fillStyle = statusColor
    ctx.font = `bold 12px Space Mono`
    ctx.textAlign = 'center'
    ctx.fillText(`${statusIcon} ${status}`, TX + THREAD_L * 0.6, CY + 5)
    ctx.shadowBlur = 0

    // Torque gauge (small arc in bore zone, bottom)
    const gaugeR = 20, gx = BORE_W / 2, gy = CH - 38
    const tNorm = Math.min(1, torque / 10000)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(gx, gy, gaugeR, Math.PI, 0); ctx.stroke()
    ctx.strokeStyle = tNorm > 0.7 ? '#34d399' : tNorm > 0.35 ? COLOR : '#f87171'
    ctx.lineWidth = 3
    ctx.shadowBlur = 5; ctx.shadowColor = ctx.strokeStyle
    ctx.beginPath(); ctx.arc(gx, gy, gaugeR, Math.PI, Math.PI + tNorm * Math.PI); ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '7px Space Mono'
    ctx.textAlign = 'center'
    ctx.fillText('couple', gx, gy + 10)
  }, [torque, pInt, pExt])

  useEffect(() => {
    const canvas = canvasRef.current!
    canvas.width = CW; canvas.height = CH
    const tick = () => { draw(); animRef.current = requestAnimationFrame(tick) }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const { contactMPa, sealBar, dP, leakFactor, status } = computePhysics(torque, pInt, pExt)

  const presets = [
    { label: 'Zéro', t: 0, pi: 0, pe: 0, color: '#6b7280' },
    { label: 'API std', t: 4500, pi: 350, pe: 0, color: COLOR },
    { label: 'HP', t: 8000, pi: 700, pe: 0, color: '#34d399' },
    { label: 'Fuite', t: 1000, pi: 500, pe: 0, color: '#f87171' },
    { label: 'Diff ext', t: 5000, pi: 100, pe: 400, color: '#a78bfa' },
  ]

  return (
    <AppLayout
      title="Duck Friend — Connexion API Filetée"
      icon="🦆"
      color={COLOR}
      subtitle={'Coupe 2D d\'une connexion API 8-round (60°, 8 TPI, conicité 1/16"). Étanchéité par contact de flanc. Modèle simplifié.'}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Stat label="Contact flanc" value={`${contactMPa.toFixed(1)} MPa`} color={COLOR} mono />
        <Stat label="Cap. étanchéité" value={`${Math.round(sealBar)} bar`} color={contactMPa > 5 ? '#34d399' : '#fbbf24'} mono />
        <Stat label="ΔP (int−ext)" value={`${dP} bar`} color={dP > sealBar ? '#f87171' : '#34d399'} mono />
        <Stat label="Statut" value={status} color={status === 'ÉTANCHE' ? '#34d399' : status === 'CRITIQUE' ? '#fbbf24' : '#f87171'} />
        <Stat label="Fuite" value={leakFactor > 0 ? `${(leakFactor * 100).toFixed(0)}%` : '—'} color="#f87171" />
      </div>

      <Card style={{ marginBottom: 8 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 10, width: '100%', border: `1px solid ${COLOR}22` }} />
      </Card>

      <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SliderRow label="Couple de serrage (Nm)" value={torque} min={0} max={10000} step={100}
          onChange={setTorque} color={COLOR} format={v => `${v.toLocaleString()} Nm`} />
        <SliderRow label="Pression interne (bar)" value={pInt} min={0} max={700} step={5}
          onChange={setPInt} color="#f87171" format={v => `${v} bar`} />
        <SliderRow label="Pression externe (bar)" value={pExt} min={0} max={500} step={5}
          onChange={setPExt} color="#6699cc" format={v => `${v} bar`} />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {presets.map(p => (
            <Btn key={p.label} color={p.color}
              onClick={() => { setTorque(p.t); setPInt(p.pi); setPExt(p.pe) }}>
              {p.label}
            </Btn>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>
          <div>
            <div style={{ color: COLOR, fontWeight: 600, marginBottom: 2 }}>Modèle physique</div>
            <div>P<sub>c</sub> = couple × 0.0015 MPa/Nm</div>
            <div>Cap. = P<sub>c</sub> × 48 bar/MPa</div>
            <div>Fuite si ΔP {'>'} capacité</div>
          </div>
          <div>
            <div style={{ color: COLOR, fontWeight: 600, marginBottom: 2 }}>Géométrie API 8-round</div>
            <div>Flancs 60° · 8 TPI · conicité 1/16"</div>
            <div>Étanchéité : contact de flanc</div>
            <div>Jeu au sommet (root clearance)</div>
          </div>
        </div>
      </Card>
    </AppLayout>
  )
}
