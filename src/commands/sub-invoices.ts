/**
 * Subscription Invoice commands: list, get, generate, refund.
 */

import {
	generateSubscriptionInvoice,
	getSubscriptionInvoice,
	issueSubscriptionInvoiceRefund,
	listSubscriptionInvoices
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { generateInvoiceWithLocale, issueFullRefund } from '../api.ts'
import {
	getPageParams,
	handleAction,
	handleGet,
	handleList,
	setupSdk
} from '../command-handler.ts'
import { getApiKey } from '../config.ts'
import { buildFilter, buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['store', 'subscription', 'customer']

const COLUMNS = [
	{ key: 'subscription_id', label: 'Subscription ID' },
	{ key: 'billing_reason', label: 'Billing Reason' },
	{ key: 'status', label: 'Status' },
	{ key: 'total', label: 'Total' },
	{ key: 'currency', label: 'Currency' }
]

export function registerSubInvoiceCommands(program: Command): void {
	const subInvoices = program
		.command('subscription-invoices')
		.description('Manage Lemon Squeezy subscription invoices')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq subscription-invoices list --subscription-id 456
  $ lmsq subscription-invoices list --status paid
  $ lmsq subscription-invoices get 789
  $ lmsq subscription-invoices generate 789
  $ lmsq subscription-invoices refund 789`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = subInvoices
		.command('list')
		.description(
			'List subscription invoices, optionally filtered by store, status, refunded, or subscription'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--store-id <id>', 'Filter by store ID')
		.option('--status <status>', 'Filter by invoice status')
		.option(
			'--refunded <boolean>',
			'Filter by refunded status (true/false)'
		)
		.option('--subscription-id <id>', 'Filter by subscription ID')

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
			storeId: opts.storeId as string | undefined,
			status: opts.status as string | undefined,
			refunded: opts.refunded as string | undefined,
			subscriptionId: opts.subscriptionId as string | undefined
		})

		await handleList(
			{
				options: opts,
				resourceLabel: 'Subscription Invoice',
				columns: COLUMNS
			},
			() =>
				listSubscriptionInvoices({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = subInvoices
		.command('get <id>')
		.description('Retrieve a single subscription invoice by its ID')
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
				resourceLabel: 'Subscription Invoice',
				columns: COLUMNS
			},
			() =>
				getSubscriptionInvoice(id, {
					include: include as any
				})
		)
	})

	// ── generate ───────────────────────────────────────────────────────
	const generateCmd = subInvoices
		.command('generate <id>')
		.description(
			'Generate a PDF invoice for a subscription invoice. Returns a download link.'
		)
		.option('--name <name>', 'Customer name on the invoice')
		.option('--address <address>', 'Street address on the invoice')
		.option('--city <city>', 'City on the invoice')
		.option('--state <state>', 'State or region on the invoice')
		.option('--zip-code <code>', 'ZIP / postal code on the invoice')
		.option(
			'--country <country>',
			'Two-letter ISO country code on the invoice'
		)
		.option('--notes <notes>', 'Custom notes to append to the invoice')
		.option(
			'--locale <locale>',
			'Invoice locale / language code (uses direct API when provided)'
		)
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq subscription-invoices generate 789
  $ lmsq subscription-invoices generate 789 --name "Jane Doe" --country US
  $ lmsq subscription-invoices generate 789 --locale fr`
		)

	addGetOutputOptions(generateCmd)
	addGlobalOutputOptions(generateCmd)

	generateCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const locale = opts.locale as string | undefined

		if (locale) {
			// Use direct API for locale support (not supported by SDK)
			const apiKey = getApiKey(opts.apiKey as string | undefined)
			setupSdk(opts)

			const params: Record<string, string | number | undefined> = {
				name: opts.name as string | undefined,
				address: opts.address as string | undefined,
				city: opts.city as string | undefined,
				state: opts.state as string | undefined,
				'zip-code': opts.zipCode as string | undefined,
				country: opts.country as string | undefined,
				notes: opts.notes as string | undefined,
				locale
			}

			await handleAction(
				{
					options: opts,
					resourceLabel: 'Subscription Invoice',
					columns: COLUMNS
				},
				() =>
					generateInvoiceWithLocale(
						apiKey,
						`/subscription-invoices/${id}`,
						params
					)
			)
		} else {
			await handleAction(
				{
					options: opts,
					resourceLabel: 'Subscription Invoice',
					columns: COLUMNS
				},
				() =>
					generateSubscriptionInvoice(id, {
						name: opts.name as string | undefined,
						address: opts.address as string | undefined,
						city: opts.city as string | undefined,
						state: opts.state as string | undefined,
						zipCode: opts.zipCode as string | undefined,
						country: opts.country as string | undefined,
						notes: opts.notes as string | undefined
					} as any)
			)
		}
	})

	// ── refund ─────────────────────────────────────────────────────────
	const refundCmd = subInvoices
		.command('refund <id>')
		.description(
			'Issue a refund for a subscription invoice. Omit --amount for a full refund.'
		)
		.option(
			'--amount <cents>',
			'Refund amount in cents. If omitted, a full refund is issued (uses direct API).'
		)
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq subscription-invoices refund 789              # full refund
  $ lmsq subscription-invoices refund 789 --amount 500 # partial refund of $5.00`
		)

	addGetOutputOptions(refundCmd)
	addGlobalOutputOptions(refundCmd)

	refundCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const amount = opts.amount as string | undefined

		if (!amount) {
			// Full refund via direct API (SDK requires an amount)
			const apiKey = getApiKey(opts.apiKey as string | undefined)
			setupSdk(opts)

			await handleAction(
				{
					options: opts,
					resourceLabel: 'Subscription Invoice',
					columns: COLUMNS
				},
				() => issueFullRefund(apiKey, `/subscription-invoices/${id}`),
				`Subscription invoice ${id} fully refunded.`
			)
		} else {
			await handleAction(
				{
					options: opts,
					resourceLabel: 'Subscription Invoice',
					columns: COLUMNS
				},
				() => issueSubscriptionInvoiceRefund(id, parseInt(amount, 10))
			)
		}
	})
}
