#!/usr/bin/env bun
/**
 * Build script: compiles the CLI into a single Node-compatible JS file.
 *
 * - Bundles all source + dependencies into one file
 * - Targets Node.js (not Bun) so `npm install -g` works everywhere
 * - Strips any `#!/usr/bin/env bun` shebang and prepends `#!/usr/bin/env node`
 * - Minifies for smallest possible package size
 */

import { readFileSync, writeFileSync } from 'node:fs'

const ENTRY = 'bin/lmsq.ts'
const OUTFILE = 'dist/lmsq.js'
const NODE_SHEBANG = '#!/usr/bin/env node\n'

console.log('Building lmsq...')

const result = await Bun.build({
	entrypoints: [ENTRY],
	outdir: '.',
	naming: OUTFILE,
	target: 'node',
	minify: true,
	sourcemap: 'none'
})

if (!result.success) {
	console.error('Build failed:')
	for (const log of result.logs) {
		console.error(log)
	}
	process.exit(1)
}

// Read the built file, strip any bun shebang, prepend node shebang
let code = readFileSync(OUTFILE, 'utf-8')
code = code.replace(/^#!.*\n/, '')
writeFileSync(OUTFILE, NODE_SHEBANG + code)

// Make executable
const { chmodSync } = await import('node:fs')
chmodSync(OUTFILE, 0o755)

const stats = Bun.file(OUTFILE)
const sizeKB = Math.round((await stats.size) / 1024)
console.log(`Built ${OUTFILE} (${sizeKB} KB)`)
