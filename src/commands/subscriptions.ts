/**
 * Subscription commands: list, get, update, cancel.
 */

import {
	cancelSubscription,
	getSubscription,
	listSubscriptions,
	type UpdateSubscription,
	updateSubscription
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

const VALID_INCLUDES = [
	'store',
	'customer',
	'order',
	'order-item',
	'product',
	'variant',
	'subscription-items',
	'subscription-invoices'
]

const COLUMNS = [
	{ key: 'product_name', label: 'Product' },
	{ key: 'variant_name', label: 'Variant' },
	{ key: 'status', label: 'Status' },
	{ key: 'user_email', label: 'Email' },
	{ key: 'renews_at', label: 'Renews At' }
]

export function registerSubscriptionCommands(program: Command): void {
	const subscriptions = program
		.command('subscriptions')
		.description('Manage Lemon Squeezy subscriptions')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq subscriptions list
  $ lmsq subscriptions list --status active --only-ids
  $ lmsq subscriptions list --user-email jane@example.com
  $ lmsq subscriptions get 456 --pluck status
  $ lmsq subscriptions update 456 --pause void
  $ lmsq subscriptions cancel 456`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = subscriptions
		.command('list')
		.description(
			'List subscriptions, optionally filtered by store, order, product, variant, email, or status'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--store-id <id>', 'Filter by store ID')
		.option('--order-id <id>', 'Filter by order ID')
		.option('--order-item-id <id>', 'Filter by order item ID')
		.option('--product-id <id>', 'Filter by product ID')
		.option('--variant-id <id>', 'Filter by variant ID')
		.option('--user-email <email>', 'Filter by customer email address')
		.option(
			'--status <status>',
			'Filter by subscription status (e.g. active, paused, cancelled, expired)'
		)

	addPaginationOptions(listCmd)
	addListOutputOptions(listCmd)
	addGlobalOutputOptions(listCmd)

	listCmd.action(async (opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)
		const filter = buildFilter({
			storeId: opts.storeId as string | undefined,
			orderId: opts.orderId as string | undefined,
			orderItemId: opts.orderItemId as string | undefined,
			productId: opts.productId as string | undefined,
			variantId: opts.variantId as string | undefined,
			userEmail: opts.userEmail as string | undefined,
			status: opts.status as string | undefined
		})
		const page = getPageParams(opts)

		await handleList(
			{ options: opts, resourceLabel: 'Subscription', columns: COLUMNS },
			() =>
				listSubscriptions({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = subscriptions
		.command('get <id>')
		.description('Retrieve a single subscription by its ID')
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
			{ options: opts, resourceLabel: 'Subscription', columns: COLUMNS },
			() =>
				getSubscription(id, {
					include: include as any
				})
		)
	})

	// ── update ──────────────────────────────────────────────────────────
	const updateCmd = subscriptions
		.command('update <id>')
		.description(
			'Update a subscription (change variant, pause/unpause, cancel/uncancel, adjust billing)'
		)
		.option('--variant-id <id>', 'Switch to a different variant / plan')
		.option(
			'--pause <mode>',
			'Pause the subscription with the given mode ("void" or "free")'
		)
		.option(
			'--pause-resumes-at <datetime>',
			'ISO 8601 datetime when a paused subscription should automatically resume'
		)
		.option('--unpause', 'Unpause the subscription (sets pause to null)')
		.option(
			'--cancelled',
			'Cancel the subscription at the end of the current billing period'
		)
		.option(
			'--uncancelled',
			'Remove a pending cancellation and reactivate the subscription'
		)
		.option(
			'--trial-ends-at <datetime>',
			'ISO 8601 datetime when the trial period should end'
		)
		.option(
			'--billing-anchor <day>',
			'Day of the month for billing (1-31). Pass 0 to remove the anchor.'
		)
		.option(
			'--invoice-immediately',
			'Generate an invoice immediately when changing the plan'
		)
		.option(
			'--disable-prorations',
			'Disable prorated charges/credits when changing the plan'
		)
		.addHelpText(
			'after',
			`
Pause modes:
  "void"  — billing is paused, customer loses access
  "free"  — billing is paused, customer keeps access

--cancelled vs cancel:
  --cancelled  schedules cancellation at the end of the billing period
  cancel <id>  cancels the subscription immediately

Examples:
  $ lmsq subscriptions update 456 --pause void
  $ lmsq subscriptions update 456 --pause free --pause-resumes-at 2025-06-01T00:00:00Z
  $ lmsq subscriptions update 456 --unpause
  $ lmsq subscriptions update 456 --cancelled
  $ lmsq subscriptions update 456 --uncancelled
  $ lmsq subscriptions update 456 --variant-id 789
  $ lmsq subscriptions update 456 --variant-id 789 --invoice-immediately --disable-prorations
  $ lmsq subscriptions update 456 --billing-anchor 15`
		)

	addGetOutputOptions(updateCmd)
	addGlobalOutputOptions(updateCmd)

	updateCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const body: Record<string, unknown> = {}

		// Variant change
		if (opts.variantId !== undefined) {
			body.variantId = Number(opts.variantId)
		}

		// Pause / unpause
		if (opts.unpause) {
			body.pause = null
		} else if (opts.pause) {
			body.pause = {
				mode: opts.pause as string,
				resumesAt: (opts.pauseResumesAt as string) || undefined
			}
		}

		// Cancel / uncancel
		if (opts.cancelled) {
			body.cancelled = true
		} else if (opts.uncancelled) {
			body.cancelled = false
		}

		// Trial end date
		if (opts.trialEndsAt !== undefined) {
			body.trialEndsAt = opts.trialEndsAt as string
		}

		// Billing anchor (0 means null / remove)
		if (opts.billingAnchor !== undefined) {
			const anchor = parseInt(opts.billingAnchor as string, 10)
			body.billingAnchor = anchor === 0 ? null : anchor
		}

		// Proration / invoicing flags
		if (opts.invoiceImmediately) {
			body.invoiceImmediately = true
		}
		if (opts.disableProrations) {
			body.disableProrations = true
		}

		await handleAction(
			{ options: opts, resourceLabel: 'Subscription', columns: COLUMNS },
			() => updateSubscription(id, body as UpdateSubscription)
		)
	})

	// ── cancel ──────────────────────────────────────────────────────────
	const cancelCmd = subscriptions
		.command('cancel <id>')
		.description(
			'Cancel a subscription immediately (differs from --cancelled which cancels at period end)'
		)
		.addHelpText(
			'after',
			`
This cancels the subscription immediately. To cancel at the end of the
current billing period instead, use: lmsq subscriptions update <id> --cancelled

Example:
  $ lmsq subscriptions cancel 456`
		)

	addGetOutputOptions(cancelCmd)
	addGlobalOutputOptions(cancelCmd)

	cancelCmd.action(async (id: string, opts: Record<string, unknown>) => {
		await handleAction(
			{ options: opts, resourceLabel: 'Subscription', columns: COLUMNS },
			() => cancelSubscription(id),
			`Subscription ${id} cancelled successfully.`
		)
	})
}
