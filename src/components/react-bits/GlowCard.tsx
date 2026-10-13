import React, { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string
  children: React.ReactNode
}

export function GlowCard({
  glowColor = "hsl(var(--primary) / 0.22)",
  className,
  children,
  ...props
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [touchPos, setTouchPos] = useState({ x: 50, y: 30 })
  const [isPressed, setIsPressed] = useState(false)

  const updatePoint = (clientX: number, clientY: number) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const xPct = Math.round(((clientX - rect.left) / rect.width) * 100)
    const yPct = Math.round(((clientY - rect.top) / rect.height) * 100)
    setTouchPos({ x: xPct, y: yPct })
  }

  return (
    <div
      ref={cardRef}
      onPointerDown={(e) => {
        updatePoint(e.clientX, e.clientY)
        setIsPressed(true)
      }}
      onPointerUp={() => setIsPressed(false)}
      onPointerCancel={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/25 bg-card p-5 sm:p-6 shadow-md shadow-primary/5 transition-all duration-200",
        className
      )}
      {...props}
    >
      {/* Brillo ambiental permanente visible en celulares Android + destello táctil al tocar */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isPressed ? 1 : 0.75,
          background: `radial-gradient(${isPressed ? '320px' : '260px'} circle at ${touchPos.x}% ${touchPos.y}%, ${glowColor}, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
