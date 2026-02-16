/**
 * Static analysis guard: ensure src/ never uses browser-only APIs
 * that don't exist in Node.js/Bun.
 *
 * This test exists because `prompt()` slipped into auth.ts and caused a
 * ReferenceError crash at runtime. These APIs silently pass TypeScript
 * checking (they're in lib.dom.d.ts) but explode in a CLI context.
 */

import { describe, test } from 'bun:test'
import { Glob } from 'bun'

const FORBIDDEN_PATTERNS: { pattern: RegExp; name: string; why: string }[] = [
	{
		pattern: /(?<![.\w])prompt\s*\(/,
		name: 'prompt()',
		why: 'Browser-only. Use node:readline/promises instead.'
	},
	{
		pattern: /(?<![.\w])alert\s*\(/,
		name: 'alert()',
		why: 'Browser-only. Use process.stderr.write instead.'
	},
	{
		pattern: /(?<![.\w])confirm\s*\(/,
		name: 'confirm()',
		why: 'Browser-only. Use node:readline/promises instead.'
	}
]

describe('no browser-only APIs in src/', () => {
	for (const { pattern, name, why } of FORBIDDEN_PATTERNS) {
		test(`does not use ${name}`, async () => {
			const violations: string[] = []
			const glob = new Glob('**/*.ts')

			for await (const path of glob.scan({
				cwd: 'src',
				absolute: false
			})) {
				const file = Bun.file(`src/${path}`)
				const content = await file.text()
				const lines = content.split('\n')

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i] as string
					if (line.trimStart().startsWith('//')) continue
					if (pattern.test(line)) {
						violations.push(`src/${path}:${i + 1}: ${line.trim()}`)
					}
				}
			}

			if (violations.length > 0) {
				throw new Error(
					`${name} found in src/. ${why}\n${violations.join('\n')}`
				)
			}
		})
	}
})
