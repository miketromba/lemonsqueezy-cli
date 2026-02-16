/**
 * Subscription Item commands: list, get, update, usage.
 */

import {
	getSubscriptionItem,
	getSubscriptionItemCurrentUsage,
	listSubscriptionItems,
	updateSubscriptionItem
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import {
	getPageParams,
	handleAction,
	handleGet,
	handleList
} from '../command-handler.ts'
import { buildFilter, buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['subscription', 'price', 'usage-records']

const COLUMNS = [
	{ key: 'subscription_id', label: 'Subscription ID' },
	{ key: 'price_id', label: 'Price ID' },
	{ key: 'quantity', label: 'Quantity' },
	{ key: 'is_usage_based', label: 'Usage Based' }
]

export function registerSubItemCommands(program: Command): void {
	const subItems = program
		.command('subscription-items')
		.description('Manage Lemon Squeezy subscription items')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq subscription-items list --subscription-id 456
  $ lmsq subscription-items get 789
  $ lmsq subscription-items update 789 --quantity 5
  $ lmsq subscription-items usage 789`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = subItems
		.command('list')
		.description(
			'List subscription items, optionally filtered by subscription or price'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--subscription-id <id>', 'Filter by subscription ID')
		.option('--price-id <id>', 'Filter by price ID')

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
			subscriptionId: opts.subscriptionId as string | undefined,
			priceId: opts.priceId as string | undefined
		})

		await handleList(
			{
				options: opts,
				resourceLabel: 'Subscription Item',
				columns: COLUMNS
			},
			() =>
				listSubscriptionItems({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = subItems
		.command('get <id>')
		.description('Retrieve a single subscription item by its ID')
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
				resourceLabel: 'Subscription Item',
				columns: COLUMNS
			},
			() =>
				getSubscriptionItem(id, {
					include: include as any
				})
		)
	})

	// ── update ─────────────────────────────────────────────────────────
	const updateCmd = subItems
		.command('update <id>')
		.description(
			'Update the quantity or billing behavior of a subscription item'
		)
		.requiredOption(
			'--quantity <number>',
			'New quantity for the subscription item'
		)
		.option(
			'--invoice-immediately <boolean>',
			'Whether to invoice immediately for the change (true/false)'
		)
		.option(
			'--disable-prorations <boolean>',
			'Whether to disable prorations for this change (true/false)'
		)
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq subscription-items update 789 --quantity 10
  $ lmsq subscription-items update 789 --quantity 10 --invoice-immediately true`
		)

	addGetOutputOptions(updateCmd)
	addGlobalOutputOptions(updateCmd)

	updateCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const quantity = parseInt(opts.quantity as string, 10)

		const updateData: Record<string, unknown> = { quantity }

		if (opts.invoiceImmediately !== undefined) {
			updateData.invoiceImmediately = opts.invoiceImmediately === 'true'
		}
		if (opts.disableProrations !== undefined) {
			updateData.disableProrations = opts.disableProrations === 'true'
		}

		await handleAction(
			{
				options: opts,
				resourceLabel: 'Subscription Item',
				columns: COLUMNS
			},
			() => updateSubscriptionItem(id, updateData as any)
		)
	})

	// ── usage ──────────────────────────────────────────────────────────
	const usageCmd = subItems
		.command('usage <id>')
		.description(
			'Get the current usage for a metered subscription item in the current billing period'
		)

	addGetOutputOptions(usageCmd)
	addGlobalOutputOptions(usageCmd)

	usageCmd.action(async (id: string, opts: Record<string, unknown>) => {
		await handleGet(
			{
				options: opts,
				resourceLabel: 'Subscription Item',
				columns: COLUMNS
			},
			() => getSubscriptionItemCurrentUsage(id)
		)
	})
}
