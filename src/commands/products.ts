/**
 * Product commands: list, get.
 */

import { getProduct, listProducts } from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { getPageParams, handleGet, handleList } from '../command-handler.ts'
import { buildFilter, buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['store', 'variants']

const COLUMNS = [
	{ key: 'name', label: 'Name' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'status', label: 'Status' },
	{ key: 'price_formatted', label: 'Price' }
]

export function registerProductCommands(program: Command): void {
	const products = program
		.command('products')
		.description('Manage Lemon Squeezy products')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq products list
  $ lmsq products list --store-id 123
  $ lmsq products get 456 --include variants
  $ lmsq products list --fields name,status,price_formatted`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = products
		.command('list')
		.description('List products, optionally filtered by store')
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--store-id <id>', 'Filter by store ID')

	addPaginationOptions(listCmd)
	addListOutputOptions(listCmd)
	addGlobalOutputOptions(listCmd)

	listCmd.action(async (opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)
		const filter = buildFilter({
			storeId: opts.storeId as string | undefined
		})
		const page = getPageParams(opts)

		await handleList(
			{ options: opts, resourceLabel: 'Product', columns: COLUMNS },
			() =>
				listProducts({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = products
		.command('get <id>')
		.description('Retrieve a single product by its ID')
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
			{ options: opts, resourceLabel: 'Product', columns: COLUMNS },
			() =>
				getProduct(id, {
					include: include as any
				})
		)
	})
}
