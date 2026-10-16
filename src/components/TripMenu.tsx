import { Moon, Sun, Truck } from 'lucide-react'

interface TripMenuProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  nombre?: string
  destino?: string
}

export function TripMenu({
  darkMode,
  onToggleDarkMode,
  nombre,
  destino,
}: TripMenuProps) {
  const subtitle =
    nombre || destino
      ? [nombre ? `Chofer: ${nombre}` : '', destino ? `Destino: ${destino}` : '']
          .filter(Boolean)
          .join(' • ')
      : 'Control de Gastos de Viaje 🇦🇷 🇨🇱'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md pt-safe">
      <div className="container max-w-5xl mx-auto px-4 h-20 flex items-center justify-between gap-3">
        {/* IZQUIERDA: Logo de Camión + Título */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-[var(--radius)] bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25 select-none touch-manipulation">
            <Truck className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-foreground leading-tight">
              Plata para el viaje
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-bold leading-normal break-words">
              {subtitle}
            </p>
          </div>
        </div>

        {/* DERECHA: Solo botón Modo Oscuro / Claro */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-3 sm:p-3.5 rounded-[var(--radius)] bg-muted/80 border border-border text-foreground shadow-xs touch-manipulation select-none active:bg-primary/20"
          >
            {darkMode ? (
              <Sun className="h-6 w-6 sm:h-7 sm:w-7 text-amber-400" />
            ) : (
              <Moon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
