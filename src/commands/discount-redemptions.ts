/**
 * Discount Redemption commands: list, get.
 */

import {
	getDiscountRedemption,
	listDiscountRedemptions
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { getPageParams, handleGet, handleList } from '../command-handler.ts'
import { buildFilter, buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['discount', 'order']

const COLUMNS = [
	{ key: 'discount_name', label: 'Discount Name' },
	{ key: 'discount_code', label: 'Discount Code' },
	{ key: 'amount', label: 'Amount' },
	{ key: 'discount_amount_type', label: 'Amount Type' }
]

export function registerDiscountRedemptionCommands(program: Command): void {
	const redemptions = program
		.command('discount-redemptions')
		.description('Manage Lemon Squeezy discount redemptions')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq discount-redemptions list --discount-id 123
  $ lmsq discount-redemptions list --order-id 456
  $ lmsq discount-redemptions get 789`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = redemptions
		.command('list')
		.description(
			'List discount redemptions, optionally filtered by discount or order'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--discount-id <id>', 'Filter by discount ID')
		.option('--order-id <id>', 'Filter by order ID')

	addPaginationOptions(listCmd)
	addListOutputOptions(listCmd)
	addGlobalOutputOptions(listCmd)

	listCmd.action(async (opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)
		const page = getPageParams(opts)
		const filter = buildFilter({
			discountId: opts.discountId as string | undefined,
			orderId: opts.orderId as string | undefined
		})

		await handleList(
			{
				options: opts,
				resourceLabel: 'Discount Redemption',
				columns: COLUMNS
			},
			() =>
				listDiscountRedemptions({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = redemptions
		.command('get <id>')
		.description('Retrieve a single discount redemption by its ID')
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
			{
				options: opts,
				resourceLabel: 'Discount Redemption',
				columns: COLUMNS
			},
			() =>
				getDiscountRedemption(id, {
					include: include as any
				})
		)
	})
}
