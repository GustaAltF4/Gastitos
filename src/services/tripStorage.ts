import { Preferences } from '@capacitor/preferences'
import { ThemeColor, BorderRadius } from './storage'

export type TipoPlata = 'Plata Argentina' | 'Plata Chilena'

export const DEFAULT_TRUCK_CATEGORIES: string[] = [
  'Peaje',
  'Fitosanitario',
  'Playa',
  'Pago de aduana',
  'Combustible',
  'Gastos de repuestos',
  'Gastos del camión',
  'Estadía',
  'Comida',
  'Otro',
]

export interface GastoViaje {
  id: string
  fecha: string
  tipoGasto: string
  descripcion?: string
  monto: number
  tipoPlata: TipoPlata
  dias?: number
  totalRestante: number
  esIngreso?: boolean
}

export interface TripState {
  plataArgentina: number
  plataChilena: number
  plataArgentinaInicial: number
  plataChilenaInicial: number
  nombre: string
  destino: string
  guardado: boolean
  gastos: GastoViaje[]
  darkMode: boolean
  themeColor: ThemeColor
  borderRadius: BorderRadius
  categories: string[]
}

export interface FinishedTrip {
  id: string
  nombre: string
  destino: string
  fechaInicio: string
  fechaFin: string
  plataArgentinaInicial: number
  plataChilenaInicial: number
  plataArgentinaFinal: number
  plataChilenaFinal: number
  totalGastadoArs: number
  totalGastadoClp: number
  totalIngresosArs?: number
  totalIngresosClp?: number
  gastos: GastoViaje[]
}

const TRIP_STORAGE_KEY = 'plata_viaje_camion_state_v3'
const TRIP_HISTORY_KEY = 'plata_viaje_camion_history_v3'

const DEFAULT_TRIP_STATE: TripState = {
  plataArgentina: 0,
  plataChilena: 0,
  plataArgentinaInicial: 0,
  plataChilenaInicial: 0,
  nombre: '',
  destino: '',
  guardado: false,
  gastos: [],
  darkMode: true,
  themeColor: 'indigo',
  borderRadius: 'lg',
  categories: DEFAULT_TRUCK_CATEGORIES,
}

export const tripStorage = {
  async loadState(): Promise<TripState> {
    try {
      const { value } = await Preferences.get({ key: TRIP_STORAGE_KEY })
      if (value) {
        const parsed = JSON.parse(value)
        return {
          ...DEFAULT_TRIP_STATE,
          ...parsed,
          categories:
            Array.isArray(parsed.categories) && parsed.categories.length > 0
              ? parsed.categories
              : DEFAULT_TRUCK_CATEGORIES,
        }
      }

      // Compatibilidad con claves individuales de localStorage si existieran
      const ch = localStorage.getItem('plataChilena')
      const ar = localStorage.getItem('plataArgentina')
      if (ch !== null && ar !== null) {
        const stateFromLegacy: TripState = {
          ...DEFAULT_TRIP_STATE,
          plataArgentina: parseFloat(ar) || 0,
          plataChilena: parseFloat(ch) || 0,
          plataArgentinaInicial: parseFloat(localStorage.getItem('plataArgentinaInicial') || ar) || 0,
          plataChilenaInicial: parseFloat(localStorage.getItem('plataChilenaInicial') || ch) || 0,
          nombre: localStorage.getItem('nombre') || '',
          destino: localStorage.getItem('destino') || '',
          guardado: true,
          gastos: JSON.parse(localStorage.getItem('gastos') || '[]'),
          darkMode: (localStorage.getItem('vite-ui-theme') || 'dark') !== 'light',
        }
        await this.saveState(stateFromLegacy)
        return stateFromLegacy
      }

      return DEFAULT_TRIP_STATE
    } catch {
      return DEFAULT_TRIP_STATE
    }
  },

  async saveState(state: TripState): Promise<void> {
    const serialized = JSON.stringify(state)
    await Preferences.set({
      key: TRIP_STORAGE_KEY,
      value: serialized,
    })

    // Sincronizar también en localStorage como respaldo rápido
    try {
      if (state.guardado) {
        localStorage.setItem('plataArgentina', state.plataArgentina.toString())
        localStorage.setItem('plataChilena', state.plataChilena.toString())
        localStorage.setItem('plataArgentinaInicial', state.plataArgentinaInicial.toString())
        localStorage.setItem('plataChilenaInicial', state.plataChilenaInicial.toString())
        localStorage.setItem('nombre', state.nombre)
        localStorage.setItem('destino', state.destino)
        localStorage.setItem('gastos', JSON.stringify(state.gastos))
      } else {
        localStorage.removeItem('plataArgentina')
        localStorage.removeItem('plataChilena')
        localStorage.removeItem('plataArgentinaInicial')
        localStorage.removeItem('plataChilenaInicial')
        localStorage.removeItem('destino')
        localStorage.removeItem('gastos')
      }
      localStorage.setItem('vite-ui-theme', state.darkMode ? 'dark' : 'light')
    } catch {
      // Ignorar si localStorage no está disponible
    }
  },

  async resetTrip(current: TripState): Promise<TripState> {
    const freshState: TripState = {
      ...DEFAULT_TRIP_STATE,
      nombre: current.nombre,
      darkMode: current.darkMode,
      themeColor: current.themeColor,
      borderRadius: current.borderRadius,
      categories: current.categories,
      guardado: false,
      plataArgentina: 0,
      plataChilena: 0,
      plataArgentinaInicial: 0,
      plataChilenaInicial: 0,
      destino: '',
      gastos: [],
    }
    await this.saveState(freshState)
    return freshState
  },

  async getTripHistory(): Promise<FinishedTrip[]> {
    try {
      const { value } = await Preferences.get({ key: TRIP_HISTORY_KEY })
      if (!value) return []
      return JSON.parse(value)
    } catch {
      return []
    }
  },

  async saveTripHistory(history: FinishedTrip[]): Promise<void> {
    await Preferences.set({
      key: TRIP_HISTORY_KEY,
      value: JSON.stringify(history),
    })
  },

  async addTripToHistory(trip: FinishedTrip): Promise<void> {
    const current = await this.getTripHistory()
    const updated = [trip, ...current]
    await this.saveTripHistory(updated)
  },

  async deleteTripFromHistory(id: string): Promise<FinishedTrip[]> {
    const current = await this.getTripHistory()
    const updated = current.filter((t) => t.id !== id)
    await this.saveTripHistory(updated)
    return updated
  },
}
