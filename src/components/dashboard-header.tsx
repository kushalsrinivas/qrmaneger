import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your QR code performance.
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button asChild>
          <Link href="/generate">
            <Plus className="mr-2 h-4 w-4" />
            Create QR Code
          </Link>
        </Button>
      </div>
    </div>
  )
}
