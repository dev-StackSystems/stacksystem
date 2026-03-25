import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/shared/utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200",
        outline:
          "border-2 border-neutral-200 bg-white hover:border-orange-300 text-neutral-700 hover:text-orange-600 hover:bg-orange-50",
        ghost:
          "hover:bg-orange-50 text-neutral-700 hover:text-orange-600",
        link:
          "text-orange-500 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-11 px-7",
        sm:      "h-9 px-5 text-xs",
        lg:      "h-13 px-9 text-base",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
