"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, Bell, Sun, Moon, LogOut, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [notifications, setNotifications] = useState(0)

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        // Session cookie is stale (e.g. the database was reset) — clear it and go to login
        handleSignOut()
        return
      }
      const json = await res.json()
      setUser(json.user)

      const notifRes = await fetch('/api/notifications')
      if (notifRes.ok) {
        const notifJson = await notifRes.json()
        setNotifications(notifJson.unread || 0)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-9 w-9"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {notifications > 9 ? '9+' : notifications}
            </span>
          )}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/20 text-brand-400 text-sm font-semibold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">My Account</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
