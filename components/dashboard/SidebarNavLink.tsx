"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

interface Props {
  href: string
  label: string
  icon: LucideIcon
}

export function SidebarNavLink({ href, label, icon: Icon }: Props) {
  const pathname = usePathname()
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-orange-500/15 text-orange-400 border border-orange-500/20"
          : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
      }`}
    >
      <Icon size={17} />
      {label}
    </Link>
  )
}
