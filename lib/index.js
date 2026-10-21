import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const ROUTE = '/skin-assets/silver-wolf'
const ROOT = new URL('../', import.meta.url)

/** Public package assets only. Never derive a path from the request URL. */
const ASSETS = new Map([
  ['skin.css', 'text/css; charset=utf-8'],
  ['assets/silver-wolf-chat.png', 'image/png'],
  ['assets/silver-wolf-badge.png', 'image/png'],
  ['assets/icons/silver-wolf.png', 'image/png'],
])

const etags = new Map()

async function digestOf(file, bytes) {
  const cached = etags.get(file)
  if (cached !== undefined) return cached
  const digest = `"${createHash('sha256').update(bytes).digest('hex').slice(0, 24)}"`
  etags.set(file, digest)
  return digest
}

function send(res, status, headers = {}, body) {
  res.writeHead(status, headers)
  res.end(body)
}

/**
 * Serve the skin's stylesheet and bitmap assets from the same origin as the
 * GUI. The prefix route is registered only while this plugin row is active.
 */
function apply(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    const server = webCtx.get('webServer')
    webCtx.effect(
      () =>
        server.register({
          kind: 'prefix',
          path: ROUTE,
          handler: async (req, res) => {
            try {
              if (req.method !== 'GET' && req.method !== 'HEAD') {
                send(res, 405, { Allow: 'GET, HEAD' })
                return
              }

              const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
              if (!pathname.startsWith(`${ROUTE}/`)) {
                send(res, 404)
                return
              }

              const file = decodeURIComponent(pathname.slice(ROUTE.length + 1))
              const type = ASSETS.get(file)
              if (type === undefined) {
                send(res, 404)
                return
              }

              let bytes
              try {
                bytes = await readFile(new URL(file, ROOT))
              } catch (error) {
                if (error?.code !== 'ENOENT') console.error('[silver-wolf] asset read failed', file, error)
                send(res, 404)
                return
              }

              const etag = await digestOf(file, bytes)
              const headers = {
                'Content-Type': type,
                'Cache-Control': type.startsWith('text/css')
                  ? 'no-cache'
                  : 'public, max-age=3600',
                'X-Content-Type-Options': 'nosniff',
                ETag: etag,
              }

              const ifNoneMatch = req.headers['if-none-match']
              if (
                typeof ifNoneMatch === 'string' &&
                ifNoneMatch
                  .split(',')
                  .some((value) => value.trim().replace(/^W\//, '') === etag || value.trim() === '*')
              ) {
                send(res, 304, headers)
                return
              }

              send(
                res,
                200,
                {
                  ...headers,
                  'Content-Length': bytes.length,
                },
                req.method === 'HEAD' ? undefined : bytes,
              )
            } catch (error) {
              console.error('[silver-wolf] asset request failed', error)
              if (!res.headersSent) send(res, 500)
            }
          },
        }),
      'ui-skin-silver-wolf: packaged stylesheet and artwork',
    )
  })
}

export { apply }
