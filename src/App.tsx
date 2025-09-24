import { useEffect, useState } from 'react'
import './App.css'

const HOLE_COUNT = 9
const GAME_DURATION = 30
const MOLE_SPEED = 800
const BEST_SCORE_STORAGE_KEY = 'whack-a-mole-best-score'

type GameStatus = 'idle' | 'playing' | 'finished'

const holeIndices = Array.from({ length: HOLE_COUNT }, (_, index) => index)

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value))

function App() {
  const [status, setStatus] = useState<GameStatus>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [moleIndex, setMoleIndex] = useState<number | null>(null)
  const [bestScore, setBestScore] = useState<number | null>(null)
  const [isNewRecord, setIsNewRecord] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const storedBest = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY)
    if (storedBest) {
      const parsedBest = Number.parseInt(storedBest, 10)
      if (!Number.isNaN(parsedBest)) {
        setBestScore(parsedBest)
      }
    }
  }, [])

  useEffect(() => {
    if (status !== 'playing') {
      return
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setStatus('finished')
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    if (status !== 'playing') {
      setMoleIndex(null)
      return
    }

    const showNextMole = () => {
      setMoleIndex((previous) => {
        let next = Math.floor(Math.random() * HOLE_COUNT)
        if (previous !== null && HOLE_COUNT > 1) {
          while (next === previous) {
            next = Math.floor(Math.random() * HOLE_COUNT)
          }
        }
        return next
      })
    }

    showNextMole()
    const moleTimer = window.setInterval(showNextMole, MOLE_SPEED)

    return () => window.clearInterval(moleTimer)
  }, [status])

  useEffect(() => {
    if (status !== 'finished') {
      setIsNewRecord(false)
      return
    }

    setBestScore((previous) => {
      const newBest = previous === null ? score : Math.max(previous, score)
      const updated = previous === null || score > previous
      setIsNewRecord(updated)

      if (typeof window !== 'undefined' && (updated || previous === null)) {
        window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(newBest))
      }

      return newBest
    })
  }, [status, score])

  const startGame = () => {
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setStatus('playing')
  }

  const stopGame = () => {
    setStatus('finished')
    setTimeLeft(0)
  }

  const handleHoleClick = (index: number) => {
    if (status !== 'playing' || index !== moleIndex) {
      return
    }

    setScore((current) => current + 1)
    setMoleIndex(null)
  }

  const timeProgress =
    status === 'playing'
      ? clampPercentage((timeLeft / GAME_DURATION) * 100)
      : status === 'idle'
        ? 100
        : 0

  const message = (() => {
    if (status === 'idle') {
      return '「ゲームスタート」を押すとカウントダウンが始まります。光った穴を素早くクリックしてスコアを伸ばしましょう！'
    }
    if (status === 'playing') {
      return '出てきたモグラをクリックしてハイスコアを狙え！同じ穴に連続で出現しないので目を素早く動かしてみてください。'
    }
    const base = `お疲れさま！今回のスコアは ${score} 点でした。`
    if (isNewRecord && bestScore !== null) {
      return `${base} ベストスコアを ${bestScore} 点に更新！`
    }
    if (bestScore !== null) {
      return `${base} ベストスコアは ${bestScore} 点です。`
    }
    return base
  })()

  return (
    <div className="app">
      <header className="header">
        <h1>モグラたたきミニゲーム</h1>
        <p className="lead">
          制限時間 {GAME_DURATION} 秒の間に、穴から顔を出すモグラをできるだけ多くクリックしよう！
        </p>
      </header>

      <section className="status-panel" aria-label="ゲームの状況">
        <div className="status-block" role="status">
          <span className="status-label">スコア</span>
          <span className="status-value">{score}</span>
        </div>
        <div className="status-block time" role="status">
          <span className="status-label">タイム</span>
          <span className="status-value">{timeLeft}</span>
          <div className="time-track" aria-hidden="true">
            <div className="time-progress" style={{ width: `${timeProgress}%` }} />
          </div>
        </div>
        <div className="status-block" role="status">
          <span className="status-label">ベスト</span>
          <span className="status-value">{bestScore ?? '—'}</span>
        </div>
      </section>

      <div className="board" role="grid" aria-label="モグラたたきのフィールド">
        {holeIndices.map((index) => {
          const hasMole = index === moleIndex
          return (
            <button
              key={index}
              type="button"
              className={`hole${hasMole ? ' has-mole' : ''}`}
              onClick={() => handleHoleClick(index)}
              disabled={status !== 'playing'}
              aria-label={hasMole ? 'モグラをたたく' : '空の穴'}
              role="gridcell"
            >
              <span className="hole-inner">
                <span className="hole-shadow" />
                <span className="mole" />
              </span>
            </button>
          )
        })}
      </div>

      <div className="controls">
        {status !== 'playing' ? (
          <button type="button" className="primary-button" onClick={startGame}>
            {status === 'finished' ? 'もう一度プレイ' : 'ゲームスタート'}
          </button>
        ) : (
          <button type="button" className="secondary-button" onClick={stopGame}>
            あきらめる
          </button>
        )}
      </div>

      <p className="message">{message}</p>
    </div>
  )
}

export default App
