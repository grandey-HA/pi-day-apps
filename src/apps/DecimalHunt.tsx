import { useState, useEffect, useCallback, useRef } from 'react'
import { AppLayout, Card, Stat } from './shared'

const COLOR = '#fb923c'

// First 200 digits of π after decimal point
const PI_DIGITS = '14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651328230664709384460955058223172535940812848111745028410270193852110555964462294895493038196'

export default function DecimalHunt() {
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [mode, setMode] = useState<'type' | 'roulette'>('type')
  const [currentPos, setCurrentPos] = useState(0)
  const [lastWrong, setLastWrong] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const rouletteRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  const rouletteAngle = useRef(0)
  const rouletteTarget = useRef(0)
  const rouletteResult = useRef(-1)

  const handleKey = useCallback((digit: string) => {
    if (currentPos >= PI_DIGITS.length) return
    const expected = PI_DIGITS[currentPos]
    if (digit === expected) {
      setCurrentPos(p => p + 1)
      setStreak(s => {
        const ns = s + 1
        setBest(b => Math.max(b, ns))
        return ns
      })
      setScore(s => s + streak + 1)
      setLastWrong(false)
    } else {
      setStreak(0)
      setLastWrong(true)
      setTimeout(() => setLastWrong(false), 500)
    }
  }, [currentPos, streak])

  useEffect(() => {
    if (mode !== 'type') return
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, handleKey])

  const spinRoulette = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    rouletteResult.current = -1
    rouletteTarget.current = Math.random() * Math.PI * 20 + Math.PI * 10
    const targetDigit = PI_DIGITS[revealed] || '0'
    rouletteAngle.current = 0

    const animate = () => {
      const canvas = rouletteRef.current!
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      const W = canvas.width, H = canvas.height
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 20

      rouletteAngle.current += 0.15
      const progress = rouletteAngle.current / rouletteTarget.current
      const eased = Math.min(1, progress * (2 - progress))
      const angle = eased * rouletteTarget.current

      ctx.fillStyle = '#05050f'
      ctx.fillRect(0, 0, W, H)

      // Draw wheel segments
      for (let i = 0; i < 10; i++) {
        const a1 = (i / 10) * Math.PI * 2 - Math.PI / 2 + angle
        const a2 = ((i + 1) / 10) * Math.PI * 2 - Math.PI / 2 + angle
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, a1, a2)
        ctx.closePath()
        const active = i === parseInt(targetDigit) && progress >= 1
        ctx.fillStyle = active ? `${COLOR}44` : `hsl(${i * 36}, 60%, ${20 + (i % 2) * 5}%)`
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Digit label
        const midAngle = (a1 + a2) / 2
        ctx.fillStyle = active ? COLOR : 'rgba(255,255,255,0.8)'
        ctx.font = `bold ${active ? 18 : 14}px Space Mono`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(i), cx + R * 0.7 * Math.cos(midAngle), cy + R * 0.7 * Math.sin(midAngle))
      }

      // Pointer
      ctx.beginPath()
      ctx.moveTo(cx + R + 14, cy)
      ctx.lineTo(cx + R + 4, cy - 8)
      ctx.lineTo(cx + R + 4, cy + 8)
      ctx.closePath()
      ctx.fillStyle = COLOR
      ctx.fill()
      ctx.shadowBlur = 8; ctx.shadowColor = COLOR; ctx.fill(); ctx.shadowBlur = 0

      // Center
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2)
      ctx.fillStyle = '#05050f'; ctx.fill()
      ctx.fillStyle = COLOR; ctx.font = 'bold 16px Space Mono'
      ctx.fillText('3.', cx, cy)
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        rouletteResult.current = parseInt(targetDigit)
        setRevealed(r => r + 1)
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }, [spinning, revealed])

  useEffect(() => {
    if (rouletteRef.current) {
      rouletteRef.current.width = 260
      rouletteRef.current.height = 260
    }
  }, [])

  const reset = () => {
    setScore(0); setStreak(0); setCurrentPos(0); setLastWrong(false); setRevealed(0)
  }

  const visStart = Math.max(0, currentPos - 8)
  const visDigits = PI_DIGITS.slice(visStart, visStart + 25)

  return (
    <AppLayout title="Chasse aux Décimales" icon="⌨" color={COLOR}
      subtitle="Mémorisez et tapez les décimales de π une par une. Chaque bonne réponse donne des points bonus!">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <Stat label="Position" value={`${currentPos + 1}/200`} color={COLOR} />
        <Stat label="Score" value={score.toLocaleString()} color={COLOR} />
        <Stat label="Série" value={streak.toString()} color={streak > 5 ? '#34d399' : 'var(--text)'} />
        <Stat label="Meilleure série" value={best.toString()} color="#fbbf24" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(['type', 'roulette'] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); reset() }}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: mode === m ? `${COLOR}22` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${mode === m ? COLOR : 'rgba(255,255,255,0.1)'}`,
              color: mode === m ? COLOR : 'var(--text)',
            }}>
            {m === 'type' ? '⌨ Clavier' : '🎡 Roulette'}
          </button>
        ))}
      </div>

      {mode === 'type' && (
        <Card style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 10, fontFamily: 'Space Mono', fontSize: 22, letterSpacing: 4, textAlign: 'center' }}>
            3.
            {visDigits.split('').map((d, i) => {
              const absI = visStart + i
              let color = 'rgba(255,255,255,0.2)'
              if (absI < currentPos) color = '#34d399'
              else if (absI === currentPos) color = lastWrong ? '#f87171' : COLOR
              return (
                <span key={i} style={{
                  color,
                  display: 'inline-block',
                  transform: absI === currentPos ? 'scale(1.4)' : 'scale(1)',
                  transition: 'all 0.15s',
                  textShadow: absI === currentPos ? `0 0 12px ${lastWrong ? '#f87171' : COLOR}` : 'none',
                }}>{d}</span>
              )
            })}
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>...</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 10, fontSize: 12, color: 'var(--text2)' }}>
            Tapez le chiffre suivant sur votre clavier
          </div>

          {/* Virtual keyboard */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[7,8,9,4,5,6,1,2,3,0].map(d => (
              <button key={d} onClick={() => handleKey(String(d))}
                style={{
                  width: 46, height: 46, borderRadius: 8, fontSize: 17, fontFamily: 'Space Mono',
                  fontWeight: 700, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text)',
                  transition: 'all 0.1s',
                }}>
                {d}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <button onClick={reset} style={{ fontSize: 12, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Recommencer
            </button>
          </div>
        </Card>
      )}

      {mode === 'roulette' && (
        <Card style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <canvas ref={rouletteRef} style={{ borderRadius: 12, border: `1px solid ${COLOR}22` }} />
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button onClick={spinRoulette} disabled={spinning}
                style={{
                  padding: '12px 32px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: spinning ? 'not-allowed' : 'pointer',
                  background: spinning ? 'rgba(255,255,255,0.05)' : `${COLOR}22`,
                  border: `2px solid ${COLOR}`,
                  color: COLOR, opacity: spinning ? 0.6 : 1,
                }}>
                {spinning ? '⏳ En route...' : '🎡 Tourner!'}
              </button>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>Décimales révélées :</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 18, letterSpacing: 4, lineHeight: 2, wordBreak: 'break-all' }}>
              3.
              {PI_DIGITS.slice(0, revealed).split('').map((d, i) => (
                <span key={i} style={{ color: COLOR }}>{d}</span>
              ))}
              {revealed < PI_DIGITS.length && <span style={{ color: 'rgba(255,255,255,0.2)', animation: 'blink 1s infinite' }}>?</span>}
            </div>
            {rouletteResult.current >= 0 && !spinning && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: `${COLOR}18`, border: `1px solid ${COLOR}44` }}>
                <span style={{ fontFamily: 'Space Mono', color: COLOR, fontSize: 18, fontWeight: 700 }}>
                  {rouletteResult.current}
                </span>
                <span style={{ color: 'var(--text2)', fontSize: 12, marginLeft: 8 }}>
                  décimale #{revealed} de π révélée!
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </AppLayout>
  )
}
