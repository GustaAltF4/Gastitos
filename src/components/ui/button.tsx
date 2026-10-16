import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-base font-bold transition-all duration-100 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.94] active:brightness-90 select-none touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm shadow-primary/25 active:ring-4 active:ring-primary/30",
        destructive:
          "bg-rose-600 text-white shadow-sm shadow-rose-600/25 dark:bg-rose-600 active:bg-rose-700 active:ring-4 active:ring-rose-500/30",
        outline:
          "border border-primary/30 bg-background shadow-xs active:bg-primary/15 active:border-primary active:text-primary",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs active:bg-primary/20",
        ghost: "active:bg-primary/15 active:text-primary",
        link: "text-primary underline underline-offset-4 active:opacity-75",
        gradient:
          "bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-md shadow-primary/25 active:ring-4 active:ring-primary/30",
      },
      size: {
        default: "h-12 px-5 py-2.5 text-base font-bold",
        sm: "h-10 rounded-lg px-3.5 text-sm font-bold",
        lg: "h-16 rounded-2xl px-8 text-xl font-black",
        icon: "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
