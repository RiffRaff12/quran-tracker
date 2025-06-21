import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error signing in',
        description: error.message,
      })
    } else {
      toast({
        title: 'Check your email!',
        description: 'A magic link has been sent to you to sign in.',
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-800">Quran Revision Tracker</CardTitle>
          <CardDescription>Sign in to track your revision progress</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                required={true}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 