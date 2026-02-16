/**
 * Order commands: list, get, invoice, refund.
 */

import {
	generateOrderInvoice,
	getOrder,
	issueOrderRefund,
	listOrders
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import {
	generateInvoiceWithLocale,
	issueFullRefund,
	listOrdersWithOrderNumber
} from '../api.ts'
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

const VALID_INCLUDES = [
	'store',
	'customer',
	'order-items',
	'subscriptions',
	'license-keys',
	'discount-redemptions'
]

const COLUMNS = [
	{ key: 'order_number', label: 'Order #' },
	{ key: 'status', label: 'Status' },
	{ key: 'user_email', label: 'Email' },
	{ key: 'total', label: 'Total' },
	{ key: 'currency', label: 'Currency' }
]

export function registerOrderCommands(program: Command): void {
	const orders = program
		.command('orders')
		.description('Manage Lemon Squeezy orders')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq orders list
  $ lmsq orders list --store-id 123 --fields status,total,user_email
  $ lmsq orders get 456
  $ lmsq orders get 456 --pluck status
  $ lmsq orders invoice 456
  $ lmsq orders refund 456`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = orders
		.command('list')
		.description(
			'List orders, optionally filtered by store, email, or order number'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--store-id <id>', 'Filter by store ID')
		.option('--user-email <email>', 'Filter by customer email address')
		.option(
			'--filter-order-number <number>',
			'Filter by order number (uses direct API)'
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
		const orderNumber = opts.filterOrderNumber as string | undefined

		if (orderNumber) {
			// Use direct API for order_number filtering (not supported by SDK)
			const apiKey = getApiKey(opts.apiKey as string | undefined)
			setupSdk(opts)

			await handleList(
				{ options: opts, resourceLabel: 'Order', columns: COLUMNS },
				() =>
					listOrdersWithOrderNumber(apiKey, {
						storeId: opts.storeId as string | undefined,
						userEmail: opts.userEmail as string | undefined,
						orderNumber,
						page: page?.number,
						pageSize: page?.size,
						include: include as string[] | undefined
					})
			)
		} else {
			const filter = buildFilter({
				storeId: opts.storeId as string | undefined,
				userEmail: opts.userEmail as string | undefined
			})

			await handleList(
				{ options: opts, resourceLabel: 'Order', columns: COLUMNS },
				() =>
					listOrders({
						filter: filter as any,
						include: include as any,
						page
					})
			)
		}
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = orders
		.command('get <id>')
		.description('Retrieve a single order by its ID')
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
			{ options: opts, resourceLabel: 'Order', columns: COLUMNS },
			() =>
				getOrder(id, {
					include: include as any
				})
		)
	})

	// ── invoice ─────────────────────────────────────────────────────────
	const invoiceCmd = orders
		.command('invoice <id>')
		.description(
			'Generate a PDF invoice for an order. Returns a download link.'
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
  $ lmsq orders invoice 456                          # basic invoice
  $ lmsq orders invoice 456 --name "Jane Doe" --country US
  $ lmsq orders invoice 456 --notes "Thank you!" --locale fr`
		)

	addGetOutputOptions(invoiceCmd)
	addGlobalOutputOptions(invoiceCmd)

	invoiceCmd.action(async (id: string, opts: Record<string, unknown>) => {
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
				{ options: opts, resourceLabel: 'Order', columns: COLUMNS },
				() => generateInvoiceWithLocale(apiKey, `/orders/${id}`, params)
			)
		} else {
			await handleAction(
				{ options: opts, resourceLabel: 'Order', columns: COLUMNS },
				() =>
					generateOrderInvoice(id, {
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

	// ── refund ──────────────────────────────────────────────────────────
	const refundCmd = orders
		.command('refund <id>')
		.description(
			'Issue a refund for an order. Omit --amount for a full refund.'
		)
		.option(
			'--amount <cents>',
			'Refund amount in cents. If omitted, a full refund is issued (uses direct API).'
		)
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq orders refund 456              # full refund
  $ lmsq orders refund 456 --amount 500 # partial refund of $5.00`
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
				{ options: opts, resourceLabel: 'Order', columns: COLUMNS },
				() => issueFullRefund(apiKey, `/orders/${id}`),
				`Order ${id} fully refunded.`
			)
		} else {
			await handleAction(
				{ options: opts, resourceLabel: 'Order', columns: COLUMNS },
				() => issueOrderRefund(id, parseInt(amount, 10))
			)
		}
	})
}
