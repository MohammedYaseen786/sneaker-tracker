import { TrendingUp } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTYgNnY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10 max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/20">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">SoleTracker</h1>
              <p className="text-brand-200 text-sm">Business Dashboard</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Manage your sneaker business like a pro
          </h2>
          <p className="text-brand-200 mb-8">
            Track inventory, sales, profit, and customers all in one place.
            Import from Excel. Export reports. Grow your business.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Inventory", value: "Track" },
              { label: "Profit", value: "Analyze" },
              { label: "Sales", value: "Grow" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-brand-200 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        {children}
      </div>
    </div>
  )
}
