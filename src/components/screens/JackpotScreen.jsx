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
  JACKPOT_CONFIG
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
  const [winnerId, setWinnerId] = useState(null)
  const [err, setErr] = useState('')

  const [selectedBet, setSelectedBet] = useState(10)

  const pollRef = useRef(null)
  const spinTimerRef = useRef(null)

  const roundId = round?.id || null

  const totalPot = useMemo(
    () => bets.reduce((s, b) => s + (b.amount || 0), 0),
    [bets]
  )

  const credits = useMemo(() => user?.game_data?.credits ?? 0, [user])

    const myTotalBet = useMemo(() => {
    if (!telegramId) return 0
    return bets
        .filter(b => String(b.telegram_id) === String(telegramId))
        .reduce((s, b) => s + (b.amount || 0), 0)
    }, [bets, telegramId])

    const odds = useMemo(() => {
    if (totalPot <= 0) return {}
    const map = {}
    for (const p of groupedPlayers) {
        map[String(p.telegram_id)] = (p.amount / totalPot) * 100
    }
    return map
    }, [groupedPlayers, totalPot])


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


    const canBet = useMemo(() => {
    if (!round) return false
    if (round.status !== 'open') return false
    if (!telegramId) return false
    return credits >= selectedBet
    }, [round, telegramId, credits, selectedBet])

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
            }

            // finished -> подождём чуть-чуть и перейдём на новый open раунд
            if (next?.status === 'finished') {
              setSpinning(false)
              setTimeout(async () => {
                const newOpen = await ensureOpenRound(telegramId)
                if (!alive) return
                setRound(newOpen)
                setWinnerId(newOpen?.winner_telegram_id ?? null)
                const newBets = await getBets(newOpen.id)
                if (!alive) return
                setBets(newBets)
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
          const left = secondsLeft(r.ends_at)
          if (left <= 0) {
            const listNow = await getBets(r.id)
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

  const onPlaceBet = async () => {
    try {
      setErr('')
      if (!round || !telegramId) return

      if (credits < selectedBet) {
        setErr('Недостаточно кредитов')
        return
      }

      // 1) делаем ставку в БД
      await placeBet({
        roundId: round.id,
        telegramId,
        firstName,
        username,
        photoUrl,
        amount: selectedBet
      })

      // 2) сразу обновляем UI (не ждём realtime)
      const fresh = await getBets(round.id)
      setBets(fresh)

      // 3) списываем кредиты локально
      updateGameData({ ...user.game_data, credits: credits - selectedBet })
    } catch (e) {
      console.error(e)
      setErr('Ставка не прошла. Возможно, ты уже сделал ставку в этом раунде.')
    }
  }

  const left = round?.ends_at ? secondsLeft(round.ends_at) : 0

    const winner = useMemo(() => {
    if (!winnerId) return null
    return groupedPlayers.find(p => String(p.telegram_id) === String(winnerId)) || null
    }, [winnerId, groupedPlayers])

  return (
    <div className="screen jackpot-screen">
      <div className="jackpot-topbar">
        <button className="jackpot-back" onClick={() => setActiveScreen('hangar')}>
          ← Назад
        </button>

        <div className="jackpot-titlewrap">
          <div className="jackpot-title">Джекпот</div>
          <div className="jackpot-sub">
            {round?.status === 'open' && `До конца раунда: ${left}s`}
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
                  Поставить
                </button>
              </div>

            {myTotalBet > 0 && (
            <div className="jackpot-mybet">
                Твои ставки в этом раунде: <b>{myTotalBet}</b> (шанс: <b>{(odds[Number(telegramId)] || 0).toFixed(1)}%</b>)
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
                const isWin = winner && String(winner.telegram_id) === String(p.telegram_id)

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

          <div className="jackpot-card jackpot-roulette">
            <div className="jackpot-section-title">Рулетка</div>
            <div className="jackpot-roulette-box">
              {round?.status === 'open' && <div className="jackpot-muted">Ждём завершения раунда…</div>}
              {round?.status === 'spinning' && <div className="jackpot-spintext">Крутится…</div>}
              {round?.status === 'finished' && winner && (
                <div className="jackpot-winnertext">
                  Победитель: <b>{winner.first_name || (winner.username ? `@${winner.username}` : `ID ${winner.telegram_id}`)}</b>
                </div>
              )}
              {round?.status === 'finished' && !winner && (
                <div className="jackpot-muted">Нет победителя (недостаточно ставок)</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
