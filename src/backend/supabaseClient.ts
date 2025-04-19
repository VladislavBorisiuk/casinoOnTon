import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xsnhkkhjbcopxiqitgee.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhzbmhra2hqYmNvcHhpcWl0Z2VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDgwMDYsImV4cCI6MjA2MDM4NDAwNn0.Ilz3wFO1LF-I7yC5PenAY4MfrRPPodwtaDk1VMxRAUU'

export const supabase = createClient(supabaseUrl, supabaseKey)
