/**
 * Usage Record commands: list, get, create.
 */

import {
	createUsageRecord,
	getUsageRecord,
	listUsageRecords
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

const VALID_INCLUDES = ['subscription-item']

const COLUMNS = [
	{ key: 'subscription_item_id', label: 'Subscription Item ID' },
	{ key: 'quantity', label: 'Quantity' },
	{ key: 'action', label: 'Action' }
]

export function registerUsageRecordCommands(program: Command): void {
	const usageRecords = program
		.command('usage-records')
		.description('Manage Lemon Squeezy usage records')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq usage-records list --subscription-item-id 789
  $ lmsq usage-records get 101
  $ lmsq usage-records create --subscription-item-id 789 --quantity 5`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = usageRecords
		.command('list')
		.description(
			'List usage records, optionally filtered by subscription item'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--subscription-item-id <id>', 'Filter by subscription item ID')

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
			subscriptionItemId: opts.subscriptionItemId as string | undefined
		})

		await handleList(
			{ options: opts, resourceLabel: 'Usage Record', columns: COLUMNS },
			() =>
				listUsageRecords({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = usageRecords
		.command('get <id>')
		.description('Retrieve a single usage record by its ID')
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
			{ options: opts, resourceLabel: 'Usage Record', columns: COLUMNS },
			() =>
				getUsageRecord(id, {
					include: include as any
				})
		)
	})

	// ── create ─────────────────────────────────────────────────────────
	const createCmd = usageRecords
		.command('create')
		.description(
			'Create a new usage record for a metered subscription item'
		)
		.requiredOption(
			'--subscription-item-id <id>',
			'The subscription item ID to record usage for'
		)
		.requiredOption('--quantity <number>', 'The usage quantity to record')
		.option(
			'--action <action>',
			'How to apply the quantity: increment or set',
			'increment'
		)
		.addHelpText(
			'after',
			`
Actions:
  "increment"  adds the quantity to the current usage (default)
  "set"        replaces the current usage with the given quantity

Examples:
  $ lmsq usage-records create --subscription-item-id 789 --quantity 5
  $ lmsq usage-records create --subscription-item-id 789 --quantity 100 --action set`
		)

	addGetOutputOptions(createCmd)
	addGlobalOutputOptions(createCmd)

	createCmd.action(async (opts: Record<string, unknown>) => {
		const subscriptionItemId = parseInt(
			opts.subscriptionItemId as string,
			10
		)
		const quantity = parseInt(opts.quantity as string, 10)
		const action = (opts.action as string) || 'increment'

		await handleAction(
			{ options: opts, resourceLabel: 'Usage Record', columns: COLUMNS },
			() =>
				createUsageRecord({
					subscriptionItemId,
					quantity,
					action: action as 'increment' | 'set'
				} as any)
		)
	})
}
