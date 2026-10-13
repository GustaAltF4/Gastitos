import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {  Moon, Sun} from "lucide-react"
import { useEffect, useState } from "react"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false) 

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null 

  const isDark = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Moon className={`h-[1.2rem] w-[1.2rem] transition-all ${isDark ? "scale-0 rotate-90 "  : "scale-100 rotate-0"}`} />
      <Sun className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${isDark ? "scale-100 rotate-0" : "scale-0 -rotate-90"}`} />
    </Button>
  )
}
