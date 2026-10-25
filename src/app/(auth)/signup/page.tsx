"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, TrendingUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" })
      return
    }
    if (password.length < 6) {
      toast({ variant: "destructive", title: "Password too short", description: "Password must be at least 6 characters" })
      return
    }
    setLoading(true)
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast({ variant: "destructive", title: "Signup failed", description: json.error || "Something went wrong" })
      setLoading(false)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold">SoleTracker</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-muted-foreground">Start tracking your sneaker business for free</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required className="h-11 pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input id="confirmPassword" type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="h-11" />
        </div>

        <Button type="submit" className="w-full h-11" variant="brand" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
      </p>
    </div>
  )
}
