import { useEffect, useMemo, useRef, useState } from 'react'
import './Screens.css'
import './JackpotScreen.css'

import {
  ensureOpenRound,
  getBets,
  getCurrentRound,
  placeBet,
  secondsLeft,
  tryCloseRoundAndPickWinner,
  tryFinishRound,
  JACKPOT_CONFIG,
  isPendingEndsAt,
  tryStartCountdown,
  trySetPendingCountdown,
  claimPayout
} from '../../game/jackpot/jackpotService'

import { supabase } from '../../lib/supabase'

export default function JackpotScreen({ setActiveScreen, user, updateGameData }) {
  const telegramId = user?.telegram_id
  const firstName = user?.first_name || ''
  const username = user?.username || ''
  const photoUrl = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url || ''

  const [round, setRound] = useState(null)
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [rouletteDone, setRouletteDone] = useState(false)
  const [winnerId, setWinnerId] = useState(null)
  const [err, setErr] = useState('')

  const [rouletteItems, setRouletteItems] = useState([])
  const [rouletteX, setRouletteX] = useState(0)
  const [isPlacingBet, setIsPlacingBet] = useState(false)
  const rouletteBoxRef = useRef(null)
  const rouletteAnimRef = useRef(null)
  const rouletteShownRef = useRef(false)

  const [selectedBet, setSelectedBet] = useState(10)

  const pollRef = useRef(null)
  const spinTimerRef = useRef(null)

  const roundId = round?.id || null

  const totalPot = useMemo(
    () => bets.reduce((s, b) => s + (b.amount || 0), 0),
    [bets]
  )

    const groupedPlayers = useMemo(() => {
    const map = new Map()

    for (const b of bets) {
        const key = String(b.telegram_id)
        const prev = map.get(key)

        if (!prev) {
        map.set(key, {
            telegram_id: b.telegram_id,
            first_name: b.first_name,
            username: b.username,
            photo_url: b.photo_url,
            amount: b.amount || 0,
            // для стабильного key в React
            _firstBetId: b.id
        })
        } else {
        prev.amount += (b.amount || 0)
        // если вдруг у одной ставки нет фото/имени — пытаемся подхватить
        if (!prev.photo_url && b.photo_url) prev.photo_url = b.photo_url
        if (!prev.first_name && b.first_name) prev.first_name = b.first_name
        if (!prev.username && b.username) prev.username = b.username
        }
    }

    // превращаем в массив и сортируем по сумме ставки (по убыванию)
    return Array.from(map.values()).sort((a, b) => (b.amount || 0) - (a.amount || 0))
    }, [bets])

        const odds = useMemo(() => {
    if (totalPot <= 0) return {}
    const map = {}
    for (const p of groupedPlayers) {
        map[String(p.telegram_id)] = (p.amount / totalPot) * 100
    }
    return map
    }, [groupedPlayers, totalPot])

  const credits = useMemo(() => user?.game_data?.credits ?? 0, [user])

    const myTotalBet = useMemo(() => {
    if (!telegramId) return 0
    return bets
        .filter(b => String(b.telegram_id) === String(telegramId))
        .reduce((s, b) => s + (b.amount || 0), 0)
    }, [bets, telegramId])

  const canBet = useMemo(() => {
    if (!round) return false
    if (round.status !== 'open') return false
    if (!telegramId) return false
    if (isPlacingBet) return false
    return credits >= selectedBet
  }, [round, telegramId, credits, selectedBet, isPlacingBet])

  // 1) при входе: получить/создать текущий open/spinning раунд + ставки
  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      try {
        setErr('')
        setLoading(true)

        const open = await ensureOpenRound(telegramId)
        if (cancelled) return

        setRound(open)
        setWinnerId(open?.winner_telegram_id ?? null)

        const list = await getBets(open.id)
        if (cancelled) return
        setBets(list)
      } catch (e) {
        console.error(e)
        setErr('Не удалось загрузить джекпот. Проверь Supabase/таблицы.')
      } finally {
        setLoading(false)
      }
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [telegramId])

  // 2) realtime подписки — пересоздаём при смене roundId
  useEffect(() => {
    if (!roundId) return

    let betsChannel = null
    let roundChannel = null
    let alive = true

    const subscribe = async () => {
      // round updates
      roundChannel = supabase
        .channel(`jackpot_round_${roundId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jackpot_rounds', filter: `id=eq.${roundId}` },
          payload => {
            const next = payload.new
            if (!alive) return

            setRound(next)
            setWinnerId(next?.winner_telegram_id ?? null)

            // если стали spinning — запускаем локальную анимацию и таймер finish
            if (next?.status === 'spinning') {
              setSpinning(true)
              if (spinTimerRef.current) clearTimeout(spinTimerRef.current)

              spinTimerRef.current = setTimeout(async () => {
                setSpinning(false)
                // любой клиент может попытаться завершить
                await tryFinishRound(next.id)
              }, JACKPOT_CONFIG.SPIN_SECONDS * 1000)


              // запускаем рулетку только когда статус стал spinning
            ;(async () => {
            // подстрахуемся: возьмём свежие ставки, чтобы лента точно включала победителя
            const freshBets = await getBets(next.id)
            setBets(freshBets)
            // groupedPlayers пересчитается, но нам нужно собрать players тут:
            const map = new Map()
            for (const b of freshBets) {
                const k = String(b.telegram_id)
                const prev = map.get(k)
                if (!prev) {
                map.set(k, {
                    telegram_id: b.telegram_id,
                    first_name: b.first_name,
                    username: b.username,
                    photo_url: b.photo_url,
                    amount: b.amount || 0
                })
                } else {
                prev.amount += (b.amount || 0)
                if (!prev.photo_url && b.photo_url) prev.photo_url = b.photo_url
                }
            }
            const players = Array.from(map.values()).sort((a, b) => (b.amount || 0) - (a.amount || 0))
            animateRoulette(players, next.winner_telegram_id)
            })()

            }

            // finished -> подождём чуть-чуть и перейдём на новый open раунд
            if (next?.status === 'finished') {
            if (
                next?.winner_telegram_id &&
                telegramId &&
                String(next.winner_telegram_id) === String(telegramId)
            ) {
                (async () => {
                try {
                    console.log('[JACKPOT] I am winner, claiming payout...', {
                    roundId: next.id,
                    telegramId,
                    winner: next.winner_telegram_id
                    })

                    const added = await claimPayout(next.id, telegramId)

                    console.log('[JACKPOT] claimPayout result:', added)

                    // ВАЖНО: после RPC лучше перечитать профиль из profiles,
                    // потому что local creditsNow может быть устаревшим.
                    const { data: prof, error: profErr } = await supabase
                    .from('profiles')
                    .select('game_data')
                    .eq('telegram_id', telegramId)
                    .single()

                    if (profErr) throw profErr

                    console.log('[JACKPOT] profile after payout:', prof?.game_data)

                    if (prof?.game_data) {
                    updateGameData(prof.game_data)
                    }

                } catch (e) {
                    console.error('[JACKPOT] payout FAILED:', e)
                    setErr(`Выплата не прошла: ${e?.message || 'unknown error'}`)
                }
                })()
            }

            setTimeout(async () => {
                const newOpen = await ensureOpenRound(telegramId)
                setRound(newOpen)
                const newBets = await getBets(newOpen.id)
                setBets(newBets)
                setWinnerId(null)
                setSpinning(false)
                rouletteShownRef.current = false
                setRouletteItems([])
                setRouletteX(0)
                setRouletteDone(false)
            }, 1200)
            }

          }
        )
        .subscribe()

      // bets updates
      betsChannel = supabase
        .channel(`jackpot_bets_${roundId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jackpot_bets', filter: `round_id=eq.${roundId}` },
          async () => {
            if (!alive) return
            const fresh = await getBets(roundId)
            if (!alive) return
            setBets(fresh)
          }
        )
        .subscribe()
    }

    subscribe()

    return () => {
      alive = false
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current)
      if (betsChannel) supabase.removeChannel(betsChannel)
      if (roundChannel) supabase.removeChannel(roundChannel)
    }
  }, [roundId, telegramId])

  // 3) polling-fallback (чтобы не зависеть 100% от realtime)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)

    pollRef.current = setInterval(async () => {
      try {
        const r = await getCurrentRound()
        if (!r) return

        // если round сменился (например, другой клиент создал новый)
        if (!roundId || r.id !== roundId) {
          setRound(r)
          setWinnerId(r?.winner_telegram_id ?? null)
          const list = await getBets(r.id)
          setBets(list)
          return
        }

        // подхватить победителя/статус, если realtime не прилетел
        if (round && (r.status !== round.status || r.winner_telegram_id !== round.winner_telegram_id)) {
          setRound(r)
          setWinnerId(r?.winner_telegram_id ?? null)
        }

        // если open и время вышло — пытаемся закрыть и выбрать победителя
        if (r.status === 'open') {
        const listNow = await getBets(r.id)
        const uniq = new Set(listNow.map(b => String(b.telegram_id)))

        // 1) если игроков меньше 2 — принудительно держим раунд в pending
        if (uniq.size < 2) {
            if (!isPendingEndsAt(r.ends_at)) {
            await trySetPendingCountdown(r.id)
            // обновим round локально, чтобы UI синхронизировался
            const rr = await getCurrentRound()
            if (rr) setRound(rr)
            }
            return
        }

        // 2) если игроков уже 2+ и таймер ещё pending — стартуем обратный отсчёт
        if (isPendingEndsAt(r.ends_at)) {
            await tryStartCountdown(r.id)
            const rr = await getCurrentRound()
            if (rr) setRound(rr)
            return
        }

        // 3) если таймер уже идёт — проверяем завершение
        const left = secondsLeft(r.ends_at)
        if (left <= 0) {
            await tryCloseRoundAndPickWinner({ round: r, bets: listNow })
        }
        }




        // если spinning “застрял” — пробуем finish (на всякий случай)
        if (r.status === 'spinning') {
          // если прошло больше SPIN_SECONDS+2, пытаемся завершить
          const updatedMs = new Date(r.updated_at || r.created_at).getTime()
          const stuckFor = Date.now() - updatedMs
          if (stuckFor > (JACKPOT_CONFIG.SPIN_SECONDS + 2) * 1000) {
            await tryFinishRound(r.id)
          }
        }

        // периодически обновляем ставки (чтобы сразу видеть без realtime)
        // (раз в ~2 секунды)
        if (Date.now() % 2000 < 1100) {
          const fresh = await getBets(r.id)
          setBets(fresh)
        }
      } catch (e) {
        // молча — fallback не должен ломать UX
      }
    }, 1000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [roundId, round])

  useEffect(() => {
  if (!round || !roundId) return
  if (round.status !== 'open') return
  if (!round.ends_at) return

  // если уже стартовало — выходим
  if (!isPendingEndsAt(round.ends_at)) return

  // стартуем только когда 2+ уникальных игрока
  if (groupedPlayers.length < 2) return

  ;(async () => {
    await tryStartCountdown(roundId)
  })()
    }, [round, roundId, groupedPlayers])

  const onPlaceBet = async () => {
    // защита от спама кликов
    if (isPlacingBet) return

    try {
      setErr('')
      if (!round || !telegramId) return

      const creditsNow = user?.game_data?.credits ?? 0
      if (creditsNow < selectedBet) {
        setErr('Недостаточно кредитов')
        return
      }

      setIsPlacingBet(true)

      // 1) пишем ставку
      await placeBet({
        roundId: round.id,
        telegramId,
        firstName,
        username,
        photoUrl,
        amount: selectedBet
      })

      // 2) сразу подтянем ставки, чтобы UI обновился мгновенно
      const fresh = await getBets(round.id)
      setBets(fresh)

      // 3) списываем кредиты — важно: от текущего user.game_data, а не от "credits" из useMemo
      updateGameData({
        ...user.game_data,
        credits: creditsNow - selectedBet
      })
    } catch (e) {
      console.error(e)
      setErr('Ставка не прошла. Попробуй ещё раз.')
    } finally {
      setIsPlacingBet(false)
    }
  }


    const left = round?.ends_at ? secondsLeft(round.ends_at) : 0

    const winner = useMemo(() => {
    if (!winnerId) return null
    return groupedPlayers.find(p => String(p.telegram_id) === String(winnerId)) || null
    }, [winnerId, groupedPlayers])

function hashToUint32(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleDeterministic(arr, seedStr) {
  const a = arr.slice()
  const rand = mulberry32(hashToUint32(seedStr))
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRouletteStrip(players, seedStr) {
  // делаем длинную ленту из игроков, но без "победитель победитель победитель"
  const base = players.length ? players : []
  const repeated = []

  // делаем много "пачек", каждую пачку перетасовываем детерминированно
  for (let k = 0; k < 22; k++) {
    const batch = shuffleDeterministic(base, `${seedStr}:batch:${k}`)
    repeated.push(...batch)
  }

  return repeated
}

    function animateRoulette(players, winnerTelegramId) {
    if (!players?.length || !winnerTelegramId) return
    if (rouletteShownRef.current) return
    rouletteShownRef.current = true

  const seedStr = `${roundId}:${winnerTelegramId}`
  const strip = buildRouletteStrip(players, seedStr)
  setRouletteItems(strip)

  const ITEM_W = 62
  const GAP = 14
  const STEP = ITEM_W + GAP

  const boxW = rouletteBoxRef.current?.clientWidth || 320
  const centerOffset = (boxW / 2) - (ITEM_W / 2)

  const stripW = strip.length * STEP
  const maxX = 0
  const minX = boxW - stripW

  // если лента вдруг короче окна — просто центрируем
  if (stripW <= boxW) {
    setRouletteX((boxW - stripW) / 2)
    return
  }

  // ---- ВАЖНО: вычисляем диапазон индексов, при котором targetX НЕ будет clamped ----
  // minX <= -(idx*STEP) + centerOffset <= maxX
  const idxMin = Math.ceil((centerOffset - maxX) / STEP)          // targetX <= maxX
  const idxMax = Math.floor((centerOffset - minX) / STEP)         // targetX >= minX

  // предпочтительный диапазон (чтобы остановка была ближе к концу и выглядела честно)
  const prefFrom = Math.max(idxMin, Math.floor(strip.length * 0.70))
  const prefTo = Math.min(idxMax, Math.floor(strip.length * 0.85))

  const winKey = String(winnerTelegramId)

  // собираем кандидатов победителя в пересечении диапазонов
  let candidates = []
  for (let i = prefFrom; i <= prefTo; i++) {
    if (String(strip[i]?.telegram_id) === winKey) candidates.push(i)
  }

  // если вдруг в предпочтительном диапазоне нет — ищем в любом разрешённом диапазоне
  if (candidates.length === 0) {
    for (let i = idxMin; i <= idxMax; i++) {
      if (String(strip[i]?.telegram_id) === winKey) candidates.push(i)
    }
  }

  // если вообще нет — выходим (на практике не должно случаться, strip повторяет игроков много раз)
  if (candidates.length === 0) return

  // берём последний, чтобы остановка была “позже” и зрелищнее
  const winnerIndex = candidates[candidates.length - 1]

  // targetX теперь гарантированно в диапазоне, clamp не нужен
  let targetX = -(winnerIndex * STEP) + centerOffset


    // стартуем чуть правее, чтобы был разгон
    const startX = 20
    setRouletteX(startX)

    if (rouletteAnimRef.current) cancelAnimationFrame(rouletteAnimRef.current)

    const start = performance.now()
    const duration = JACKPOT_CONFIG.SPIN_SECONDS * 1000
    const from = startX
    const to = targetX

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

    const frame = (ts) => {
    const t = Math.min(1, (ts - start) / duration)
    const eased = easeOutCubic(t)
    const x = from + (to - from) * eased

    setRouletteX(x)

    // 👇 вот это добавь
    tickIfNeeded(x, STEP, centerOffset)

    if (t < 1) {
      rouletteAnimRef.current = requestAnimationFrame(frame)
    } else {
      setRouletteDone(true)

      // финальный "более сильный" хаптик, чтобы чувствовалась остановка
      try {
        const hf = window?.Telegram?.WebApp?.HapticFeedback
        hf?.impactOccurred?.('medium')
      } catch {}
    }
  }


    rouletteAnimRef.current = requestAnimationFrame(frame)
    }

    const lastTickRef = useRef({
  index: null,
  ts: 0
})

function hapticTick() {
  // Telegram haptics (лучший вариант)
  try {
    const hf = window?.Telegram?.WebApp?.HapticFeedback
    if (hf?.selectionChanged) {
      hf.selectionChanged()
      return
    }
    if (hf?.impactOccurred) {
      hf.impactOccurred('light')
      return
    }
  } catch {}

  // fallback для Android/Chrome
  try {
    if (navigator?.vibrate) navigator.vibrate(8)
  } catch {}
}

function tickIfNeeded(x, step, centerOffset) {
  // x = текущий translateX ленты
  // step = ширина одного элемента с отступами (STEP)
  // centerOffset = куда приходится указатель относительно начала ленты

  // позиция указателя в координатах ленты
  const pointerPos = -x + centerOffset

  // индекс элемента под указателем
  const idx = Math.floor(pointerPos / step)

  // антиспам: не чаще ~1 тика каждые 25мс
  const now = performance.now()
  if (lastTickRef.current.index !== idx) {
    if (now - lastTickRef.current.ts > 25) {
      lastTickRef.current.index = idx
      lastTickRef.current.ts = now
      hapticTick()
    }
  }
}





  return (
    <div className="screen jackpot-screen">
      <div className="jackpot-topbar">
        <button className="jackpot-back" onClick={() => setActiveScreen('hangar')}>
          ← Назад
        </button>

        <div className="jackpot-titlewrap">
          <div className="jackpot-title">Джекпот</div>
          <div className="jackpot-sub">
            {round?.status === 'open' && (
            groupedPlayers.length < 2 || (round?.ends_at && isPendingEndsAt(round.ends_at))
                ? 'Ожидаем минимум 2 игроков…'
                : `До конца раунда: ${left}s`
            )}
            {round?.status === 'spinning' && 'Крутим рулетку…'}
            {round?.status === 'finished' && 'Раунд завершён'}
          </div>
        </div>

        <div className="jackpot-pot">
          <div className="jackpot-pot-label">Банк</div>
          <div className="jackpot-pot-value">{totalPot} 💰</div>
        </div>
      </div>

      {loading && (
        <div className="jackpot-card">
          <div className="jackpot-muted">Загрузка…</div>
        </div>
      )}

      {!!err && (
        <div className="jackpot-card jackpot-error">
          {err}
        </div>
      )}

      {!loading && (
        <>
          <div className="jackpot-card">
            <div className="jackpot-controls">
              <div className="jackpot-credits">
                Мои кредиты: <b>{credits}</b>
              </div>

              <div className="jackpot-betrow">
                <div className="jackpot-betlabel">Ставка:</div>

                <div className="jackpot-betbuttons">
                  {[5, 10, 25, 50].map(v => (
                    <button
                      key={v}
                      className={`jackpot-chip ${selectedBet === v ? 'active' : ''}`}
                      onClick={() => setSelectedBet(v)}
                      disabled={round?.status !== 'open'}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <button className="jackpot-play" onClick={onPlaceBet} disabled={!canBet}>
                  {isPlacingBet ? '...' : 'Поставить'}
                </button>
              </div>

            {myTotalBet > 0 && (
            <div className="jackpot-mybet">
                Твои ставки в этом раунде: <b>{myTotalBet}</b> (шанс: <b>{(odds[String(telegramId)] || 0).toFixed(1)}%</b>)
            </div>
            )}
            </div>
          </div>

          <div className="jackpot-card">
            <div className="jackpot-section-title">Игроки</div>

            {bets.length === 0 && (
              <div className="jackpot-muted">Пока нет ставок. Сделай первую 🙂</div>
            )}

            <div className="jackpot-players">
            {groupedPlayers.map(p => {
                const pct = (odds[String(p.telegram_id)] || 0).toFixed(1)
                const isWin =
                    (round?.status === 'finished' || rouletteDone) &&
                    winner &&
                    String(winner.telegram_id) === String(p.telegram_id)

                return (
                <div key={p._firstBetId} className={`jackpot-player ${isWin ? 'winner' : ''}`}>
                    <div className="jp-avatar">
                    {p.photo_url ? (
                        <img src={p.photo_url} alt="" />
                    ) : (
                        <div className="jp-avatar-fallback">👤</div>
                    )}
                    </div>

                    <div className="jp-info">
                    <div className="jp-name">
                        {p.first_name || (p.username ? `@${p.username}` : `ID ${p.telegram_id}`)}
                    </div>
                    <div className="jp-meta">
                        ставка <b>{p.amount}</b> • шанс <b>{pct}%</b>
                    </div>
                    </div>

                    {round?.status === 'spinning' && <div className="jp-spin">🎯</div>}
                    {round?.status !== 'spinning' && isWin && <div className="jp-win">🏆</div>}
                </div>
                )
            })}
            </div>

          </div>

            {round?.status !== 'open' && (
            <div className="jackpot-card jackpot-roulette">
                <div className="jackpot-section-title">Рулетка</div>

                <div className="jroulette" ref={rouletteBoxRef}>
                <div className="jroulette-pointer" />

                <div className="jroulette-viewport">
                    <div
                    className="jroulette-strip"
                    style={{ transform: `translateX(${rouletteX}px)` }}
                    >
                    {rouletteItems.map((p, idx) => (
                        <div key={`${idx}-${p.telegram_id}`} className="jroulette-item">
                        {p.photo_url ? (
                            <img src={p.photo_url} alt="" />
                        ) : (
                            <div className="jroulette-fallback">👤</div>
                        )}
                        </div>
                    ))}
                    </div>
                </div>
                </div>

                <div className="jroulette-label">
                {round?.status === 'spinning' && 'Крутится…'}
                {round?.status === 'finished' && winner && (
                    <>Победитель: <b>{winner.first_name || (winner.username ? `@${winner.username}` : `ID ${winner.telegram_id}`)}</b></>
                )}
                {round?.status === 'finished' && !winner && 'Нет победителя'}
                </div>
            </div>
            )}

        </>
      )}
    </div>
  )
}
