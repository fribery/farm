import { createClient } from '@supabase/supabase-js'

// Проверяем переменные окружения с дефолтными значениями для разработки
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sqiszyeauncebbxdsavq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXN6eWVhdW5jZWJieGRzYXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNDAxNzAsImV4cCI6MjA4MTkxNjE3MH0.ESSYsrnx1FIPzU1Ss_w_L723MaEjk8-ADkVst9MX9KA'

console.log('Supabase URL:', supabaseUrl ? 'Установлен' : 'Не установлен')
console.log('Supabase Key:', supabaseAnonKey ? 'Установлен' : 'Не установлен')

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase переменные окружения не установлены!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})