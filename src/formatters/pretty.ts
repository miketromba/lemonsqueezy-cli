/**
 * Pretty output formatter (human TTY mode).
 *
 * Produces colored, aligned table/detail views with decorative
 * headers and pagination hints. Only used in interactive terminals.
 */

import chalk from 'chalk'
import { selectFields } from '../fields.ts'

export interface PrettyFormatOptions {
	fields?: string[]
}

/**
 * Format a single resource as a colored detail view.
 */
export function formatResourceAsPretty(
	resource: Record<string, unknown>,
	resourceLabel: string,
	options?: PrettyFormatOptions
): string {
	const filtered = options?.fields
		? selectFields(resource, options.fields)
		: resource

	const header = `${resourceLabel} #${filtered.id}`
	const separator = '═'.repeat(Math.max(header.length, 30))
	const lines: string[] = [chalk.bold(header), chalk.dim(separator), '']

	for (const [key, value] of Object.entries(filtered)) {
		if (key === 'id') continue
		const label = key
			.replace(/_/g, ' ')
			.replace(/\b\w/g, c => c.toUpperCase())
		const formatted = formatPrettyValue(value)
		lines.push(`  ${chalk.dim(`${label}:`)}  ${formatted}`)
	}

	return lines.join('\n')
}

/**
 * Format a list of resources as a colored table.
 */
export function formatListAsPretty(
	resources: Record<string, unknown>[],
	columns: { key: string; label: string; width?: number }[],
	pagination: {
		page: number
		pageCount: number
		total: number
		pageSize: number
	},
	options?: PrettyFormatOptions
): string {
	const activeColumns = options?.fields
		? [
				{ key: 'id', label: 'ID' },
				...columns.filter(c => options.fields?.includes(c.key))
			]
		: [{ key: 'id', label: 'ID' }, ...columns]

	const widths = activeColumns.map(col => {
		const headerLen = col.label.length
		const maxDataLen = resources.reduce((max, r) => {
			const val = String(r[col.key] ?? '')
			return Math.max(max, val.length)
		}, 0)
		return col.width ?? Math.max(headerLen, maxDataLen, 4)
	})

	const headerLine = activeColumns
		.map((col, i) => chalk.bold(col.label.padEnd(widths[i] ?? 4)))
		.join('  ')

	const separatorLine = widths.map(w => chalk.dim('─'.repeat(w))).join('  ')

	const dataLines = resources.map(r =>
		activeColumns
			.map((col, i) => {
				const val = String(r[col.key] ?? '')
				return val.padEnd(widths[i] ?? 4)
			})
			.join('  ')
	)

	const from = (pagination.page - 1) * pagination.pageSize + 1
	const to = Math.min(from + resources.length - 1, pagination.total)
	const paginationLine = chalk.dim(
		`\nShowing ${from}-${to} of ${pagination.total} results (page ${pagination.page} of ${pagination.pageCount})`
	)

	const lines = [headerLine, separatorLine, ...dataLines, paginationLine]

	if (pagination.page < pagination.pageCount) {
		lines.push(
			chalk.yellow(
				`→ Use --page ${pagination.page + 1} to see the next page`
			)
		)
	}

	return lines.join('\n')
}

function formatPrettyValue(value: unknown): string {
	if (value === null) return chalk.dim('null')
	if (value === true) return chalk.green('true')
	if (value === false) return chalk.red('false')
	if (typeof value === 'object') return JSON.stringify(value)
	return String(value)
}
