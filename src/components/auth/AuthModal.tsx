'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export default function AuthModal({ open, onOpenChange }: Props) {
  const [tab, setTab] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string; name?: string; isAdmin: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const j = await res.json()
          setUser(j.user || null)
        } else {
          setUser(null)
        }
      } catch { setUser(null) }
    })()
  }, [open])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.message || 'Login failed')
      setUser(j.user)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.message || 'Register failed')
      setUser(j.user)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Register failed')
    } finally { setLoading(false) }
  }

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
        </DialogHeader>
        {user ? (
          <div className="space-y-4">
            <div className="text-sm">
              <div className="font-medium">{user.email}</div>
              {user.name && <div className="text-muted-foreground">{user.name}</div>}
              {user.isAdmin && <div className="text-xs mt-1 inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-800">Admin</div>}
            </div>
            <button onClick={handleLogout} disabled={loading} className="w-full px-4 py-2 border border-border rounded hover:bg-accent transition-colors">Logout</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 text-sm">
              <button onClick={() => setTab('login')} className={`px-3 py-1 rounded ${tab==='login'?'bg-primary text-primary-foreground':'border border-border hover:bg-accent'}`}>Login</button>
              <button onClick={() => setTab('register')} className={`px-3 py-1 rounded ${tab==='register'?'bg-primary text-primary-foreground':'border border-border hover:bg-accent'}`}>Register</button>
            </div>
            {tab==='login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-sm">Email</label>
                  <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required className="w-full px-3 py-2 border border-border rounded" />
                </div>
                <div>
                  <label className="text-sm">Password</label>
                  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required className="w-full px-3 py-2 border border-border rounded" />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">Login</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="text-sm">Name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} type="text" className="w-full px-3 py-2 border border-border rounded" />
                </div>
                <div>
                  <label className="text-sm">Email</label>
                  <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required className="w-full px-3 py-2 border border-border rounded" />
                </div>
                <div>
                  <label className="text-sm">Password</label>
                  <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required minLength={8} className="w-full px-3 py-2 border border-border rounded" />
                </div>
                {error && <div className="text-red-600 text-sm">{error}</div>}
                <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">Create account</button>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

