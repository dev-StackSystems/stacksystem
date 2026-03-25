"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

interface Props {
  href: string
  label: string
  icon: LucideIcon
  brandColor?: string
}

export function SidebarNavLink({ href, label, icon: Icon, brandColor }: Props) {
  const pathname = usePathname()
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
  const color = brandColor || "#f97316"

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active ? "border" : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
      }`}
      style={
        active
          ? {
              background: `${color}26`,
              color: color,
              borderColor: `${color}33`,
            }
          : undefined
      }
    >
      <Icon size={17} />
      {label}
    </Link>
  )
}
