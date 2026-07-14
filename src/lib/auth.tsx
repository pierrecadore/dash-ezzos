import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

type Profile = { id: string; full_name: string | null; role: string | null }
type AuthCtx = { session: Session | null; profile: Profile | null; loading: boolean }

const Ctx = createContext<AuthCtx>({ session: null, profile: null, loading: true })
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaura sessão salva (correção do bug v1) e escuta mudanças
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setProfile(null); return }
    supabase.from('profiles').select('id,full_name,role').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data))
  }, [session?.user?.id])

  return <Ctx.Provider value={{ session, profile, loading }}>{children}</Ctx.Provider>
}
