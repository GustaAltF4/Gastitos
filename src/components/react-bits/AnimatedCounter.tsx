import { useEffect, useRef } from "react"
import { useMotionValue, useSpring } from "framer-motion"
import { formatCurrency } from "@/lib/utils"

interface AnimatedCounterProps {
  value: number
  currency?: string
  className?: string
}

export function AnimatedCounter({ value, currency = "ARS", className = "" }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionVal = useMotionValue(0)
  const springVal = useSpring(motionVal, {
    damping: 30,
    stiffness: 150,
  })

  useEffect(() => {
    motionVal.set(value)
  }, [motionVal, value])

  useEffect(() => {
    return springVal.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatCurrency(Math.round(latest), currency)
      }
    })
  }, [springVal, currency])

  return (
    <span ref={ref} className={className}>
      {formatCurrency(value, currency)}
    </span>
  )
}
