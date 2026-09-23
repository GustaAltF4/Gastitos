import { Moon, Sun, Cat } from 'lucide-react'

interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  userName: string
}

export function Header({
  darkMode,
  onToggleDarkMode,
  userName,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo / Nombre Gastitos */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25 transition-transform duration-200 hover:scale-105 select-none">
            <Cat className="h-6 w-6" strokeWidth={2.2} />
            <span
              className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] text-zinc-950 font-black shadow-sm ring-2 ring-background leading-none select-none"
              title="gastitos"
            >
              $
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground leading-none flex items-center gap-1.5">
                <span>Gastitos</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">
                  🐾
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[200px] sm:max-w-xs">
              {userName && userName !== 'Mi Negocio / Finanzas' ? userName : 'Control de Gastos & Finanzas'}
            </p>
          </div>
        </div>

        {/* Botón Modo Oscuro/Claro con estética felina */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Modo diurno (Gatito de día)' : 'Modo nocturno (Gatito de noche)'}
            className="relative p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-transform active:scale-90 group"
            aria-label="Cambiar tema claro u oscuro"
          >
            <Cat className="h-5 w-5 transition-transform duration-200 group-hover:rotate-6 text-foreground" strokeWidth={2} />
            {darkMode ? (
              <Sun className="h-3.5 w-3.5 absolute top-1 right-1 text-amber-400 fill-amber-400 drop-shadow-xs" />
            ) : (
              <Moon className="h-3.5 w-3.5 absolute top-1 right-1 text-indigo-400 fill-indigo-400 drop-shadow-xs" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
