import { useRef, useEffect, useState, useCallback } from 'react'
import { AppLayout, Stat, Btn, SliderRow, Card } from './shared'

const COLOR = '#f59e0b'

// ── Canvas ─────────────────────────────────────────────────────────────────
const CW = 580, CH = 195

// Horizontal zones (left = bore, right = exterior — suit la chemin de fuite axial)
const BORE_W = 62       // zone bore (gauche)
const WALL_W = 40       // zone paroi non-filetée
const THREAD_L = 345    // longueur d'engagement fileté
const TX = BORE_W + WALL_W        // 102 — début filetage
const TEX = TX + THREAD_L         // 447 — fin (nez du pin)
const EXT_W = CW - TEX            // 133

// Vertical structure (haut = intérieur/alésage, bas = extérieur)
// Asymétrique : la BOX (manchon) est bien plus épaisse que le PIN
const BORE_STRIP = 18     // bandeau alésage haut
const PIN_WALL = 32       // paroi PIN (mince)
const TOOTH_H = 12        // hauteur dent
const GAP = 10            // jeu au fond (root clearance)
const BOX_WALL = 64       // paroi BOX (épaisse — manchon de couplage)
const TAPER = 13          // déplacement radial total (conicité 1/16") sur THREAD_L
const PITCH = 18          // pas fileté (px)

// Positions Y de référence à x = TX (sans conicité)
const Y_BORE_BOT = BORE_STRIP                           // 18 — surface alésage (plate, constante)
const Y_PIN_BASE_0 = Y_BORE_BOT + PIN_WALL              // 50 — surface ext. PIN à TX
const Y_PIN_TIP_0 = Y_PIN_BASE_0 + TOOTH_H             // 62 — sommet dent PIN (↓)
const Y_BOX_TIP_0 = Y_PIN_TIP_0 + GAP                  // 72 — sommet dent BOX (↑)
const Y_BOX_BASE_0 = Y_BOX_TIP_0 + TOOTH_H             // 84 — surface int. BOX à TX
const Y_BOX_BOT_0 = Y_BOX_BASE_0 + BOX_WALL            // 148 — surface ext. BOX à TX
// Bande extérieure : Y_BOX_BOT_0 .. Y_BOX_BOT_0+EXT_STRIP = 148..170
// CH = 195 avec marges

// Conicité : la surface OD du pin monte vers l'axe en allant vers le nez (droite)
function taper(x: number): number {
  if (x <= TX) return 0
  if (x >= TEX) return TAPER
  return (x - TX) / THREAD_L * TAPER
}

const yPinBase = (x: number) => Y_PIN_BASE_0 - taper(x)
const yPinTip  = (x: number) => yPinBase(x) + TOOTH_H
const yBoxTip  = (x: number) => yPinTip(x) + GAP
const yBoxBase = (x: number) => yBoxTip(x) + TOOTH_H
const yBoxBot  = (x: number) => yBoxBase(x) + BOX_WALL

// ── Physique ────────────────────────────────────────────────────────────────
// Modèle simplifié API 8-round : étanchéité par contact de flanc
function computePhysics(torque: number, pInt: number, pExt: number) {
  const contactMPa = torque * 0.0015          // 0→15 MPa @ 0→10000 Nm
  const sealBar    = contactMPa * 48          // 0→720 bar capacité
  const dP         = Math.max(0, pInt - pExt)
  const margin     = sealBar - dP
  const leakFactor = Math.max(0, Math.min(1, -margin / 120))
  const status = leakFactor === 0 ? 'ÉTANCHE' : leakFactor < 0.35 ? 'CRITIQUE' : 'FUITE'
  return { contactMPa, sealBar, dP, margin, leakFactor, status }
}

interface Particle { x: number; y: number; vy: number; speed: number }

export default function DuckFriend() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef(0)
  const partsRef  = useRef<Particle[]>([])
  const timeRef   = useRef(0)

  const [torque, setTorque] = useState(4500)
  const [pInt,   setPInt]   = useState(200)
  const [pExt,   setPExt]   = useState(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    timeRef.current += 0.05
    const { contactMPa, sealBar, dP, leakFactor, status } = computePhysics(torque, pInt, pExt)
    const pNorm  = Math.min(1, pInt / 700)
    const peNorm = Math.min(1, pExt / 500)
    const parts  = partsRef.current
    const N = Math.ceil(THREAD_L / PITCH) + 2

    // Palette
    const boreR = 155 + Math.round(pNorm * 95)
    const boreG = 55  + Math.round(pNorm * 30)

    // ── 1. Fond ──────────────────────────────────────────────────────────
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, CW, CH)

    // ── 2. Bandeau alésage (haut, constant) ─────────────────────────────
    const boreGrad = ctx.createLinearGradient(0, 0, 0, BORE_STRIP)
    boreGrad.addColorStop(0, `rgba(${boreR}, ${boreG}, 5, 0.25)`)
    boreGrad.addColorStop(1, `rgba(${boreR}, ${boreG}, 0, 0.85)`)
    ctx.fillStyle = boreGrad
    ctx.fillRect(0, 0, CW, BORE_STRIP)

    // Flèches de pression dans l'alésage (gauche)
    const arrowCol = leakFactor > 0.4 ? '#ff5533' : COLOR
    ctx.strokeStyle = arrowCol + 'cc'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let ax = 10; ax < TX - 8; ax += 30) {
      const ay = BORE_STRIP / 2
      ctx.moveTo(ax, ay); ctx.lineTo(ax + 14, ay)
      ctx.moveTo(ax + 14, ay); ctx.lineTo(ax + 7, ay - 4)
      ctx.moveTo(ax + 14, ay); ctx.lineTo(ax + 7, ay + 4)
    }
    ctx.stroke()

    // ── 3. Zone extérieure (droite) ──────────────────────────────────────
    const extGrad = ctx.createLinearGradient(TEX, 0, CW, 0)
    extGrad.addColorStop(0, `rgba(5, ${50 + Math.round(peNorm * 65)}, ${160 + Math.round(peNorm * 75)}, 0.7)`)
    extGrad.addColorStop(1, 'rgba(3, 14, 50, 0.2)')
    ctx.fillStyle = extGrad
    ctx.fillRect(TEX, 0, EXT_W, CH)

    // ── 4. Paroi PIN (zone non-filetée, rectangle) ───────────────────────
    const steelPinG = ctx.createLinearGradient(0, Y_BORE_BOT, 0, Y_PIN_BASE_0)
    steelPinG.addColorStop(0, '#101025')
    steelPinG.addColorStop(0.3, '#252550')
    steelPinG.addColorStop(0.65, '#3e3e6e')
    steelPinG.addColorStop(1, '#333358')
    ctx.fillStyle = steelPinG
    ctx.fillRect(0, Y_BORE_BOT, TX, PIN_WALL) // section non-filetée du pin

    // ── 5. Paroi PIN (zone filetée, trapèze — OD diminue vers le nez) ───
    // La surface INTÉRIEURE (alésage) reste à Y_BORE_BOT = constante
    // La surface EXTÉRIEURE monte de Y_PIN_BASE_0 → Y_PIN_BASE_0-TAPER
    ctx.fillStyle = steelPinG
    ctx.beginPath()
    ctx.moveTo(TX,  Y_BORE_BOT)
    ctx.lineTo(TEX, Y_BORE_BOT)               // surface alésage = plate
    ctx.lineTo(TEX, yPinBase(TEX))            // OD réduit au nez
    ctx.lineTo(TX,  yPinBase(TX))             // OD initial
    ctx.closePath(); ctx.fill()

    // Reflet métallique pin
    ctx.strokeStyle = 'rgba(150, 150, 210, 0.22)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0,   Y_BORE_BOT + PIN_WALL * 0.38)
    ctx.lineTo(TX,  Y_BORE_BOT + PIN_WALL * 0.38)
    ctx.lineTo(TEX, Y_BORE_BOT + (yPinBase(TEX) - Y_BORE_BOT) * 0.38)
    ctx.stroke()

    // ── 6. Paroi BOX (trapèze — ID réduit en miroir, paroi épaisse) ─────
    const steelBoxG = ctx.createLinearGradient(0, Y_BOX_BASE_0, 0, Y_BOX_BOT_0)
    steelBoxG.addColorStop(0, '#2e2e52')
    steelBoxG.addColorStop(0.2, '#3d3d68')
    steelBoxG.addColorStop(0.5, '#303058')
    steelBoxG.addColorStop(0.8, '#1e1e3a')
    steelBoxG.addColorStop(1, '#0d0d1e')
    ctx.fillStyle = steelBoxG

    // Trapèze box : ID et OD suivent la conicité
    ctx.beginPath()
    ctx.moveTo(TX,  yBoxBase(TX))
    ctx.lineTo(TEX, yBoxBase(TEX))
    ctx.lineTo(TEX, yBoxBot(TEX))
    ctx.lineTo(TX,  yBoxBot(TX))
    ctx.closePath(); ctx.fill()

    // Reflet métallique box
    ctx.strokeStyle = 'rgba(110, 110, 175, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(TX,  yBoxBase(TX)  + BOX_WALL * 0.65)
    ctx.lineTo(TEX, yBoxBase(TEX) + BOX_WALL * 0.65)
    ctx.stroke()

    // ── 7. Jeu racinaire (root clearance) — gradient de pression ────────
    // Gradient horizontal (gauche=haute P, droite=basse P)
    const bleed = 0.08 + leakFactor * 0.86
    const gapGrad = ctx.createLinearGradient(TX, 0, TEX, 0)
    gapGrad.addColorStop(0, `rgba(${boreR}, ${boreG}, 0, ${0.55 + pNorm * 0.35})`)
    gapGrad.addColorStop(Math.min(bleed * 0.6, 0.97), `rgba(255, 50, 0, ${leakFactor * 0.68 + 0.04})`)
    gapGrad.addColorStop(Math.min(bleed, 0.98), `rgba(180, 25, 0, ${leakFactor * 0.28})`)
    gapGrad.addColorStop(1, `rgba(5, 40, 160, 0.07)`)

    // Trace le polygone du jeu racinaire (suit la conicité)
    ctx.save()
    ctx.beginPath()
    for (let x = TX; x <= TEX; x += 4) ctx.lineTo(x, yPinTip(x))
    for (let x = TEX; x >= TX; x -= 4) ctx.lineTo(x, yBoxTip(x))
    ctx.closePath()
    ctx.clip()
    ctx.fillStyle = gapGrad
    ctx.fillRect(TX, yPinTip(TEX) - 2, THREAD_L, GAP + 6)
    ctx.restore()

    // ── 8. Dents PIN (triangles pointant ↓, surface OD du pin) ──────────
    // Profil V symétrique 60° (API 8-round)
    const pinTeethG = ctx.createLinearGradient(0, Y_PIN_BASE_0, 0, Y_PIN_BASE_0 + TOOTH_H)
    pinTeethG.addColorStop(0, '#3a3a62')
    pinTeethG.addColorStop(1, '#222236')
    ctx.fillStyle = pinTeethG

    for (let k = 0; k < N; k++) {
      const x0 = TX + k * PITCH, xm = x0 + PITCH / 2, x1 = x0 + PITCH
      if (x0 >= TEX) break
      const xmC = Math.min(xm, TEX), x1C = Math.min(x1, TEX)
      // Base sur la ligne OD du pin (tapered), sommet vers l'extérieur
      ctx.beginPath()
      ctx.moveTo(x0,  yPinBase(x0))
      ctx.lineTo(xmC, yPinTip(xmC))
      ctx.lineTo(x1C, yPinBase(x1C))
      ctx.closePath(); ctx.fill()
      // Reflet flanc gauche (flank de charge)
      ctx.strokeStyle = 'rgba(100, 100, 170, 0.3)'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(x0, yPinBase(x0)); ctx.lineTo(xmC, yPinTip(xmC)); ctx.stroke()
    }

    // ── 9. Dents BOX (triangles pointant ↑, surface ID du box) ──────────
    const boxTeethG = ctx.createLinearGradient(0, Y_BOX_TIP_0, 0, Y_BOX_BASE_0)
    boxTeethG.addColorStop(0, '#404462')
    boxTeethG.addColorStop(1, '#2c2c4a')
    ctx.fillStyle = boxTeethG

    for (let k = 0; k < N; k++) {
      // Dents box décalées d'un demi-pas par rapport aux dents pin
      const x0 = TX + k * PITCH + PITCH / 2, xm = x0 + PITCH / 2, x1 = x0 + PITCH
      if (x0 >= TEX) break
      const xmC = Math.min(xm, TEX), x1C = Math.min(x1, TEX)
      // Base sur la ligne ID du box (tapered), sommet vers l'intérieur (vers bore)
      ctx.beginPath()
      ctx.moveTo(x0,  yBoxBase(x0))
      ctx.lineTo(xmC, yBoxTip(xmC))
      ctx.lineTo(x1C, yBoxBase(x1C))
      ctx.closePath(); ctx.fill()
      // Reflet flanc droit (stab flank)
      ctx.strokeStyle = 'rgba(160, 160, 210, 0.28)'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(xmC, yBoxTip(xmC)); ctx.lineTo(x1C, yBoxBase(x1C)); ctx.stroke()
    }

    // ── 10. Zones de contact (entre flancs pin droit et box gauche) ──────
    const cInt = Math.min(1, torque / 8000) * (1 - leakFactor * 0.75)
    const cR   = Math.round(leakFactor * 255)
    const cG   = Math.round(Math.max(0, (1 - leakFactor) * 205))

    for (let k = 0; k < N - 1; k++) {
      const xm  = TX + k * PITCH + PITCH / 2   // sommet dent pin k
      const x1  = TX + (k + 1) * PITCH         // base droit dent pin k
      if (x1 > TEX) break
      // Quadrilatère entre flanc droit pin et flanc gauche box
      ctx.beginPath()
      ctx.moveTo(xm, yPinTip(xm)); ctx.lineTo(x1, yPinBase(x1))
      ctx.lineTo(x1, yBoxBase(x1)); ctx.lineTo(xm, yBoxTip(xm))
      ctx.closePath()
      ctx.fillStyle = `rgba(${cR}, ${cG}, 30, ${0.08 + cInt * 0.5})`
      ctx.fill()
      if (cInt > 0.12) {
        ctx.shadowBlur = cInt > 0.45 ? 5 : 0; ctx.shadowColor = `rgba(${cR},${cG},0,0.5)`
        ctx.strokeStyle = `rgba(${cR}, ${cG}, 50, ${cInt * 0.8})`; ctx.lineWidth = 1.4
        ctx.beginPath(); ctx.moveTo(xm, yPinTip(xm)); ctx.lineTo(x1, yPinBase(x1)); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(xm, yBoxTip(xm)); ctx.lineTo(x1, yBoxBase(x1)); ctx.stroke()
        ctx.shadowBlur = 0
      }
    }

    // ── 11. Particules de fuite (dans le jeu racinaire) ──────────────────
    if (leakFactor > 0.05) {
      const spawn = leakFactor * 3.5
      for (let i = 0; i < Math.ceil(spawn); i++) {
        if (Math.random() < (i < Math.floor(spawn) ? 1 : spawn % 1)) {
          const sx = TX + 2
          parts.push({ x: sx, y: yPinTip(sx) + 2 + Math.random() * (GAP - 4), speed: 1.5 + leakFactor * 5 + Math.random() * 2, vy: (Math.random() - 0.5) * 0.4 })
        }
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      parts[i].x += parts[i].speed; parts[i].y += parts[i].vy
      const ptip = yPinTip(parts[i].x), btip = yBoxTip(parts[i].x)
      if (parts[i].x > TEX || parts[i].y < ptip || parts[i].y > btip) { parts.splice(i, 1); continue }
      const prog = (parts[i].x - TX) / THREAD_L
      ctx.beginPath(); ctx.arc(parts[i].x, parts[i].y, Math.max(0.5, 2.5 - prog * 1.5), 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, ${90 + Math.round(prog * 80)}, 10, ${0.9 - prog * 0.3})`
      ctx.shadowBlur = 5; ctx.shadowColor = '#ff7700'; ctx.fill(); ctx.shadowBlur = 0
    }
    if (parts.length > 280) parts.splice(0, parts.length - 280)

    // ── 12. Bandeau extérieur (bas, suit la conicité) ────────────────────
    // Trace le bas du BOX et la bande de pression ext.
    ctx.save()
    ctx.beginPath()
    for (let x = TX; x <= TEX; x += 4) ctx.lineTo(x, yBoxBot(x))
    ctx.lineTo(TEX, CH); ctx.lineTo(TX, CH); ctx.closePath()
    ctx.clip()
    const extStripG = ctx.createLinearGradient(0, Y_BOX_BOT_0, 0, CH)
    extStripG.addColorStop(0, `rgba(5, ${50 + Math.round(peNorm * 65)}, ${160 + Math.round(peNorm * 70)}, 0.7)`)
    extStripG.addColorStop(1, 'rgba(3, 14, 50, 0.2)')
    ctx.fillStyle = extStripG
    ctx.fillRect(TX, 0, THREAD_L, CH)
    ctx.restore()

    // ── 13. Repères visuels ──────────────────────────────────────────────
    // Surface alésage (ligne plate en haut du pin)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.18)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, Y_BORE_BOT); ctx.lineTo(TEX, Y_BORE_BOT); ctx.stroke()

    // Ligne OD du pin (conicité visible)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)'; ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(TX, yPinBase(TX)); ctx.lineTo(TEX, yPinBase(TEX)); ctx.stroke()
    ctx.setLineDash([])

    // Nez du pin (côté droit)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(TEX, Y_BORE_BOT); ctx.lineTo(TEX, yBoxBot(TEX) + 4); ctx.stroke()

    // Séparateurs zones
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4])
    ctx.beginPath(); ctx.moveTo(TX, 0); ctx.lineTo(TX, CH); ctx.stroke()
    ctx.setLineDash([])

    // ── 14. Labels ───────────────────────────────────────────────────────
    ctx.font = 'bold 9px Space Mono'; ctx.textAlign = 'center'
    ctx.fillStyle = '#f59e0bcc'; ctx.fillText('ALÉSAGE', BORE_W / 2, 13)
    ctx.fillStyle = `rgba(245, 158, 11, ${0.5 + pNorm * 0.4})`;ctx.fillText(`${pInt} bar`, BORE_W / 2 + 14, 13)
    ctx.fillStyle = '#6699cccc'; ctx.fillText('EXT', TEX + EXT_W / 2, 13)
    ctx.fillStyle = `rgba(80, 140, 220, ${0.5 + peNorm * 0.4})`; ctx.fillText(`${pExt} bar`, TEX + EXT_W / 2 + 12, 13)

    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '8px Space Mono'; ctx.textAlign = 'left'
    ctx.fillText('PIN →', TX + 4, Y_BORE_BOT + 10)
    ctx.fillText(`conicité 1/16"`, TX + 4, Y_BORE_BOT + 20)

    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.textAlign = 'right'
    ctx.fillText('← BOX (manchon)', TEX - 5, yBoxBase(TX) + 12)

    // Annotations physique
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '8px Space Mono'; ctx.textAlign = 'left'
    ctx.fillText(`Pc=${contactMPa.toFixed(1)} MPa  cap.=${Math.round(sealBar)} bar  ΔP=${dP} bar`, TX + 4, 10)

    // Statut sceau
    const statusColor = status === 'ÉTANCHE' ? '#34d399' : status === 'CRITIQUE' ? '#fbbf24' : '#f87171'
    const pulse = leakFactor > 0 ? 8 + 4 * Math.sin(timeRef.current * 3) : 4
    ctx.shadowBlur = pulse; ctx.shadowColor = statusColor
    ctx.fillStyle = statusColor; ctx.font = 'bold 12px Space Mono'; ctx.textAlign = 'center'
    const statusIcon = status === 'ÉTANCHE' ? '✓' : status === 'CRITIQUE' ? '⚠' : '✕'
    ctx.fillText(`${statusIcon} ${status}`, TX + THREAD_L * 0.6, yPinTip(TX + THREAD_L * 0.6) + GAP / 2 + 4)
    ctx.shadowBlur = 0

    // Jauge couple (arc, dans la zone bore gauche)
    const gx = 30, gy = CH - 36, gR = 22
    const tN = Math.min(1, torque / 10000)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(gx, gy, gR, Math.PI, 0); ctx.stroke()
    ctx.strokeStyle = tN > 0.65 ? '#34d399' : tN > 0.3 ? COLOR : '#f87171'
    ctx.shadowBlur = 5; ctx.shadowColor = ctx.strokeStyle; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(gx, gy, gR, Math.PI, Math.PI + tN * Math.PI); ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '7px Space Mono'; ctx.textAlign = 'center'
    ctx.fillText('couple', gx, gy + 10)
    ctx.fillText(`${(torque / 1000).toFixed(1)}kNm`, gx, gy + 20)
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
    { label: 'Zéro',     t: 0,    pi: 0,   pe: 0,   color: '#6b7280' },
    { label: 'API std',  t: 4500, pi: 350, pe: 0,   color: COLOR },
    { label: 'HP',       t: 8000, pi: 700, pe: 0,   color: '#34d399' },
    { label: 'Fuite',    t: 1000, pi: 500, pe: 0,   color: '#f87171' },
    { label: 'Diff ext', t: 5000, pi: 100, pe: 400, color: '#a78bfa' },
  ]

  return (
    <AppLayout
      title="Duck Friend — Connexion API Filetée"
      icon="🦆"
      color={COLOR}
      subtitle={'Coupe 2D d\'une connexion API 8-round (60°, conicité 1/16"). PIN mince entrant dans BOX épais. Étanchéité par contact de flanc.'}
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
            <div>P<sub>c</sub> = couple × 1.5×10⁻³ MPa/Nm</div>
            <div>Cap. = P<sub>c</sub> × 48 bar/MPa</div>
            <div>Fuite si ΔP {'>'} capacité</div>
          </div>
          <div>
            <div style={{ color: COLOR, fontWeight: 600, marginBottom: 2 }}>Géométrie API 8-round</div>
            <div>Flancs 60° · 8 TPI · conicité 1/16"</div>
            <div>PIN mince (paroi ~7mm)</div>
            <div>BOX épais (manchon ~25mm)</div>
          </div>
        </div>
      </Card>
    </AppLayout>
  )
}
