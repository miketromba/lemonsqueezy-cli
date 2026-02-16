/**
 * Price commands: list, get.
 */

import { getPrice, listPrices } from '@lemonsqueezy/lemonsqueezy.js'
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
	{ key: 'variant_id', label: 'Variant ID' },
	{ key: 'category', label: 'Category' },
	{ key: 'scheme', label: 'Scheme' },
	{ key: 'unit_price', label: 'Unit Price' }
]

export function registerPriceCommands(program: Command): void {
	const prices = program
		.command('prices')
		.description('Manage Lemon Squeezy prices')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq prices list --variant-id 123
  $ lmsq prices get 456`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = prices
		.command('list')
		.description('List prices, optionally filtered by variant')
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
			{ options: opts, resourceLabel: 'Price', columns: COLUMNS },
			() =>
				listPrices({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = prices
		.command('get <id>')
		.description('Retrieve a single price by its ID')
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
			{ options: opts, resourceLabel: 'Price', columns: COLUMNS },
			() =>
				getPrice(id, {
					include: include as any
				})
		)
	})
}
