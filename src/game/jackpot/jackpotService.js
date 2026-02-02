import { supabase } from '../../lib/supabase'

const ROUND_SECONDS = 30
const SPIN_SECONDS = 7
const PENDING_DAYS = 365 // “ожидание игроков”: ends_at далеко в будущем

function nowMs() {
  return Date.now()
}

function makeSeed() {
  // для MVP достаточно; потом заменим на provably fair на бэке
  return `${nowMs()}_${Math.random().toString(16).slice(2)}`
}

function hashToUint32(str) {
  // простая детерминированная мешалка (для одинакового результата у всех)
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pickWinnerDeterministic(bets, seed, roundId) {
  if (!bets || bets.length === 0) return null
  const total = bets.reduce((s, b) => s + (b.amount || 0), 0)
  if (total <= 0) return null

  const x = hashToUint32(`${seed}:${roundId}`)
  const r = x % total

  let acc = 0
  for (const b of bets) {
    acc += b.amount
    if (r < acc) return b
  }
  return bets[bets.length - 1] || null
}

export async function getCurrentRound() {
  const { data, error } = await supabase
    .from('jackpot_rounds')
    .select('*')
    .in('status', ['open', 'spinning'])
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return data?.[0] || null
}

export async function getBets(roundId) {
  const { data, error } = await supabase
    .from('jackpot_bets')
    .select('*')
    .eq('round_id', roundId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function ensureOpenRound(ownerTelegramId) {
  const cur = await getCurrentRound()
  if (cur && cur.status === 'open') return cur
  if (cur && cur.status === 'spinning') return cur

  const endsAt = new Date(nowMs() + PENDING_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('jackpot_rounds')
    .insert([
      {
        status: 'open',
        ends_at: endsAt,
        seed: makeSeed(),
        owner_telegram_id: ownerTelegramId || null
      }
    ])
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function placeBet({ roundId, telegramId, firstName, username, photoUrl, amount }) {
  const { data, error } = await supabase
    .from('jackpot_bets')
    .insert([
      {
        round_id: roundId,
        telegram_id: telegramId,
        first_name: firstName || null,
        username: username || null,
        photo_url: photoUrl || null,
        amount
      }
    ])
    .select('*')
    .single()

  if (error) throw error
  return data
}

// “Лидерская” попытка закрыть раунд.
// Несколько клиентов могут попытаться — но обновление пройдёт только у одного, потому что фильтр status=open.
export async function tryCloseRoundAndPickWinner({ round, bets }) {
  if (!round || round.status !== 'open') return null
  if (!bets || bets.length < 2) return null

  const uniq = new Set(bets.map(b => String(b.telegram_id)))
  if (uniq.size < 2) return null

  const winner = pickWinnerDeterministic(bets, round.seed, round.id)
  if (!winner) return null

  const { data, error } = await supabase
    .from('jackpot_rounds')
    .update({
      status: 'spinning',
      winner_telegram_id: winner.telegram_id,
      updated_at: new Date().toISOString()
    })
    .eq('id', round.id)
    .eq('status', 'open')
    .select('*')
    .single()

  // если не мы закрыли (race) — просто вернём null
  if (error) return null
  return data
}

export async function tryFinishRound(roundId) {
  // перевод spinning -> finished по таймеру
  const { data, error } = await supabase
    .from('jackpot_rounds')
    .update({ status: 'finished', updated_at: new Date().toISOString() })
    .eq('id', roundId)
    .eq('status', 'spinning')
    .select('*')
    .single()

  if (error) return null
  return data
}

export function secondsLeft(endsAtIso) {
  const t = new Date(endsAtIso).getTime()
  return Math.max(0, Math.ceil((t - nowMs()) / 1000))
}

export const JACKPOT_CONFIG = {
  ROUND_SECONDS,
  SPIN_SECONDS
}

export async function claimPayout(roundId, telegramId) {
  const { data, error } = await supabase.rpc('jackpot_claim_payout', {
    p_round_id: roundId,
    p_telegram_id: telegramId
  })
  if (error) throw error
  return data
}


export function isPendingEndsAt(endsAtIso) {
  // если ends_at слишком далеко, считаем что таймер ещё не стартовал
  // (порог = в 2 раза больше длины раунда)
  return secondsLeft(endsAtIso) > JACKPOT_CONFIG.ROUND_SECONDS * 2
}

export async function tryStartCountdown(roundId) {
  const newEnds = new Date(Date.now() + JACKPOT_CONFIG.ROUND_SECONDS * 1000).toISOString()

  // “лидерская” попытка: стартуем только если status=open (и не трогаем если уже стартовало)
  const { data, error } = await supabase
    .from('jackpot_rounds')
    .update({ ends_at: newEnds, updated_at: new Date().toISOString() })
    .eq('id', roundId)
    .eq('status', 'open')
    .select('*')
    .single()

  // если не мы обновили (race) — норм, просто вернём null
  if (error) return null
  return data
}

export async function trySetPendingCountdown(roundId) {
  const pendingEnds = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('jackpot_rounds')
    .update({ ends_at: pendingEnds, updated_at: new Date().toISOString() })
    .eq('id', roundId)
    .eq('status', 'open')
    .select('*')
    .single()

  if (error) return null
  return data
}