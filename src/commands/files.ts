/**
 * File commands: list, get.
 */

import { getFile, listFiles } from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { getPageParams, handleGet, handleList } from '../command-handler.ts'
import { buildFilter, buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['variant']

const COLUMNS = [
	{ key: 'name', label: 'Name' },
	{ key: 'extension', label: 'Extension' },
	{ key: 'size_formatted', label: 'Size' },
	{ key: 'version', label: 'Version' },
	{ key: 'status', label: 'Status' }
]

export function registerFileCommands(program: Command): void {
	const files = program
		.command('files')
		.description(
			'Manage Lemon Squeezy files (downloadable assets attached to variants)'
		)
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq files list --variant-id 123
  $ lmsq files get 456
  $ lmsq files get 456 --pluck download_url`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = files
		.command('list')
		.description('List files, optionally filtered by variant')
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--variant-id <id>', 'Filter by variant ID')

	addPaginationOptions(listCmd)
	addListOutputOptions(listCmd)
	addGlobalOutputOptions(listCmd)

	listCmd.action(async (opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)
		const filter = buildFilter({
			variantId: opts.variantId as string | undefined
		})
		const page = getPageParams(opts)

		await handleList(
			{ options: opts, resourceLabel: 'File', columns: COLUMNS },
			() =>
				listFiles({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = files
		.command('get <id>')
		.description('Retrieve a single file by its ID')
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)

	addGetOutputOptions(getCmd)
	addGlobalOutputOptions(getCmd)

	getCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)

		await handleGet(
			{ options: opts, resourceLabel: 'File', columns: COLUMNS },
			() =>
				getFile(id, {
					include: include as any
				})
		)
	})
}
