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
  claimPayout,
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

  const timerRef = useRef(null)
  const spinTimerRef = useRef(null)

  const totalPot = useMemo(
    () => bets.reduce((s, b) => s + (b.amount || 0), 0),
    [bets]
  )

  const myBet = useMemo(() => {
    if (!telegramId) return null
    return bets.find(b => String(b.telegram_id) === String(telegramId)) || null
  }, [bets, telegramId])

  const odds = useMemo(() => {
    if (totalPot <= 0) return {}
    const map = {}
    for (const b of bets) {
      map[b.telegram_id] = (b.amount / totalPot) * 100
    }
    return map
  }, [bets, totalPot])

  const canBet = useMemo(() => {
    if (!round) return false
    if (round.status !== 'open') return false
    if (!telegramId) return false
    if (myBet) return false
    const credits = user?.game_data?.credits ?? 0
    return credits >= selectedBet
  }, [round, telegramId, myBet, user, selectedBet])

  // --- realtime подписки на раунд и ставки
  useEffect(() => {
    let betsChannel = null
    let roundChannel = null
    let cancelled = false

    const boot = async () => {
      try {
        setErr('')
        setLoading(true)

        // берём или создаём open раунд
        const open = await ensureOpenRound(telegramId)
        if (cancelled) return
        setRound(open)

        // загрузим ставки
        const list = await getBets(open.id)
        if (cancelled) return
        setBets(list)

        // подписка на обновления раунда
        roundChannel = supabase
          .channel(`jackpot_round_${open.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'jackpot_rounds', filter: `id=eq.${open.id}` },
            payload => {
              const next = payload.new
              setRound(next)

              if (next?.winner_telegram_id) {
                setWinnerId(next.winner_telegram_id)
              }

              // старт визуального спина, когда статус стал spinning
              if (next?.status === 'spinning') {
                setSpinning(true)
                if (spinTimerRef.current) clearTimeout(spinTimerRef.current)
                spinTimerRef.current = setTimeout(async () => {
                  setSpinning(false)
                  // лидер попробует финишнуть; остальные просто увидят
                  await tryFinishRound(next.id)
                }, JACKPOT_CONFIG.SPIN_SECONDS * 1000)
              }

              // когда finished — через секунду создадим следующий open раунд
                if (next?.status === 'finished') {

                // если это мой выигрыш — забираем выплату (идемпотентно)
                if (next?.winner_telegram_id && telegramId &&
                    String(next.winner_telegram_id) === String(telegramId)
                ) {
                    (async () => {
                    try {
                        const added = await claimPayout(next.id, telegramId)

                        if (added > 0) {
                        const creditsNow = user?.game_data?.credits ?? 0
                        updateGameData({
                            ...user.game_data,
                            credits: creditsNow + added
                        })
                        }
                    } catch (e) {
                        // если уже забрано или ошибка — просто игнор
                        console.error('claimPayout error:', e)
                    }
                    })()
                }

                // переход к следующему раунду
                setTimeout(async () => {
                    const newOpen = await ensureOpenRound(telegramId)
                    setRound(newOpen)
                    const newBets = await getBets(newOpen.id)
                    setBets(newBets)
                    setWinnerId(null)
                    setSpinning(false)
                }, 1200)
                }
            }
          )
          .subscribe()

        // подписка на ставки
        betsChannel = supabase
          .channel(`jackpot_bets_${open.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'jackpot_bets', filter: `round_id=eq.${open.id}` },
            async () => {
              const fresh = await getBets(open.id)
              setBets(fresh)
            }
          )
          .subscribe()

        // локальный таймер для попытки закрытия (любая вкладка может попытаться)
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(async () => {
          const r = await getCurrentRound()
          if (!r) return
          if (r.status !== 'open') return

          const left = secondsLeft(r.ends_at)
          if (left <= 0) {
            const listNow = await getBets(r.id)
            // попытка закрыть/выбрать победителя — победит один клиент
            await tryCloseRoundAndPickWinner({ round: r, bets: listNow })
          }
        }, 1000)
      } catch (e) {
        console.error(e)
        setErr('Не удалось загрузить джекпот. Проверь Supabase и таблицы.')
      } finally {
        setLoading(false)
      }
    }

    boot()

    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current)
      if (betsChannel) supabase.removeChannel(betsChannel)
      if (roundChannel) supabase.removeChannel(roundChannel)
    }
  }, [telegramId])

    const onPlaceBet = async () => {
    try {
        setErr('')
        if (!round || !telegramId) return

        const credits = user?.game_data?.credits ?? 0
        if (credits < selectedBet) {
        setErr('Недостаточно кредитов')
        return
        }

        // 1) сначала делаем ставку в БД (если уже ставил — упадёт по unique index)
        await placeBet({
        roundId: round.id,
        telegramId,
        firstName,
        username,
        photoUrl,
        amount: selectedBet
        })

        // 2) только если ставка реально прошла — списываем кредиты
        updateGameData({ ...user.game_data, credits: credits - selectedBet })
    } catch (e) {
        console.error(e)
        setErr('Ставка не прошла. Возможно, ты уже сделал ставку в этом раунде.')
    }
    }

  const left = round?.ends_at ? secondsLeft(round.ends_at) : 0

  const winner = useMemo(() => {
    if (!winnerId) return null
    return bets.find(b => String(b.telegram_id) === String(winnerId)) || null
  }, [winnerId, bets])

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
                Мои кредиты: <b>{user?.game_data?.credits ?? 0}</b>
              </div>

              <div className="jackpot-betrow">
                <div className="jackpot-betlabel">Ставка:</div>

                <div className="jackpot-betbuttons">
                  {[5, 10, 25, 50].map(v => (
                    <button
                      key={v}
                      className={`jackpot-chip ${selectedBet === v ? 'active' : ''}`}
                      onClick={() => setSelectedBet(v)}
                      disabled={round?.status !== 'open' || !!myBet}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <button className="jackpot-play" onClick={onPlaceBet} disabled={!canBet}>
                  {myBet ? 'Ставка сделана' : 'Поставить'}
                </button>
              </div>

              {myBet && (
                <div className="jackpot-mybet">
                  Твоя ставка: <b>{myBet.amount}</b> (шанс: <b>{(odds[myBet.telegram_id] || 0).toFixed(1)}%</b>)
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
              {bets.map(b => {
                const pct = (odds[b.telegram_id] || 0).toFixed(1)
                const isWin = winner && String(winner.telegram_id) === String(b.telegram_id)

                return (
                  <div key={b.id} className={`jackpot-player ${isWin ? 'winner' : ''}`}>
                    <div className="jp-avatar">
                      {b.photo_url ? (
                        <img src={b.photo_url} alt="" />
                      ) : (
                        <div className="jp-avatar-fallback">👤</div>
                      )}
                    </div>

                    <div className="jp-info">
                      <div className="jp-name">
                        {b.first_name || (b.username ? `@${b.username}` : `ID ${b.telegram_id}`)}
                      </div>
                      <div className="jp-meta">
                        ставка <b>{b.amount}</b> • шанс <b>{pct}%</b>
                      </div>
                    </div>

                    {spinning && <div className="jp-spin">🎯</div>}
                    {!spinning && isWin && <div className="jp-win">🏆</div>}
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
