/**
 * Variant commands: list, get.
 */

import { getVariant, listVariants } from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { getPageParams, handleGet, handleList } from '../command-handler.ts'
import { buildFilter, buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['product', 'files', 'price-model']

const COLUMNS = [
	{ key: 'name', label: 'Name' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'status', label: 'Status' },
	{ key: 'sort', label: 'Sort' }
]

export function registerVariantCommands(program: Command): void {
	const variants = program
		.command('variants')
		.description('Manage Lemon Squeezy product variants')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq variants list --product-id 123
  $ lmsq variants list --status published
  $ lmsq variants get 456 --include product`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = variants
		.command('list')
		.description('List variants, optionally filtered by product or status')
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--product-id <id>', 'Filter by product ID')
		.option(
			'--status <status>',
			'Filter by variant status (e.g. published, draft)'
		)

	addPaginationOptions(listCmd)
	addListOutputOptions(listCmd)
	addGlobalOutputOptions(listCmd)

	listCmd.action(async (opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)
		const filter = buildFilter({
			productId: opts.productId as string | undefined,
			status: opts.status as string | undefined
		})
		const page = getPageParams(opts)

		await handleList(
			{ options: opts, resourceLabel: 'Variant', columns: COLUMNS },
			() =>
				listVariants({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = variants
		.command('get <id>')
		.description('Retrieve a single variant by its ID')
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
			{ options: opts, resourceLabel: 'Variant', columns: COLUMNS },
			() =>
				getVariant(id, {
					include: include as any
				})
		)
	})
}
