import webpush from 'web-push'

// Silenciar el warning [DEP0169] de Node 22 causado internamente por la librería web-push (url.parse)
process.noDeprecation = true

const DEFAULT_VAPID_PUBLIC =
  'BK1IvkCefscA36nPs2gy5Dw2q8UmCouJbBzSPjsuwz0n6Be-EPmg98PNlO-hoo4w02pCeF_5_FKt5Crqlx_SPnY'
const DEFAULT_VAPID_PRIVATE = 'SXHeMAjh2AMb6Uthq-Fa__gUwz2PqsjmnmdMJd71kZc'
const MAX_CHUNK_DELAY_SECONDS = 6 * 24 * 60 * 60

const cleanEnv = (val) => (val ? String(val).replace(/^["']|["']$/g, '').trim() : '')

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const payload = JSON.parse(event.body || '{}')
    const { subscription, title, body, tag, url, fireAt, destinationUrl } = payload

    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing subscription' }) }
    }

    const now = Date.now()

    // Si el turno era a más de 6 días vista, re-encolamos el tramo restante en QStash automáticamente
    if (typeof fireAt === 'number' && fireAt - now > 45 * 1000) {
      const qstashToken = cleanEnv(process.env.QSTASH_TOKEN)
      const qstashBaseUrl = (
        cleanEnv(process.env.QSTASH_URL) || 'https://qstash-eu-central-1.upstash.io'
      ).replace(/\/+$/, '')

      if (qstashToken && destinationUrl) {
        const remainingSeconds = Math.min(
          Math.max(1, Math.floor((fireAt - now) / 1000)),
          MAX_CHUNK_DELAY_SECONDS
        )

        const res = await fetch(`${qstashBaseUrl}/v2/publish/${destinationUrl}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            'Content-Type': 'application/json',
            'Upstash-Delay': `${remainingSeconds}s`,
            'Upstash-Retries': '3',
          },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          return {
            statusCode: 200,
            body: JSON.stringify({ ok: true, requeuedSeconds: remainingSeconds }),
          }
        }
      }
    }

    const vapidPublic =
      cleanEnv(process.env.VITE_VAPID_PUBLIC_KEY) ||
      cleanEnv(process.env.VAPID_PUBLIC_KEY) ||
      DEFAULT_VAPID_PUBLIC
    const vapidPrivate = cleanEnv(process.env.VAPID_PRIVATE_KEY) || DEFAULT_VAPID_PRIVATE
    const vapidSubject = cleanEnv(process.env.VAPID_SUBJECT) || 'mailto:notificaciones@gastitos.app'

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: title || '🔔 Gastitos',
        body: body || '',
        tag: tag || `gastitos-${Date.now()}`,
        url: url || '/',
      }),
      {
        TTL: 86400,
        urgency: 'high',
      }
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, delivered: true }),
    }
  } catch (err) {
    const statusCode = err && typeof err.statusCode === 'number' ? err.statusCode : 500
    // Si la suscripción expiró o fue revocada (404 / 410), devolvemos 200 para que QStash no reintente en vano
    if (statusCode === 404 || statusCode === 410) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false, expired: true }),
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : String(err),
      }),
    }
  }
}
