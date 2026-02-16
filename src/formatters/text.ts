/**
 * Text output formatter (AI-agent optimized).
 *
 * Produces flat `key: value` lines with no decoration, no color,
 * no ANSI codes. Optimized for minimal token consumption.
 */

import { selectFields } from '../fields.ts'

export interface TextFormatOptions {
	fields?: string[]
}

function formatTextValue(value: unknown): string {
	if (value === null) return 'null'
	if (typeof value === 'object') return JSON.stringify(value)
	return String(value)
}

function resourceToLines(resource: Record<string, unknown>): string {
	return Object.entries(resource)
		.map(([key, value]) => `${key}: ${formatTextValue(value)}`)
		.join('\n')
}

/**
 * Format a single resource as flat `key: value` lines.
 * If `fields` is provided, only those fields (plus `id`) are included.
 */
export function formatResourceAsText(
	resource: Record<string, unknown>,
	options?: TextFormatOptions
): string {
	const filtered = options?.fields
		? selectFields(resource, options.fields)
		: resource
	return resourceToLines(filtered)
}

/**
 * Format a list of resources as `key: value` blocks separated by blank lines,
 * with a `[page X/Y, N total]` footer.
 */
export function formatListAsText(
	resources: Record<string, unknown>[],
	pagination: { page: number; pageCount: number; total: number },
	options?: TextFormatOptions
): string {
	const blocks = resources.map(r => {
		const filtered = options?.fields ? selectFields(r, options.fields) : r
		return resourceToLines(filtered)
	})
	const footer = `[page ${pagination.page}/${pagination.pageCount}, ${pagination.total} total]`
	return `${blocks.join('\n\n')}\n\n${footer}`
}

/**
 * Format for --only-ids: one ID per line with a `[N total]` footer.
 */
export function formatIdsAsText(ids: string[], total: number): string {
	return `${ids.join('\n')}\n[${total} total]`
}

/**
 * Format for --count: just the number.
 */
export function formatCountAsText(count: number): string {
	return String(count)
}

/**
 * Format for --pluck: just the bare value.
 */
export function formatPluckAsText(value: unknown): string {
	return String(value)
}
