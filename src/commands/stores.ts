/**
 * Store commands: list, get.
 */

import { getStore, listStores } from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { getPageParams, handleGet, handleList } from '../command-handler.ts'
import { buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = [
	'products',
	'orders',
	'subscriptions',
	'discounts',
	'license-keys',
	'webhooks'
]

const COLUMNS = [
	{ key: 'name', label: 'Name' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'url', label: 'URL' },
	{ key: 'currency', label: 'Currency' },
	{ key: 'total_sales', label: 'Total Sales' }
]

export function registerStoreCommands(program: Command): void {
	const stores = program
		.command('stores')
		.description('Manage Lemon Squeezy stores')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq stores list
  $ lmsq stores get 123
  $ lmsq stores get 123 --json
  $ lmsq stores list --include products`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = stores
		.command('list')
		.description('List all stores for the authenticated user')
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)

	addPaginationOptions(listCmd)
	addListOutputOptions(listCmd)
	addGlobalOutputOptions(listCmd)

	listCmd.action(async (opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)
		const page = getPageParams(opts)

		await handleList(
			{ options: opts, resourceLabel: 'Store', columns: COLUMNS },
			() =>
				listStores({
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = stores
		.command('get <id>')
		.description('Retrieve a single store by its ID')
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
			{ options: opts, resourceLabel: 'Store', columns: COLUMNS },
			() =>
				getStore(id, {
					include: include as any
				})
		)
	})
}
