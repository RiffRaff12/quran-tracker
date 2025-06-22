import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { useToast } from '@/hooks/use-toast'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    // Insert into pending_users
    const { error } = await supabase.from('pending_users').insert({ email })
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Registration error',
        description: error.message,
      })
    } else {
      setSubmitted(true)
      toast({
        title: 'Registration submitted',
        description: 'Your registration is pending admin approval.',
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-800">Quran Revision Tracker</CardTitle>
          <CardDescription>Sign up to request access</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center text-emerald-700 font-medium py-8">
              Your registration is pending admin approval.<br />You will be notified by email if approved.
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  required={true}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || submitted}
                />
              </div>
              <div>
                <Button type="submit" className="w-full" disabled={loading || submitted}>
                  {loading ? 'Submitting...' : 'Request Access'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 