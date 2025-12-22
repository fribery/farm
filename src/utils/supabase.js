import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Функция для проверки данных Telegram
export async function verifyTelegramData(initData) {
  const encoder = new TextEncoder()
  
  // Извлекаем хеш из initData
  const initDataParams = new URLSearchParams(initData)
  const hash = initDataParams.get('hash')
  initDataParams.delete('hash')
  
  // Сортируем параметры
  const sortedParams = Array.from(initDataParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  
  // Создаем секретный ключ
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  // Вычисляем хеш
  const secret = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(import.meta.env.VITE_TELEGRAM_BOT_TOKEN)
  )
  
  const dataKey = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const dataHash = await crypto.subtle.sign(
    'HMAC',
    dataKey,
    encoder.encode(sortedParams)
  )
  
  // Сравниваем хеши
  const calculatedHash = Array.from(new Uint8Array(dataHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return calculatedHash === hash
}