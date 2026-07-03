// Copies .env.example -> .env for both client and server if not already present.
import { existsSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'

for (const dir of ['server', 'client']) {
  const example = join(dir, '.env.example')
  const target = join(dir, '.env')
  if (existsSync(example) && !existsSync(target)) {
    copyFileSync(example, target)
    console.log(`Created ${target}`)
  }
}
