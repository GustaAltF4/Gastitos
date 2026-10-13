import { LocalNotifications } from '@capacitor/local-notifications'
import { Reminder, TattooAppointment, TattooReminderOption } from '../types/finance'
import { formatCurrency } from '../lib/utils'

const DEFAULT_VAPID_PUBLIC_KEY =
  'BK1IvkCefscA36nPs2gy5Dw2q8UmCouJbBzSPjsuwz0n6Be-EPmg98PNlO-hoo4w02pCeF_5_FKt5Crqlx_SPnY'
const QSTASH_MAP_STORAGE_KEY = 'gastitos_qstash_msg_map_v1'

export interface NotificationErrorInfo {
  code: string
  context: string
  errorName: string
  message: string
  permission: string
  isStandalone: boolean
  timestamp: string
}

type ErrorListener = (err: NotificationErrorInfo | null) => void
const errorListeners = new Set<ErrorListener>()
let currentNotificationError: NotificationErrorInfo | null = null

export function onNotificationError(listener: ErrorListener): () => void {
  errorListeners.add(listener)
  if (currentNotificationError) {
    listener(currentNotificationError)
  }
  return () => {
    errorListeners.delete(listener)
  }
}

export function clearNotificationError(): void {
  currentNotificationError = null
  errorListeners.forEach((l) => l(null))
}

export function reportNotificationError(code: string, context: string, err: unknown): void {
  const errorObj = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err))
  const permission =
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true)

  const info: NotificationErrorInfo = {
    code,
    context,
    errorName: errorObj.name || 'Error',
    message: errorObj.message || String(err),
    permission,
    isStandalone: Boolean(isStandalone),
    timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }

  currentNotificationError = info
  errorListeners.forEach((l) => l(info))
}

// Capturar errores asíncronos globales de Notification en timers internos
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || ''
    const stack = event.error?.stack || ''
    if (
      msg.includes('Notification') ||
      stack.includes('LocalNotifications') ||
      stack.includes('buildNotification')
    ) {
      reportNotificationError('ERR-GLOBAL-NOTIF', 'Timer asíncrono de notificación', event.error || msg)
    }
  })
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function getQstashMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(QSTASH_MAP_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveQstashMessageId(notificationId: number, messageId: string): void {
  try {
    const map = getQstashMap()
    map[String(notificationId)] = messageId
    localStorage.setItem(QSTASH_MAP_STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

function popQstashMessageId(notificationId: number): string | undefined {
  try {
    const map = getQstashMap()
    const msgId = map[String(notificationId)]
    if (msgId) {
      delete map[String(notificationId)]
      localStorage.setItem(QSTASH_MAP_STORAGE_KEY, JSON.stringify(map))
    }
    return msgId
  } catch {
    return undefined
  }
}

let cachedPushSubscription: PushSubscription | null = null

// Obtener o crear la suscripción Web Push del Service Worker (iOS 16.4+ PWA / Android)
async function getOrCreatePushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null
  }

  if (cachedPushSubscription && cachedPushSubscription.endpoint) {
    return cachedPushSubscription
  }

  try {
    const registration = await navigator.serviceWorker.ready
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const vapidPublicKey =
        (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_VAPID_PUBLIC_KEY ||
        DEFAULT_VAPID_PUBLIC_KEY
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      })
    }

    cachedPushSubscription = subscription
    return subscription
  } catch (err) {
    reportNotificationError('ERR-PUSH-SUB', 'Suscribir PushManager (iOS/PWA)', err)
    return null
  }
}

// Enviar programación de Push en segundo plano a la función de Netlify + QStash
// Incluye reintento automático para cuando iOS WebKit despierta de pantalla bloqueada con un socket HTTP/2 caído ("TypeError: Load failed")
async function scheduleRemoteWebPush(params: {
  notificationId: number
  title: string
  body: string
  fireAt?: number
  delaySeconds?: number
  tag?: string
}): Promise<boolean> {
  const subscription = await getOrCreatePushSubscription()
  if (!subscription) return false

  const payloadStr = JSON.stringify({
    subscription: subscription.toJSON(),
    title: params.title,
    body: params.body,
    fireAt: params.fireAt,
    delaySeconds: params.delaySeconds,
    tag: params.tag || String(params.notificationId),
    url: '/',
  })

  let lastErr: unknown = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`/.netlify/functions/schedule-push?_t=${Date.now()}_${attempt}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
        },
        cache: 'no-store',
        keepalive: true,
        body: payloadStr,
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        reportNotificationError(
          data.code || 'ERR-NETLIFY-PUSH',
          'Programar Web Push en Netlify/QStash',
          new Error(data.error || `HTTP ${response.status}`)
        )
        return false
      }

      if (data.messageId && params.notificationId) {
        saveQstashMessageId(params.notificationId, data.messageId)
      }

      return true
    } catch (err) {
      lastErr = err
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 350 * attempt))
      }
    }
  }

  // Si está corriendo en localhost sin `netlify dev`, no bloquear las notificaciones locales
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    reportNotificationError('ERR-PUSH-NETWORK', 'Conectar con /.netlify/functions/schedule-push', lastErr)
  }
  return false
}

// Mostrar notificación a través del Service Worker (estándar requerido por iOS PWA)
async function showViaServiceWorkerOrWindow(title: string, body: string, tag: string): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/apple-touch-icon.png',
          tag,
        })
        return
      }
    } catch {}
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag,
    })
  }
}

// Helper para parsear fecha y hora local de forma 100% segura en iOS WebKit / Safari
export function parseLocalDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  return new Date(year, month - 1, day, hours || 0, minutes || 0, 0)
}

// Calcular fecha y hora de la alerta según la opción elegida por la tatuadora
export function calculateTattooAlertDate(
  appointmentDate: string, // YYYY-MM-DD
  appointmentTime: string, // HH:mm
  option: TattooReminderOption
): Date | null {
  if (option === 'none') return null

  const appDate = parseLocalDateTime(appointmentDate, appointmentTime)
  if (isNaN(appDate.getTime())) return null

  if (option === 'exact_time') {
    return appDate
  }

  if (option === '10_min_before') {
    return new Date(appDate.getTime() - 10 * 60 * 1000)
  }

  if (option === '2_hours_before') {
    return new Date(appDate.getTime() - 2 * 60 * 60 * 1000)
  }

  if (option === 'same_day_morning') {
    const [y, m, d] = appointmentDate.split('-').map(Number)
    return new Date(y, m - 1, d, 9, 0, 0)
  }

  if (option === '1_day_before') {
    const [y, m, d] = appointmentDate.split('-').map(Number)
    const target = new Date(y, m - 1, d, 18, 0, 0)
    target.setDate(target.getDate() - 1)
    return target
  }

  if (option === '2_days_before') {
    const [y, m, d] = appointmentDate.split('-').map(Number)
    const target = new Date(y, m - 1, d, 12, 0, 0)
    target.setDate(target.getDate() - 2)
    return target
  }

  return null
}

// Sintetizador de sonido chime / campana agradable con Web Audio API (funciona offline, web y móvil)
export function playChimeSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    const now = ctx.currentTime

    // Nota 1: F5 (698.46 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(698.46, now)
    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.04)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.6)

    // Nota 2: C6 armónico (1046.50 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1046.5, now + 0.1)
    gain2.gain.setValueAtTime(0, now + 0.1)
    gain2.gain.linearRampToValueAtTime(0.45, now + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.1)
    osc2.stop(now + 1.2)
  } catch (err) {
    console.warn('Error al reproducir audio de notificación', err)
  }
}

export const notificationService = {
  // Inicializar canal de notificación de alta prioridad en Android
  async initChannels(): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id: 'gastos_reminders_channel',
        name: 'Recordatorios de Gastos y Pagos',
        description: 'Alertas sonoras para vencimientos y avisos de cobro/pago',
        importance: 5, // IMPORTANCE_HIGH
        visibility: 1, // VISIBILITY_PUBLIC
        sound: 'beep.wav',
        vibration: true,
        lights: true,
        lightColor: '#dd0081',
      })
    } catch {
      // Ignorar si no está en entorno nativo
    }
  },

  // Solicitar permisos de notificación y registrar suscripción Web Push para iOS/PWA
  async requestPermission(): Promise<boolean> {
    try {
      if ('Notification' in window) {
        const perm =
          Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()

        if (perm !== 'granted') {
          reportNotificationError(
            'ERR-PERM-01',
            'Solicitar permiso de Notificaciones',
            new Error(`El permiso no fue concedido. Estado actual: "${perm}"`)
          )
          return false
        }

        // Asegurar suscripción Web Push del Service Worker para que funcione con pantalla bloqueada
        await getOrCreatePushSubscription()
        return true
      }

      const status = await LocalNotifications.requestPermissions()
      if (status.display !== 'granted') {
        reportNotificationError(
          'ERR-PERM-02',
          'Solicitar permiso (LocalNotifications)',
          new Error(`El permiso no fue concedido. Estado actual: "${status.display}"`)
        )
      }
      return status.display === 'granted'
    } catch (err) {
      reportNotificationError('ERR-PERM-03', 'Fallo al pedir permisos de notificación', err)
      return false
    }
  },

  // Programar un recordatorio normal (Web Push en segundo plano + respaldo local)
  async scheduleReminderNotification(reminder: Reminder, currency: string = 'ARS'): Promise<number> {
    const targetDate = new Date(reminder.dueDateTime)
    const now = new Date()
    const id = reminder.notificationId || Math.floor(Math.random() * 100000)

    const amountText = reminder.amount ? ` - Monto: ${formatCurrency(reminder.amount, currency)}` : ''
    const title = `🔔 ${reminder.title}`
    const body = `${reminder.notes || 'Recordatorio de pago pendiente'}${amountText}`

    // Si la fecha ya pasó, no programar en el pasado
    if (targetDate.getTime() <= now.getTime()) {
      return id
    }

    await this.initChannels()
    const hasPerm = await this.requestPermission()
    if (!hasPerm) return id

    // 1. Programar Web Push diferido (QStash + Netlify Function) para despertar el iPhone bloqueado/cerrado
    const pushScheduled = await scheduleRemoteWebPush({
      notificationId: id,
      title,
      body,
      fireAt: targetDate.getTime(),
      tag: `rem-${reminder.id}`,
    })

    // 2. Si no se usó Web Push remoto (ej. entorno local), programar timer local de respaldo
    if (!pushScheduled) {
      const delayMs = targetDate.getTime() - now.getTime()
      if (delayMs > 0 && delayMs < 7 * 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          playChimeSound()
          showViaServiceWorkerOrWindow(title, body, `rem-${reminder.id}`).catch((fallbackErr) => {
            reportNotificationError('ERR-REM-FALLBACK', 'Mostrar Recordatorio Local', fallbackErr)
          })
        }, delayMs)
      }
    } else {
      // Aun con Web Push activo, dejar chime sonoro por si tiene la app abierta en ese instante
      const delayMs = targetDate.getTime() - now.getTime()
      if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          playChimeSound()
        }, delayMs)
      }
    }

    return id
  },

  // Cancelar una notificación programada (tanto en QStash como local)
  async cancelNotification(notificationId: number): Promise<void> {
    if (!notificationId) return

    const qstashMsgId = popQstashMessageId(notificationId)
    if (qstashMsgId) {
      try {
        await fetch('/.netlify/functions/schedule-push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: qstashMsgId }),
        })
      } catch {}
    }

    try {
      await LocalNotifications.cancel({
        notifications: [{ id: notificationId }],
      })
    } catch {}
  },

  // Disparar una notificación de prueba inmediata + prueba de pantalla bloqueada a los 5 segundos
  async triggerTestNotification(): Promise<void> {
    // 1. Sonido acústico y vibración inmediata
    playChimeSound()
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150])
      } catch {}
    }

    await this.initChannels()
    const hasPermission = await this.requestPermission()
    if (!hasPermission) return

    // 2. Mostrar notificación inmediata por Service Worker
    try {
      await showViaServiceWorkerOrWindow(
        '🔔 ¡Prueba de Alerta Activa!',
        'Bloquea la pantalla ahora: en 5 segundos te llegará otra alerta de prueba con el celu bloqueado.',
        'gastitos-test-immediate'
      )
    } catch (err) {
      reportNotificationError('ERR-TEST-SW', 'Mostrar Notificación de Prueba', err)
    }

    // 3. Programar un Web Push real a 5 segundos para que pueda bloquear el iPhone y comprobar que llega bloqueado
    await scheduleRemoteWebPush({
      notificationId: 9999,
      title: '🔒 ¡Llegó con Pantalla Bloqueada! 🐾',
      body: 'Tus avisos de Tattoo y Recordatorios ya suenan aunque la app esté cerrada o el iPhone bloqueado.',
      delaySeconds: 5,
      tag: 'gastitos-test-locked',
    })
  },

  // Programar notificaciones para turno de Tattoo (Web Push en segundo plano + respaldo local)
  async scheduleTattooNotifications(appointment: TattooAppointment): Promise<number[]> {
    const options = appointment.reminderOptions || (appointment.reminderOption ? [appointment.reminderOption] : [])
    const activeOptions = options.filter((o) => o !== 'none')

    if (activeOptions.length === 0) return []

    const scheduledIds: number[] = []
    const now = new Date()

    await this.initChannels()
    const hasPerm = await this.requestPermission()
    if (!hasPerm) return []

    for (const opt of activeOptions) {
      const alertDate = calculateTattooAlertDate(appointment.date, appointment.time, opt)
      // Permitir si está en el futuro o dentro del minuto actual (para pruebas al minuto siguiente)
      if (!alertDate || alertDate.getTime() <= now.getTime() - 60000) continue

      const effectiveTargetTime = Math.max(alertDate.getTime(), now.getTime() + 5000)
      const id = Math.floor(Math.random() * 900000) + 100000
      let label = ''
      if (opt === '2_days_before') label = 'En 2 días tienes turno'
      else if (opt === '1_day_before') label = 'Mañana tienes turno'
      else if (opt === 'same_day_morning') label = 'Hoy tienes turno'
      else if (opt === '2_hours_before') label = 'En 2 horas comienza el turno'
      else if (opt === '10_min_before') label = 'En 10 minutos comienza el turno'
      else label = 'Turno ahora'

      const title = `🖋️ Agenda Tattoo: ${appointment.clientName}`
      const body = `${label} con ${appointment.clientName} a las ${appointment.time} hs`
      const tag = `tattoo-${appointment.id}-${opt}`

      const pushScheduled = await scheduleRemoteWebPush({
        notificationId: id,
        title,
        body,
        fireAt: effectiveTargetTime,
        tag,
      })

      const delayMs = Math.max(1000, effectiveTargetTime - now.getTime())
      if (!pushScheduled) {
        if (delayMs > 0 && delayMs < 7 * 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            playChimeSound()
            showViaServiceWorkerOrWindow(title, body, tag).catch((fallbackErr) => {
              reportNotificationError('ERR-TATTOO-FALLBACK', 'Mostrar Alerta Tattoo Local', fallbackErr)
            })
          }, delayMs)
        }
      } else {
        if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            playChimeSound()
          }, delayMs)
        }
      }

      scheduledIds.push(id)
    }

    return scheduledIds
  },

  // Alias para retrocompatibilidad
  async scheduleTattooNotification(appointment: TattooAppointment): Promise<number | undefined> {
    const ids = await this.scheduleTattooNotifications(appointment)
    return ids[0]
  },
}
