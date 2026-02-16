/**
 * Output mode detection and routing.
 *
 * Determines the output mode (text, pretty, json, json-raw) based on
 * CLI flags and TTY detection, then delegates to the correct formatter.
 */

import {
	type CliError,
	formatErrorAsJson,
	formatErrorAsText
} from './errors.ts'
import { extractIds, pluckField, selectFields } from './fields.ts'
import { flattenListResponse, flattenResource } from './formatters/json.ts'
import {
	formatListAsPretty,
	formatResourceAsPretty
} from './formatters/pretty.ts'
import {
	formatCountAsText,
	formatIdsAsText,
	formatListAsText,
	formatPluckAsText,
	formatResourceAsText
} from './formatters/text.ts'

export type OutputMode = 'text' | 'pretty' | 'json' | 'json-raw'

export interface OutputOptions {
	json?: boolean
	jsonRaw?: boolean
	fields?: string[]
	onlyIds?: boolean
	count?: boolean
	first?: boolean
	pluck?: string
	color?: boolean
	noColor?: boolean
}

export function resolveOutputMode(options: OutputOptions): OutputMode {
	if (options.jsonRaw) return 'json-raw'
	if (options.json) return 'json'
	if (options.noColor) return 'text'
	if (options.color) return 'pretty'
	return process.stdout.isTTY ? 'pretty' : 'text'
}

export function outputResource(
	raw: unknown,
	mode: OutputMode,
	resourceLabel: string,
	options: OutputOptions = {}
): string {
	if (mode === 'json-raw') {
		return JSON.stringify(raw, null, 2)
	}

	const flat = flattenResource(raw)

	if (options.pluck) {
		const value = pluckField(flat, options.pluck)
		if (mode === 'json') return JSON.stringify(value)
		return formatPluckAsText(value)
	}

	if (mode === 'json') {
		const data = options.fields ? selectFields(flat, options.fields) : flat
		return JSON.stringify(data, null, 2)
	}

	if (mode === 'pretty') {
		return formatResourceAsPretty(flat, resourceLabel, {
			fields: options.fields
		})
	}

	return formatResourceAsText(flat, { fields: options.fields })
}

export function outputList(
	raw: unknown,
	mode: OutputMode,
	columns: { key: string; label: string; width?: number }[],
	options: OutputOptions = {}
): string {
	if (mode === 'json-raw') {
		return JSON.stringify(raw, null, 2)
	}

	const flattened = flattenListResponse(raw)

	if (options.count) {
		if (mode === 'json')
			return JSON.stringify({ count: flattened.meta.total })
		return formatCountAsText(flattened.meta.total)
	}

	if (options.onlyIds) {
		const ids = extractIds(flattened.data)
		if (mode === 'json') {
			return JSON.stringify({ ids, meta: flattened.meta })
		}
		return formatIdsAsText(ids, flattened.meta.total)
	}

	if (mode === 'json') {
		const fields = options.fields
		const data = fields
			? flattened.data.map(r => selectFields(r, fields))
			: flattened.data
		return JSON.stringify({ data, meta: flattened.meta }, null, 2)
	}

	if (mode === 'pretty') {
		return formatListAsPretty(
			flattened.data,
			columns,
			{
				...flattened.meta,
				pageSize: flattened.meta.pageSize
			},
			{ fields: options.fields }
		)
	}

	return formatListAsText(flattened.data, flattened.meta, {
		fields: options.fields
	})
}

export function outputError(error: CliError, mode: OutputMode): string {
	if (mode === 'json' || mode === 'json-raw') {
		return formatErrorAsJson(error)
	}
	return formatErrorAsText(error)
}
