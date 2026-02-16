/**
 * Shared utilities: parsers, validators, and common option builders.
 */

/**
 * Parse a comma-separated string into an array of trimmed strings.
 */
export function parseCommaSeparated(value: string): string[] {
	return value
		.split(',')
		.map(s => s.trim())
		.filter(Boolean)
}

/**
 * Parse a comma-separated string into an array of numbers.
 */
export function parseCommaSeparatedNumbers(value: string): number[] {
	return parseCommaSeparated(value).map(s => {
		const n = Number(s)
		if (Number.isNaN(n)) throw new Error(`Invalid number: "${s}"`)
		return n
	})
}

/**
 * Build the SDK `include` param from a comma-separated --include flag value.
 */
export function buildInclude(
	includeStr: string | undefined,
	validIncludes: string[]
): string[] | undefined {
	if (!includeStr) return undefined
	const requested = parseCommaSeparated(includeStr)
	for (const inc of requested) {
		if (!validIncludes.includes(inc)) {
			throw new Error(
				`Invalid include "${inc}". Valid includes: ${validIncludes.join(', ')}`
			)
		}
	}
	return requested
}

/**
 * Build the SDK `page` param from --page and --page-size flag values.
 */
export function buildPage(
	page?: string,
	pageSize?: string
): { number: number; size: number } | undefined {
	const p = page ? parseInt(page, 10) : 1
	const s = pageSize ? parseInt(pageSize, 10) : 5
	return { number: p, size: s }
}

/**
 * Build a filter object, stripping undefined values.
 */
export function buildFilter(
	raw: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean> | undefined {
	const result: Record<string, string | number | boolean> = {}
	let hasAny = false
	for (const [key, value] of Object.entries(raw)) {
		if (value !== undefined) {
			result[key] = value
			hasAny = true
		}
	}
	return hasAny ? result : undefined
}
