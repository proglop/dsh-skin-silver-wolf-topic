import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const release = join(root, 'release')

rmSync(release, { recursive: true, force: true })
mkdirSync(release, { recursive: true })

const execPath = process.env.npm_execpath
const useNodeExec = Boolean(execPath && /\.(?:c?js|mjs)$/.test(execPath))
const command = useNodeExec ? process.execPath : 'pnpm'
const prefix = useNodeExec ? [execPath] : []

for (const pkg of ['manager', 'skin']) {
  const result = spawnSync(
    command,
    [
      ...prefix,
      '--dir',
      join(root, 'packages', pkg),
      'pack',
      '--pack-destination',
      release,
    ],
    { stdio: 'inherit', shell: !useNodeExec && process.platform === 'win32' },
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
}
