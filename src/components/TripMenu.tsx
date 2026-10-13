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
      <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* IZQUIERDA: Logo de Camión + Título */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-11 w-11 shrink-0 rounded-[var(--radius)] bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25 transition-transform duration-150 active:scale-90 select-none touch-manipulation">
            <Truck className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground leading-none truncate">
              Plata para el viaje
            </h1>
            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[220px] sm:max-w-md font-medium">
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
            className="p-2.5 rounded-[var(--radius)] bg-muted/70 border border-border/80 text-foreground shadow-2xs transition-all active:scale-90 active:bg-primary/20 active:border-primary touch-manipulation select-none"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-primary" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
