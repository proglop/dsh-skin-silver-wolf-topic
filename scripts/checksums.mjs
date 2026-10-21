import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const dir = resolve(process.argv[2] ?? 'release')
const lines = readdirSync(dir)
  .filter((name) => name.endsWith('.tgz') || name.endsWith('.zip'))
  .sort()
  .map((name) => {
    const hash = createHash('sha256').update(readFileSync(join(dir, name))).digest('hex')
    return `${hash}  ${name}`
  })

if (lines.length === 0) {
  console.error(`no release archives found in ${dir}`)
  process.exit(1)
}

writeFileSync(join(dir, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`, 'utf8')
console.log(lines.join('\n'))
