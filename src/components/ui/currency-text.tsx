import { useRef, useLayoutEffect, useEffect } from "react"
import { cn, formatCurrencyParts } from "@/lib/utils"

interface CurrencyTextProps {
  amount: number
  currency?: string
  sign?: "auto" | "plus" | "minus" | "none"
  autoFit?: boolean
  className?: string
}

export function CurrencyText({
  amount,
  currency = "ARS",
  sign = "auto",
  autoFit = false,
  className = "",
}: CurrencyTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  const { symbol, integer, cents, isNegative } = formatCurrencyParts(amount, currency)

  let prefix = ""
  if (sign === "plus") prefix = "+"
  else if (sign === "minus") prefix = "-"
  else if (sign === "auto" && isNegative) prefix = "-"

  useLayoutEffect(() => {
    if (!autoFit) return
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    let lastWidth = -1
    const adjustSize = () => {
      textEl.style.fontSize = ""
      const availableWidth = container.clientWidth
      lastWidth = availableWidth
      const contentWidth = textEl.scrollWidth
      if (availableWidth > 0 && contentWidth > availableWidth) {
        const currentFontSize = parseFloat(window.getComputedStyle(textEl).fontSize) || 16
        const ratio = (availableWidth - 2) / contentWidth
        const nextSize = Math.max(8, Math.floor(currentFontSize * ratio * 10) / 10)
        textEl.style.fontSize = `${nextSize}px`
      }
    }

    adjustSize()

    let frameId: number | null = null
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry && Math.abs(entry.contentRect.width - lastWidth) < 1) {
        return
      }
      if (frameId) cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        adjustSize()
      })
    })
    observer.observe(container)
    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [amount, currency, sign, autoFit])

  // Re-ajustar también luego de que carguen las fuentes
  useEffect(() => {
    if (!autoFit || !("fonts" in document)) return
    document.fonts.ready.then(() => {
      const container = containerRef.current
      const textEl = textRef.current
      if (!container || !textEl) return
      textEl.style.fontSize = ""
      const availableWidth = container.clientWidth
      const contentWidth = textEl.scrollWidth
      if (availableWidth > 0 && contentWidth > availableWidth) {
        const currentFontSize = parseFloat(window.getComputedStyle(textEl).fontSize) || 16
        const ratio = (availableWidth - 2) / contentWidth
        const nextSize = Math.max(8, Math.floor(currentFontSize * ratio * 10) / 10)
        textEl.style.fontSize = `${nextSize}px`
      }
    })
  }, [amount, currency, autoFit])

  const content = (
    <span
      ref={textRef}
      className={cn("inline-flex items-baseline whitespace-nowrap leading-tight", className)}
    >
      <span>
        {prefix}
        {symbol}&nbsp;{integer}
      </span>
      <sup className="text-[0.56em] font-extrabold ml-[1.5px] -top-[0.42em] relative leading-none opacity-85 select-none">
        {cents}
      </sup>
    </span>
  )

  if (!autoFit) {
    return content
  }

  const isRightAligned = className.includes("text-right") || className.includes("justify-end")

  return (
    <div
      ref={containerRef}
      className={cn("w-full min-w-0 overflow-hidden", isRightAligned && "text-right flex justify-end")}
    >
      {content}
    </div>
  )
}
