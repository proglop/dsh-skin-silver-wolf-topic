import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ASSET_ROUTE = '/skin-assets/silver-wolf'
const MANAGER_ROUTE = '/api/skin-manager'
const MANAGER_PACKAGE = 'dsh-skin-silver-wolf-topic'
const ASSET_ROOT = new URL('../', import.meta.url)
const PACKAGE_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const PROFILE_DIR =
  typeof process.env.DSH_PROFILE_DIR === 'string' && process.env.DSH_PROFILE_DIR.trim() !== ''
    ? path.resolve(process.env.DSH_PROFILE_DIR.trim())
    : null

/**
 * Find the profile's own node_modules. `profileContext.dir` is the runtime
 * source of truth; env/path fallbacks keep the package testable when the host
 * context is unavailable.
 */
function nodeModulesFor(profileContext) {
  if (
    profileContext !== null &&
    typeof profileContext === 'object' &&
    typeof profileContext.dir === 'string' &&
    profileContext.dir.length > 0
  ) {
    return path.join(path.resolve(profileContext.dir), 'node_modules')
  }
  return PROFILE_DIR === null ? path.dirname(PACKAGE_ROOT) : path.join(PROFILE_DIR, 'node_modules')
}

/** Public package assets only. Never derive a path from the request URL. */
const ASSETS = new Map([
  ['skin.css', 'text/css; charset=utf-8'],
  ['assets/silver-wolf-chat.png', 'image/png'],
  ['assets/silver-wolf-badge.png', 'image/png'],
  ['assets/icons/silver-wolf.png', 'image/png'],
])

const IMAGE_TYPES = new Map([
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['webp', 'image/webp'],
  ['gif', 'image/gif'],
  ['svg', 'image/svg+xml'],
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

function sendJson(res, status, value) {
  const body = JSON.stringify(value)
  send(
    res,
    status,
    {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(body),
      'X-Content-Type-Options': 'nosniff',
    },
    body,
  )
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message })
}

/** Normalize a PluginManager ChangeResult (direct or Remote-wrapped). */
function resultValue(result) {
  if (result !== null && typeof result === 'object' && result.value !== null && typeof result.value === 'object') {
    return result.value
  }
  return result
}

function resultError(result) {
  const value = resultValue(result)
  return value !== null && typeof value === 'object' && value.error !== null && typeof value.error === 'object'
    ? value.error
    : null
}

function resultApplication(result) {
  const value = resultValue(result)
  return value !== null && typeof value === 'object' && typeof value.application === 'string'
    ? value.application
    : null
}

function resultRestartReason(result) {
  const value = resultValue(result)
  return value !== null && typeof value === 'object' && typeof value.restartReason === 'string'
    ? value.restartReason
    : null
}

function managerFailure(error) {
  if (error === null || typeof error !== 'object') return new Error('皮肤管理操作失败')
  if (error.code === 'stop-profile') {
    return new Error('请先完全退出 DSH 并重新打开，然后再卸载这个皮肤')
  }
  if (typeof error.message === 'string' && error.message.length > 0) return new Error(error.message)
  if (typeof error.code === 'string' && error.code.length > 0) return new Error(`皮肤管理操作失败：${error.code}`)
  return new Error('皮肤管理操作失败')
}

function assertManagerResult(result) {
  const error = resultError(result)
  if (error !== null) throw managerFailure(error)
  const application = resultApplication(result)
  if (application === 'failed' || application === 'cancelled') {
    throw new Error(application === 'cancelled' ? '操作已取消' : '皮肤管理操作失败')
  }
}

function sameOrigin(req) {
  const origin = req.headers.origin
  if (origin === undefined) return true
  try {
    return new URL(origin).host === req.headers.host
  } catch {
    return false
  }
}

async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 64 * 1024) throw new Error('请求体过大')
    chunks.push(chunk)
  }
  if (size === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new Error('请求体不是合法 JSON')
  }
}

async function readJsonFile(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return null
  }
}

function safeRelative(root, relative) {
  if (typeof relative !== 'string' || relative.length === 0) return null
  const normalized = path.normalize(relative)
  if (path.isAbsolute(normalized)) return null
  if (normalized === '..' || normalized.startsWith(`..${path.sep}`)) return null
  const absolute = path.resolve(root, normalized)
  if (!absolute.startsWith(`${root}${path.sep}`)) return null
  return absolute
}

function firstPreview(skin) {
  if (!skin || typeof skin.preview !== 'object' || skin.preview === null) return null
  for (const value of Object.values(skin.preview)) {
    if (typeof value === 'string' && value.length > 0) return value
  }
  return null
}

function packageDirectories(nodeModules) {
  return readdir(nodeModules, { withFileTypes: true }).then(async (entries) => {
    const directories = []
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      if (entry.name.startsWith('@')) {
        let scoped = []
        try {
          scoped = await readdir(path.join(nodeModules, entry.name), { withFileTypes: true })
        } catch {
          continue
        }
        for (const child of scoped) {
          if (child.isDirectory() || child.isSymbolicLink()) {
            directories.push(path.join(nodeModules, entry.name, child.name))
          }
        }
        continue
      }
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        directories.push(path.join(nodeModules, entry.name))
      }
    }
    return directories
  })
}

async function scanSkins(pluginManager, nodeModules) {
  let bundles = []
  try {
    bundles = await pluginManager.listBundles()
  } catch (error) {
    console.error('[silver-wolf] bundle list failed', error)
  }
  const bundleByName = new Map(bundles.map((bundle) => [bundle.name, bundle]))
  const directories = await packageDirectories(nodeModules)
  const skins = []

  for (const directory of directories) {
    const pkg = await readJsonFile(path.join(directory, 'package.json'))
    if (pkg === null || typeof pkg.name !== 'string' || pkg.name.length === 0) continue
    const skin = await readJsonFile(path.join(directory, 'skin.json'))
    if (skin === null) continue

    const previewRelative = firstPreview(skin)
    const previewPath = previewRelative === null ? null : safeRelative(directory, previewRelative)
    const tagline = typeof skin.tagline === 'string' && skin.tagline.length > 0 ? skin.tagline : null
    const description =
      typeof skin.description === 'string' && skin.description.length > 0
        ? skin.description
        : typeof pkg.description === 'string'
          ? pkg.description
          : ''

    const bundle = bundleByName.get(pkg.name)
    const skinName =
      (typeof skin.name === 'string' && skin.name.length > 0 ? skin.name : null) ?? pkg.name
    skins.push({
      id: typeof skin.id === 'string' && skin.id.length > 0 ? skin.id : pkg.name,
      name: skinName,
      nameEn: typeof skin.nameEn === 'string' ? skin.nameEn : '',
      description: tagline ?? description,
      version: typeof pkg.version === 'string' ? pkg.version : '',
      package: pkg.name,
      preview:
        previewPath === null
          ? null
          : `${MANAGER_ROUTE}/preview?package=${encodeURIComponent(pkg.name)}`,
      previewPath,
      manage: bundle !== undefined,
      enabled: bundle?.enabled === true,
      removable: bundle?.removable !== false,
      manager: pkg.name === MANAGER_PACKAGE,
      order: Number.isFinite(skin.order) ? skin.order : 999,
    })
  }

  skins.sort((left, right) => {
    if (left.manager !== right.manager) return left.manager ? -1 : 1
    if (left.order !== right.order) return left.order - right.order
    return left.name.localeCompare(right.name, 'zh-CN')
  })
  return skins
}

async function listSkins(pluginManager, nodeModules) {
  const skins = await scanSkins(pluginManager, nodeModules)
  return {
    managerPackage: MANAGER_PACKAGE,
    skins: skins.map(({ previewPath, ...skin }) => skin),
  }
}

async function activateSkin(pluginManager, nodeModules, activeId) {
  if (typeof activeId !== 'string' || activeId.length === 0) {
    throw new Error('缺少要切换的皮肤')
  }
  const skins = await scanSkins(pluginManager, nodeModules)
  const target = activeId === 'official' ? null : skins.find((skin) => skin.id === activeId)
  if (activeId !== 'official' && target === undefined) throw new Error('找不到这个皮肤')
  if (target !== null && !target.manage) throw new Error('这个皮肤不是可切换的 DSH 组合包')

  const desired = new Map()
  for (const skin of skins) {
    if (!skin.manage) continue
    desired.set(skin.package, skin.manager || (target !== null && skin.package === target.package))
  }
  // The skin package itself hosts this settings page. Never switch it off.
  desired.set(MANAGER_PACKAGE, true)

  const changed = []
  let restartRequired = false
  let restartReason = null
  for (const [packageName, enabled] of desired) {
    const skin = skins.find((item) => item.package === packageName)
    if (skin === undefined || skin.enabled === enabled) continue
    const result = await pluginManager.setBundleEnabled(packageName, enabled)
    assertManagerResult(result)
    if (resultApplication(result) === 'restart-required' || resultApplication(result) === 'overridden') {
      restartRequired = true
    }
    restartReason = resultRestartReason(result) ?? restartReason
    changed.push({ package: packageName, enabled })
  }
  return { active: activeId, changed, restartRequired, restartReason }
}

async function importSkin(pluginManager, directory) {
  if (typeof directory !== 'string' || directory.length === 0) throw new Error('没有选择目录')
  if (!path.isAbsolute(directory)) throw new Error('皮肤目录必须是绝对路径')
  const pkg = await readJsonFile(path.join(directory, 'package.json'))
  if (pkg === null || typeof pkg.name !== 'string' || pkg.name.length === 0) {
    throw new Error('这个目录不是 DSH 皮肤包（缺少 package.json）')
  }
  const skin = await readJsonFile(path.join(directory, 'skin.json'))
  if (skin === null) throw new Error('这个目录不是 DSH 皮肤包（缺少 skin.json）')
  if (pkg.dsh?.bundle?.patch === undefined) {
    throw new Error('这个包没有声明 dsh.bundle，不能作为皮肤组合包导入')
  }
  if (pkg.name === MANAGER_PACKAGE) {
    throw new Error('不能通过皮肤管理器导入管理器所在的包')
  }

  // Import is intentionally not activation: install with enabled:false so the
  // new skin cannot paint over the current appearance before “使用” is pressed.
  const result = await pluginManager.installBundle(directory, { enabled: false })
  assertManagerResult(result)
  return {
    package: pkg.name,
    restartRequired:
      resultApplication(result) === 'restart-required' || resultApplication(result) === 'overridden',
    restartReason: resultRestartReason(result),
  }
}

async function uninstallSkin(pluginManager, nodeModules, id) {
  if (typeof id !== 'string' || id.length === 0) throw new Error('缺少要卸载的皮肤')
  const skins = await scanSkins(pluginManager, nodeModules)
  const skin = skins.find((item) => item.id === id)
  if (skin === undefined) throw new Error('找不到这个皮肤')
  if (skin.manager || skin.package === MANAGER_PACKAGE) {
    throw new Error('管理器所在皮肤不能在这里卸载')
  }
  if (!skin.manage) throw new Error('这个皮肤不是可管理的 DSH 组合包')
  if (skin.removable === false) throw new Error('这个皮肤包不允许卸载')
  // removeBundle rejects a bundle whose rows are live; disabling first makes
  // deletion safe even if the bundle was enabled but not selected.
  if (skin.enabled) {
    const disabled = await pluginManager.setBundleEnabled(skin.package, false)
    assertManagerResult(disabled)
  }
  const result = await pluginManager.removeBundle(skin.package)
  assertManagerResult(result)
  return {
    package: skin.package,
    restartRequired:
      resultApplication(result) === 'restart-required' || resultApplication(result) === 'overridden',
    restartReason: resultRestartReason(result),
  }
}

function installAssetRoute(ctx) {
  ctx.inject(['webServer'], (webCtx) => {
    const server = webCtx.get('webServer')
    webCtx.effect(
      () =>
        server.register({
          kind: 'prefix',
          path: ASSET_ROUTE,
          handler: async (req, res) => {
            try {
              if (req.method !== 'GET' && req.method !== 'HEAD') {
                send(res, 405, { Allow: 'GET, HEAD' })
                return
              }

              const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
              if (!pathname.startsWith(`${ASSET_ROUTE}/`)) {
                send(res, 404)
                return
              }

              const file = decodeURIComponent(pathname.slice(ASSET_ROUTE.length + 1))
              const type = ASSETS.get(file)
              if (type === undefined) {
                send(res, 404)
                return
              }

              let bytes
              try {
                bytes = await readFile(new URL(file, ASSET_ROOT))
              } catch (error) {
                if (error?.code !== 'ENOENT') {
                  console.error('[silver-wolf] asset read failed', file, error)
                }
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

function installManagerRoute(ctx) {
  ctx.inject(['webServer', 'pluginManager'], (managerCtx) => {
    const server = managerCtx.get('webServer')
    const pluginManager = managerCtx.get('pluginManager')
    const nodeModules = nodeModulesFor(managerCtx.get('profileContext'))

    managerCtx.effect(
      () =>
        server.register({
          kind: 'prefix',
          path: MANAGER_ROUTE,
          handler: async (req, res) => {
            try {
              const url = new URL(req.url ?? '/', 'http://localhost')
              const pathname = url.pathname

              if (!sameOrigin(req)) {
                sendError(res, 403, '只允许本机同源请求')
                return
              }

              if (req.method === 'GET' && pathname === `${MANAGER_ROUTE}/list`) {
                sendJson(res, 200, await listSkins(pluginManager, nodeModules))
                return
              }

              if (req.method === 'GET' && pathname === `${MANAGER_ROUTE}/preview`) {
                const packageName = url.searchParams.get('package')
                if (packageName === null) {
                  sendError(res, 400, '缺少 package')
                  return
                }
                const skins = await scanSkins(pluginManager, nodeModules)
                const skin = skins.find((item) => item.package === packageName)
                if (skin === undefined || !skin.previewPath) {
                  sendError(res, 404, '找不到这个皮肤预览')
                  return
                }
                let bytes
                try {
                  bytes = await readFile(skin.previewPath)
                } catch {
                  sendError(res, 404, '预览图读取失败')
                  return
                }
                const extension = path.extname(skin.previewPath).slice(1).toLowerCase()
                const contentType = IMAGE_TYPES.get(extension)
                if (contentType === undefined) {
                  sendError(res, 415, '预览图格式不支持')
                  return
                }
                send(
                  res,
                  200,
                  {
                    'Content-Type': contentType,
                    'Content-Length': bytes.length,
                    'Cache-Control': 'no-store',
                    'X-Content-Type-Options': 'nosniff',
                  },
                  bytes,
                )
                return
              }

              if (req.method !== 'POST') {
                sendError(res, 405, '不支持的请求方法')
                return
              }

              const body = await readJsonBody(req)
              if (pathname === `${MANAGER_ROUTE}/activate`) {
                sendJson(res, 200, await activateSkin(pluginManager, nodeModules, body.active))
                return
              }
              if (pathname === `${MANAGER_ROUTE}/import`) {
                sendJson(res, 200, await importSkin(pluginManager, body.path))
                return
              }
              if (pathname === `${MANAGER_ROUTE}/uninstall`) {
                sendJson(res, 200, await uninstallSkin(pluginManager, nodeModules, body.id))
                return
              }
              sendError(res, 404, '未知的皮肤管理接口')
            } catch (error) {
              console.error('[silver-wolf] manager request failed', error)
              if (!res.headersSent) {
                sendError(res, 500, managerFailure(error).message)
              }
            }
          },
        }),
      'ui-skin-silver-wolf: bundled multi-skin manager API',
    )
  })
}

/**
 * Serve the skin assets and the manager API from the same origin as the GUI.
 * Both routes exist only while this plugin row is active.
 */
function apply(ctx) {
  installAssetRoute(ctx)
  installManagerRoute(ctx)
}

export { apply }
