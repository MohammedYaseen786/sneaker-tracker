"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  Users, BarChart3, FileSpreadsheet, Settings,
  TrendingUp, X, ChevronRight
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/import", label: "Import / Export", icon: FileSpreadsheet },
  { href: "/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-card transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-foreground">SoleTracker</p>
              <p className="text-xs text-muted-foreground">Business Dashboard</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-brand-600/10 text-brand-400 border border-brand-500/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-brand-400")} />
                <span>{label}</span>
                {isActive && (
                  <ChevronRight className="ml-auto h-3 w-3 text-brand-400" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground text-center">SoleTracker v1.0</p>
        </div>
      </aside>
    </>
  )
}
