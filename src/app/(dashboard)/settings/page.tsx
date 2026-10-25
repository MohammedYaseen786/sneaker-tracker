"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, User, Bell, Palette, Banknote, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand (ZAR)' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (NGN)' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham (AED)' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (AUD)' },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const [settings, setSettings] = useState({
    business_name: '',
    currency: 'ZAR',
    currency_symbol: 'R',
    default_markup: 30,
    theme: 'dark',
    low_stock_threshold: 2,
    aging_days_threshold: 60,
    email_notifications: false,
  })

  useEffect(() => {
    const load = async () => {
      const meRes = await fetch('/api/auth/me')
      if (meRes.ok) {
        const me = await meRes.json()
        setUserEmail(me.user?.email || '')
      }

      const res = await fetch('/api/settings')
      const json = await res.json()
      if (json.data) setSettings(json.data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    const json = await res.json()
    if (!res.ok) {
      toast({ variant: "destructive", title: "Error", description: json.error })
    } else {
      toast({ title: "Settings saved!" })
      setTheme(settings.theme)
    }
    setSaving(false)
  }

  const handleCurrencyChange = (code: string) => {
    const currency = CURRENCIES.find(c => c.code === code)
    setSettings(s => ({ ...s, currency: code, currency_symbol: currency?.symbol || 'R' }))
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match" })
      return
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Password must be at least 6 characters" })
      return
    }
    setChangingPw(true)
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      toast({ variant: "destructive", title: "Error", description: json.error || "Could not update password" })
    } else {
      toast({ title: "Password updated!" })
      setNewPassword('')
      setConfirmPassword('')
    }
    setChangingPw(false)
  }

  if (loading) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and business preferences</p>
      </div>

      <Tabs defaultValue="business">
        <TabsList>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />Business Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Business Name</Label>
                <Input
                  placeholder="My Sneaker Business"
                  value={settings.business_name}
                  onChange={e => setSettings(s => ({ ...s, business_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={settings.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Default Markup (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="1000"
                  value={settings.default_markup}
                  onChange={e => setSettings(s => ({ ...s, default_markup: parseFloat(e.target.value) || 0 }))}
                />
                <p className="text-xs text-muted-foreground">Used to suggest selling prices when adding inventory</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Low Stock Threshold</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.low_stock_threshold}
                    onChange={e => setSettings(s => ({ ...s, low_stock_threshold: parseInt(e.target.value) || 2 }))}
                  />
                  <p className="text-xs text-muted-foreground">Trigger alert when quantity ≤ this</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Aging Days Threshold</Label>
                  <Input
                    type="number"
                    min="1"
                    value={settings.aging_days_threshold}
                    onChange={e => setSettings(s => ({ ...s, aging_days_threshold: parseInt(e.target.value) || 60 }))}
                  />
                  <p className="text-xs text-muted-foreground">Flag unsold items after this many days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Theme</Label>
                <div className="flex gap-3">
                  {['dark', 'light', 'system'].map(t => (
                    <button
                      key={t}
                      onClick={() => { setSettings(s => ({ ...s, theme: t })); setTheme(t) }}
                      className={`flex-1 rounded-xl border p-4 text-sm font-medium capitalize transition-colors ${
                        settings.theme === t ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-border hover:bg-accent'
                      }`}
                    >
                      {t === 'dark' ? '🌙' : t === 'light' ? '☀️' : '💻'} {t}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={userEmail} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Contact support to change your email</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <Button variant="outline" onClick={handlePasswordChange} disabled={changingPw || !newPassword}>
                {changingPw ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Changing...</> : 'Update Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />Notification Settings
              </CardTitle>
              <CardDescription>Control what alerts you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { key: 'low_stock', label: 'Low Stock Alerts', desc: 'When a product falls below your threshold' },
                  { key: 'aging', label: 'Aging Inventory', desc: 'Unsold items past the aging threshold' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-emerald-400 font-medium">Active</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">In-app notifications are always enabled. Email notifications coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="brand" onClick={handleSave} disabled={saving} size="lg">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Save Settings</>}
        </Button>
      </div>
    </div>
  )
}
