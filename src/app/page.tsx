import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export default function Home() {
  if (getUser()) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
