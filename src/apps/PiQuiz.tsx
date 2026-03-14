import { useState, useEffect, useRef, useCallback } from 'react'
import { AppLayout, Card, Stat, Btn } from './shared'

const COLOR = '#e879f9'

interface Question {
  type: 'digit' | 'circle' | 'formula' | 'fact'
  prompt: string
  answer: string | number
  options?: string[]
  hint?: string
}

const QUESTIONS: Question[] = [
  { type: 'digit', prompt: 'Quelle est la 5ème décimale de π ?', answer: '9', options: ['5', '9', '2', '3'], hint: '3.1415...' },
  { type: 'digit', prompt: 'Quelle est la 10ème décimale de π ?', answer: '5', options: ['5', '8', '2', '3'], hint: '3.141592653...' },
  { type: 'formula', prompt: 'La série de Basel converge vers :', answer: 'π²/6', options: ['π/4', 'π²/6', '2π', 'π²/4'], hint: 'Euler, 1734' },
  { type: 'formula', prompt: "La formule de Wallis donne π via :", answer: '∏(4n²/(4n²-1))', options: ['∑1/n²', '∏(4n²/(4n²-1))', '4·∑(-1)ⁿ/(2n+1)', '√6·∑1/n²'], hint: 'Produit infini' },
  { type: 'formula', prompt: 'La formule de Leibniz : π/4 = 1 - 1/3 + 1/5 - ... converge-t-elle rapidement ?', answer: 'Non, très lentement', options: ['Oui, très vite', 'Non, très lentement', 'En O(1/n²)', 'Jamais'], hint: 'Alternée' },
  { type: 'fact', prompt: 'π est un nombre :', answer: 'Transcendant et irrationnel', options: ['Rationnel', 'Irrationnel mais algébrique', 'Transcendant et irrationnel', 'Complexe'], hint: 'Prouvé par Hermite/Lindemann' },
  { type: 'fact', prompt: 'π Day est célébré le :', answer: '14 mars (3/14)', options: ['22 juillet', '14 mars (3/14)', '31 avril', '1er janvier'], hint: '3.14...' },
  { type: 'fact', prompt: 'Le record de décimales de π calculées (2023) est :', answer: '105 000 milliards', options: ['1 million', '10 milliards', '105 000 milliards', '1 trilliard'], hint: 'Emma Haruka Iwao, Google' },
  { type: 'digit', prompt: 'Quelle est la 1ère décimale de π ?', answer: '1', options: ['1', '3', '4', '2'], hint: 'π = 3.1...' },
  { type: 'formula', prompt: 'La formule de Machin (1706) : π/4 = 4·arctan(1/5) - arctan(1/239) est utilisée pour :', answer: 'Calculer des milliers de décimales', options: ['Prouver que π est irrationnel', 'Calculer des milliers de décimales', 'Mesurer des cercles', 'Rien d\'utile'], hint: 'Méthode rapide' },
]

export default function PiQuiz() {
  const [qIdx, setQIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [selected, setSelected] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [history, setHistory] = useState<{ q: string; correct: boolean; chosen: string }[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const confCanvasRef = useRef<HTMLCanvasElement>(null)
  const confAnimRef = useRef(0)

  const q = QUESTIONS[qIdx]

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(15)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleAnswer('__timeout__')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    if (!done && !selected) resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [qIdx, done])

  const handleAnswer = useCallback((choice: string) => {
    if (selected || done) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelected(choice)
    const correct = choice === String(q.answer)
    setHistory(h => [...h, { q: q.prompt, correct, chosen: choice }])
    if (correct) {
      setScore(s => s + Math.ceil(timeLeft * 10))
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    } else {
      setLives(l => {
        if (l - 1 <= 0 && qIdx < QUESTIONS.length - 1) {
          setTimeout(() => setDone(true), 1200)
        }
        return l - 1
      })
    }
    setTimeout(() => {
      setSelected(null)
      if (qIdx + 1 >= QUESTIONS.length || (lives <= 1 && !correct)) {
        setDone(true)
      } else {
        setQIdx(i => i + 1)
      }
    }, 1200)
  }, [selected, done, q, timeLeft, lives, qIdx])

  // Confetti
  useEffect(() => {
    if (!showConfetti || !confCanvasRef.current) return
    const canvas = confCanvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      vx: (Math.random() - 0.5) * 6, vy: Math.random() * 4 + 2,
      color: [COLOR, '#fbbf24', '#34d399', '#00e5ff'][Math.floor(Math.random() * 4)],
      size: Math.random() * 8 + 4, rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.2,
    }))
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.rot += p.vr
      })
      confAnimRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(confAnimRef.current)
  }, [showConfetti])

  const restart = () => { setQIdx(0); setScore(0); setLives(3); setSelected(null); setDone(false); setHistory([]); setTimeLeft(15) }

  const progress = ((qIdx) / QUESTIONS.length) * 100

  if (done) {
    const correct = history.filter(h => h.correct).length
    return (
      <AppLayout title="Quiz π Interactif" icon="🏆" color={COLOR} subtitle="Résultats finaux">
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>
            {score > 500 ? '🎉' : score > 200 ? '🥈' : '🥉'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: COLOR, marginBottom: 8 }}>
            {score} points
          </div>
          <div style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 24 }}>
            {correct}/{history.length} bonnes réponses
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            <Stat label="Score" value={score.toString()} color={COLOR} />
            <Stat label="Correctes" value={`${correct}/${history.length}`} color="#34d399" />
            <Stat label="Vies restantes" value={'❤️'.repeat(Math.max(0, lives))} />
          </div>
          <Btn onClick={restart} color={COLOR} active style={{ fontSize: 15, padding: '12px 32px' }}>↺ Rejouer</Btn>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>Récapitulatif</div>
          {history.map((h, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{h.correct ? '✅' : '❌'}</span>
              <div>
                <div style={{ fontSize: 12 }}>{h.q}</div>
                {!h.correct && <div style={{ fontSize: 11, color: '#f87171', marginTop: 2 }}>Réponse: {h.chosen}</div>}
              </div>
            </div>
          ))}
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Quiz π Interactif" icon="🏆" color={COLOR}
      subtitle="10 questions sur π — décimales, formules, faits. Plus vite = plus de points!">
      {showConfetti && <canvas ref={confCanvasRef} style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }} />}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <Stat label="Score" value={score.toString()} color={COLOR} />
        <Stat label="Question" value={`${qIdx + 1}/${QUESTIONS.length}`} />
        <Stat label="Vies" value={'❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives))} />
        <Stat label="Temps" value={`${timeLeft}s`} color={timeLeft <= 5 ? '#f87171' : COLOR} />
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, height: 4 }}>
        <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${COLOR}, #8b5cf6)`, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>

      {/* Timer ring */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle cx="30" cy="30" r="24" fill="none" stroke={timeLeft <= 5 ? '#f87171' : COLOR}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - timeLeft / 15)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
          <text x="30" y="30" textAnchor="middle" dominantBaseline="middle"
            style={{ fill: 'var(--text)', fontSize: 14, fontFamily: 'Space Mono', fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: '30px 30px' }}>
            {timeLeft}
          </text>
        </svg>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: COLOR, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
          {q.type === 'digit' ? '🔢 Décimale' : q.type === 'formula' ? '∑ Formule' : '💡 Culture π'}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginBottom: q.hint ? 8 : 0 }}>
          {q.prompt}
        </div>
        {q.hint && <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'Space Mono', marginTop: 6 }}>
          💡 Indice : {q.hint}
        </div>}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {q.options?.map(opt => {
          const isCorrect = opt === String(q.answer)
          const isSelected = opt === selected
          let bg = 'rgba(255,255,255,0.03)'
          let border = 'rgba(255,255,255,0.1)'
          let textColor = 'var(--text)'
          if (selected) {
            if (isCorrect) { bg = 'rgba(52,211,153,0.15)'; border = '#34d399'; textColor = '#34d399' }
            else if (isSelected) { bg = 'rgba(248,113,113,0.15)'; border = '#f87171'; textColor = '#f87171' }
          }
          return (
            <button key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={!!selected}
              style={{
                padding: '16px 20px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: selected ? 'default' : 'pointer',
                background: bg, border: `2px solid ${border}`, color: textColor,
                textAlign: 'left', transition: 'all 0.2s', lineHeight: 1.4,
              }}>
              {isSelected && !isCorrect ? '❌ ' : isCorrect && selected ? '✅ ' : ''}{opt}
            </button>
          )
        })}
      </div>
    </AppLayout>
  )
}
