import { cn } from "@/lib/utils"

interface ShinyTextProps {
  text: string
  className?: string
  shimmerColor?: string
}

export function ShinyText({ text, className = "" }: ShinyTextProps) {
  return (
    <span
      className={cn(
        "inline-block bg-[linear-gradient(110deg,#9333ea,45%,#ec4899,55%,#3b82f6)] bg-[length:200%_100%] bg-clip-text text-transparent animate-shine font-semibold",
        className
      )}
    >
      {text}
    </span>
  )
}
