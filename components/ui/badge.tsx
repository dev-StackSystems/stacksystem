import * as React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {}

function Badge({ className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-green-700/30 bg-green-900/20 px-4 py-1.5 text-xs font-semibold text-green-400 uppercase tracking-widest",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
