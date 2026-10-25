import Link from "next/link"
import { TrendingUp, KeyRound } from "lucide-react"

// There's no email server in the local version, so passwords are reset from the terminal.
export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="flex items-center gap-2 mb-8 lg:hidden">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold">SoleTracker</span>
      </div>
      <div className="mb-6">
        <KeyRound className="h-10 w-10 text-brand-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Reset password</h1>
        <p className="text-muted-foreground">
          SoleTracker runs on your computer, so password resets are done from the terminal.
          Open a terminal in the project folder and run:
        </p>
      </div>
      <pre className="rounded-lg border border-border bg-muted px-4 py-3 text-sm overflow-x-auto">
        npm run reset-password -- you@example.com newpassword
      </pre>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">← Back to login</Link>
      </p>
    </div>
  )
}
