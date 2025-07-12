"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BarChart3, QrCode, Settings, Users, FolderOpen, Plus, Home, Download, FileText, Zap } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Generate QR", href: "/generate", icon: Plus },
  { name: "My QR Codes", href: "/codes", icon: QrCode },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Folders", href: "/folders", icon: FolderOpen },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Bulk Upload", href: "/bulk", icon: Download },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={cn("flex flex-col border-r bg-muted/40 transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <QrCode className="h-6 w-6" />
          {!collapsed && <span>QR Platform</span>}
        </Link>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => setCollapsed(!collapsed)}>
          <Zap className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
