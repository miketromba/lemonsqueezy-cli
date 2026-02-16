/**
 * Discount commands: list, get, create, delete.
 */

import {
	createDiscount,
	deleteDiscount,
	getDiscount,
	listDiscounts
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import {
	getPageParams,
	handleAction,
	handleGet,
	handleList
} from '../command-handler.ts'
import {
	buildFilter,
	buildInclude,
	parseCommaSeparatedNumbers
} from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['store', 'variants', 'discount-redemptions']

const COLUMNS = [
	{ key: 'name', label: 'Name' },
	{ key: 'code', label: 'Code' },
	{ key: 'amount', label: 'Amount' },
	{ key: 'amount_type', label: 'Amount Type' },
	{ key: 'status', label: 'Status' }
]

export function registerDiscountCommands(program: Command): void {
	const discounts = program
		.command('discounts')
		.description('Manage Lemon Squeezy discounts')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq discounts list --store-id 123
  $ lmsq discounts get 456
  $ lmsq discounts create --store-id 123 --name "Launch Sale" --amount 20 --amount-type percent
  $ lmsq discounts delete 456`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = discounts
		.command('list')
		.description('List discounts, optionally filtered by store')
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
		const page = getPageParams(opts)
		const filter = buildFilter({
			storeId: opts.storeId as string | undefined
		})

		await handleList(
			{ options: opts, resourceLabel: 'Discount', columns: COLUMNS },
			() =>
				listDiscounts({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = discounts
		.command('get <id>')
		.description('Retrieve a single discount by its ID')
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
			{ options: opts, resourceLabel: 'Discount', columns: COLUMNS },
			() =>
				getDiscount(id, {
					include: include as any
				})
		)
	})

	// ── create ─────────────────────────────────────────────────────────
	const createCmd = discounts
		.command('create')
		.description('Create a new discount')
		.requiredOption(
			'--store-id <id>',
			'The store ID to create the discount in'
		)
		.requiredOption('--name <name>', 'The name of the discount')
		.requiredOption(
			'--amount <amount>',
			'The discount amount (percentage or fixed in cents)'
		)
		.requiredOption(
			'--amount-type <type>',
			'The type of discount amount (percent, fixed)'
		)
		.option('--code <code>', 'A unique code for the discount')
		.option(
			'--is-limited-redemptions <boolean>',
			'Whether the discount is limited by total redemptions (true/false)'
		)
		.option('--max-redemptions <number>', 'Maximum number of redemptions')
		.option('--starts-at <datetime>', 'Start date (ISO 8601 datetime)')
		.option(
			'--expires-at <datetime>',
			'Expiration date (ISO 8601 datetime)'
		)
		.option(
			'--duration <duration>',
			'Duration for recurring discounts (once, repeating, forever)'
		)
		.option(
			'--duration-in-months <number>',
			'Number of months for repeating duration'
		)
		.option(
			'--is-limited-to-products <boolean>',
			'Whether the discount is limited to specific products (true/false)'
		)
		.option(
			'--variant-ids <ids>',
			'Comma-separated list of variant IDs to limit the discount to'
		)
		.option(
			'--test-mode <boolean>',
			'Whether this is a test mode discount (true/false)'
		)
		.addHelpText(
			'after',
			`
Amount types:
  "percent"  discount as a percentage (e.g. --amount 20 = 20% off)
  "fixed"    discount as a fixed amount in cents (e.g. --amount 500 = $5.00 off)

Duration (for subscriptions):
  "once"       applies to the first payment only
  "repeating"  applies for --duration-in-months months
  "forever"    applies to every payment

Examples:
  $ lmsq discounts create --store-id 1 --name "Launch Sale" --amount 20 --amount-type percent
  $ lmsq discounts create --store-id 1 --name "5 Off" --amount 500 --amount-type fixed --code SAVE5
  $ lmsq discounts create --store-id 1 --name "3mo Deal" --amount 15 --amount-type percent --duration repeating --duration-in-months 3
  $ lmsq discounts create --store-id 1 --name "VIP" --amount 10 --amount-type percent --is-limited-to-products true --variant-ids 100,200`
		)

	addGetOutputOptions(createCmd)
	addGlobalOutputOptions(createCmd)

	createCmd.action(async (opts: Record<string, unknown>) => {
		const storeId = parseInt(opts.storeId as string, 10)
		const name = opts.name as string
		const amount = parseInt(opts.amount as string, 10)
		const amountType = opts.amountType as string

		const newDiscount: Record<string, unknown> = {
			storeId,
			name,
			amount,
			amountType
		}

		if (opts.code !== undefined) newDiscount.code = opts.code as string
		if (opts.isLimitedRedemptions !== undefined) {
			newDiscount.isLimitedRedemptions =
				opts.isLimitedRedemptions === 'true'
		}
		if (opts.maxRedemptions !== undefined) {
			newDiscount.maxRedemptions = parseInt(
				opts.maxRedemptions as string,
				10
			)
		}
		if (opts.startsAt !== undefined)
			newDiscount.startsAt = opts.startsAt as string
		if (opts.expiresAt !== undefined)
			newDiscount.expiresAt = opts.expiresAt as string
		if (opts.duration !== undefined)
			newDiscount.duration = opts.duration as string
		if (opts.durationInMonths !== undefined) {
			newDiscount.durationInMonths = parseInt(
				opts.durationInMonths as string,
				10
			)
		}
		if (opts.testMode !== undefined) {
			newDiscount.testMode = opts.testMode === 'true'
		}
		if (opts.isLimitedToProducts === 'true') {
			newDiscount.isLimitedToProducts = true
			if (opts.variantIds) {
				newDiscount.variantIds = parseCommaSeparatedNumbers(
					opts.variantIds as string
				)
			}
		}

		await handleAction(
			{ options: opts, resourceLabel: 'Discount', columns: COLUMNS },
			() => createDiscount(newDiscount as any)
		)
	})

	// ── delete ─────────────────────────────────────────────────────────
	const deleteCmd = discounts
		.command('delete <id>')
		.description('Delete a discount by its ID')

	addGlobalOutputOptions(deleteCmd)

	deleteCmd.action(async (id: string, opts: Record<string, unknown>) => {
		await handleAction(
			{ options: opts, resourceLabel: 'Discount', columns: COLUMNS },
			() => deleteDiscount(id),
			'Discount deleted.'
		)
	})
}
