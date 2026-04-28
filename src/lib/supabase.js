import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mfgetzhhnrxejznnrddv.supabase.co'
const supabaseAnonKey = 'sb_publishable_2_mykExscP4yV8klBXSwEA_yXDv7qog'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
