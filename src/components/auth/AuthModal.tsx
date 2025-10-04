'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { useAuthStore } from '@/store/authStore'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

export default function AuthModal({ open, onOpenChange }: Props) {
  const { user, login, register, logout, isLoading } = useAuthStore()
  const [tab, setTab] = useState<'login'|'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await login(email, password)
    if (result.success) {
      setEmail('')
      setPassword('')
      onOpenChange(false)
    } else {
      setError(result.message || 'Login failed')
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await register(email, password, name)
    if (result.success) {
      setEmail('')
      setPassword('')
      setName('')
      onOpenChange(false)
    } else {
      setError(result.message || 'Registration failed')
    }
  }

  async function handleLogout() {
    await logout()
    onOpenChange(false)
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
            <button onClick={handleLogout} disabled={isLoading} className="w-full px-4 py-2 border border-border rounded hover:bg-accent transition-colors">
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
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
                <button type="submit" disabled={isLoading} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
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
                <button type="submit" disabled={isLoading} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                  {isLoading ? 'Creating account...' : 'Create account'}
                </button>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
