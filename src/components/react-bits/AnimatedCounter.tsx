import { useEffect, useLayoutEffect, useRef } from "react"
import { useMotionValue, useSpring } from "framer-motion"
import { cn, formatCurrencyParts } from "@/lib/utils"

interface AnimatedCounterProps {
  value: number
  currency?: string
  className?: string
}

export function AnimatedCounter({ value, currency = "ARS", className = "" }: AnimatedCounterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const mainTextRef = useRef<HTMLSpanElement>(null)
  const centsRef = useRef<HTMLElement>(null)

  const motionVal = useMotionValue(0)
  const springVal = useSpring(motionVal, {
    damping: 30,
    stiffness: 150,
  })

  const adjustSize = () => {
    const container = containerRef.current
    const wrapper = wrapperRef.current
    if (!container || !wrapper) return

    wrapper.style.fontSize = ""
    const availableWidth = container.clientWidth
    const contentWidth = wrapper.scrollWidth
    if (availableWidth > 0 && contentWidth > availableWidth) {
      const currentFontSize = parseFloat(window.getComputedStyle(wrapper).fontSize) || 28
      const ratio = (availableWidth - 2) / contentWidth
      const nextSize = Math.max(12, Math.floor(currentFontSize * ratio * 10) / 10)
      wrapper.style.fontSize = `${nextSize}px`
    }
  }

  useEffect(() => {
    motionVal.set(value)
  }, [motionVal, value])

  useEffect(() => {
    return springVal.on("change", (latest) => {
      const parts = formatCurrencyParts(latest, currency)
      if (mainTextRef.current) {
        mainTextRef.current.textContent = `${parts.isNegative ? "-" : ""}${parts.symbol}\u00A0${parts.integer}`
      }
      if (centsRef.current) {
        centsRef.current.textContent = parts.cents
      }
      adjustSize()
    })
  }, [springVal, currency])

  useLayoutEffect(() => {
    adjustSize()
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => {
      adjustSize()
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [value, currency])

  const initialParts = formatCurrencyParts(value, currency)

  return (
    <div ref={containerRef} className="w-full min-w-0 overflow-hidden">
      <span
        ref={wrapperRef}
        className={cn("inline-flex items-baseline whitespace-nowrap leading-tight", className)}
      >
        <span ref={mainTextRef}>
          {initialParts.isNegative ? "-" : ""}
          {initialParts.symbol}&nbsp;{initialParts.integer}
        </span>
        <sup
          ref={centsRef}
          className="text-[0.52em] font-extrabold ml-[2px] -top-[0.44em] relative leading-none opacity-85 select-none"
        >
          {initialParts.cents}
        </sup>
      </span>
    </div>
  )
}
