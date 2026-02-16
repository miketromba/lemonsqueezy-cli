/**
 * Order Item commands: list, get.
 */

import { getOrderItem, listOrderItems } from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { getPageParams, handleGet, handleList } from '../command-handler.ts'
import { buildFilter, buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['order', 'product', 'variant']

const COLUMNS = [
	{ key: 'order_id', label: 'Order ID' },
	{ key: 'product_name', label: 'Product' },
	{ key: 'variant_name', label: 'Variant' },
	{ key: 'price', label: 'Price' },
	{ key: 'quantity', label: 'Qty' }
]

export function registerOrderItemCommands(program: Command): void {
	const orderItems = program
		.command('order-items')
		.description(
			'Manage Lemon Squeezy order items (line items within an order)'
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = orderItems
		.command('list')
		.description(
			'List order items, optionally filtered by order, product, or variant'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--order-id <id>', 'Filter by order ID')
		.option('--product-id <id>', 'Filter by product ID')
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
			orderId: opts.orderId as string | undefined,
			productId: opts.productId as string | undefined,
			variantId: opts.variantId as string | undefined
		})
		const page = getPageParams(opts)

		await handleList(
			{ options: opts, resourceLabel: 'Order Item', columns: COLUMNS },
			() =>
				listOrderItems({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = orderItems
		.command('get <id>')
		.description('Retrieve a single order item by its ID')
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
			{ options: opts, resourceLabel: 'Order Item', columns: COLUMNS },
			() =>
				getOrderItem(id, {
					include: include as any
				})
		)
	})
}
