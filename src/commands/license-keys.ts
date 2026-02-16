/**
 * License Key commands: list, get, update.
 */

import {
	getLicenseKey,
	listLicenseKeys,
	updateLicenseKey
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
	'license-key-instances'
]

const COLUMNS = [
	{ key: 'key_short', label: 'Key (Short)' },
	{ key: 'status', label: 'Status' },
	{ key: 'activation_limit', label: 'Activation Limit' },
	{ key: 'instances_count', label: 'Instances' },
	{ key: 'expires_at', label: 'Expires At' }
]

export function registerLicenseKeyCommands(program: Command): void {
	const licenseKeys = program
		.command('license-keys')
		.description('Manage Lemon Squeezy license keys')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq license-keys list --store-id 123
  $ lmsq license-keys list --status active --only-ids
  $ lmsq license-keys get 456
  $ lmsq license-keys update 456 --activation-limit 5
  $ lmsq license-keys update 456 --disabled true`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = licenseKeys
		.command('list')
		.description(
			'List license keys, optionally filtered by store, order, product, or status'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--store-id <id>', 'Filter by store ID')
		.option('--order-id <id>', 'Filter by order ID')
		.option('--order-item-id <id>', 'Filter by order item ID')
		.option('--product-id <id>', 'Filter by product ID')
		.option('--status <status>', 'Filter by license key status')

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
			orderId: opts.orderId as string | undefined,
			orderItemId: opts.orderItemId as string | undefined,
			productId: opts.productId as string | undefined,
			status: opts.status as string | undefined
		})

		await handleList(
			{ options: opts, resourceLabel: 'License Key', columns: COLUMNS },
			() =>
				listLicenseKeys({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = licenseKeys
		.command('get <id>')
		.description('Retrieve a single license key by its ID')
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
			{ options: opts, resourceLabel: 'License Key', columns: COLUMNS },
			() =>
				getLicenseKey(id, {
					include: include as any
				})
		)
	})

	// ── update ─────────────────────────────────────────────────────────
	const updateCmd = licenseKeys
		.command('update <id>')
		.description(
			"Update a license key's activation limit, expiry, or disabled state"
		)
		.option(
			'--activation-limit <limit>',
			'Maximum number of activations, or "unlimited" to remove the limit'
		)
		.option(
			'--expires-at <datetime>',
			'Expiration date (ISO 8601 datetime), or "never" to remove expiry'
		)
		.option(
			'--disabled <boolean>',
			'Set the license key as disabled (true/false)'
		)
		.option(
			'--enabled <boolean>',
			'Set the license key as enabled (true/false, sets disabled=false)'
		)
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq license-keys update 456 --activation-limit 5
  $ lmsq license-keys update 456 --activation-limit unlimited
  $ lmsq license-keys update 456 --expires-at 2026-12-31T00:00:00Z
  $ lmsq license-keys update 456 --expires-at never
  $ lmsq license-keys update 456 --disabled true
  $ lmsq license-keys update 456 --enabled true`
		)

	addGetOutputOptions(updateCmd)
	addGlobalOutputOptions(updateCmd)

	updateCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const updateData: Record<string, unknown> = {}

		if (opts.activationLimit !== undefined) {
			const raw = opts.activationLimit as string
			updateData.activationLimit =
				raw === 'unlimited' ? null : parseInt(raw, 10)
		}

		if (opts.expiresAt !== undefined) {
			const raw = opts.expiresAt as string
			updateData.expiresAt = raw === 'never' ? null : raw
		}

		if (opts.disabled !== undefined) {
			updateData.disabled = opts.disabled === 'true'
		}

		if (opts.enabled !== undefined) {
			if (opts.enabled === 'true') {
				updateData.disabled = false
			}
		}

		await handleAction(
			{ options: opts, resourceLabel: 'License Key', columns: COLUMNS },
			() => updateLicenseKey(id, updateData as any)
		)
	})
}
