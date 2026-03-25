import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {}

function Badge({ className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[11px] font-bold text-orange-600 uppercase tracking-[0.14em]",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
