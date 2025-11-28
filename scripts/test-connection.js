import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, key)

async function test() {
  console.log('Testing Supabase connection to', url)

  // Test a simple select on workouts
  try {
    const { data, error } = await supabase.from('workouts').select('*').limit(5)
    if (error) {
      console.error('Query error (workouts):', error)
    } else {
      console.log('workouts rows:', data?.length ?? 0)
      console.log(data)
    }
  } catch (e) {
    console.error('Unexpected error querying workouts:', e)
  }

  // Test auth.getUser
  try {
    const userRes = await supabase.auth.getUser()
    console.log('auth.getUser() ->', userRes)
  } catch (e) {
    console.error('Error calling auth.getUser():', e)
  }
}

test().finally(() => process.exit())
