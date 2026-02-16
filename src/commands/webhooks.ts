/**
 * Webhook commands: list, get, create, update, delete.
 */

import {
	createWebhook,
	deleteWebhook,
	getWebhook,
	listWebhooks,
	updateWebhook
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import {
	getPageParams,
	handleAction,
	handleGet,
	handleList
} from '../command-handler.ts'
import { buildFilter, buildInclude, parseCommaSeparated } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['store']

const COLUMNS = [
	{ key: 'url', label: 'URL' },
	{ key: 'events', label: 'Events' },
	{ key: 'last_sent_at', label: 'Last Sent At' }
]

export function registerWebhookCommands(program: Command): void {
	const webhooks = program
		.command('webhooks')
		.description('Manage Lemon Squeezy webhooks')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq webhooks list --store-id 123
  $ lmsq webhooks get 456
  $ lmsq webhooks create --store-id 1 --url https://example.com/webhook --secret s3cret --events order_created,subscription_created
  $ lmsq webhooks update 456 --events order_created,order_refunded
  $ lmsq webhooks delete 456`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = webhooks
		.command('list')
		.description('List webhooks, optionally filtered by store')
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
			{ options: opts, resourceLabel: 'Webhook', columns: COLUMNS },
			() =>
				listWebhooks({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = webhooks
		.command('get <id>')
		.description('Retrieve a single webhook by its ID')
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
			{ options: opts, resourceLabel: 'Webhook', columns: COLUMNS },
			() =>
				getWebhook(id, {
					include: include as any
				})
		)
	})

	// ── create ──────────────────────────────────────────────────────────
	const createCmd = webhooks
		.command('create')
		.description('Create a new webhook')
		.requiredOption('--store-id <id>', 'Store ID (required)')
		.requiredOption('--url <url>', 'Webhook endpoint URL (required)')
		.requiredOption(
			'--secret <secret>',
			'Signing secret for request verification (required)'
		)
		.requiredOption(
			'--events <events>',
			'Comma-separated list of event types to subscribe to (required)'
		)
		.option('--test-mode', 'Create webhook in test mode')
		.addHelpText(
			'after',
			`
Common events: order_created, order_refunded, subscription_created,
subscription_updated, subscription_cancelled, subscription_payment_success,
subscription_payment_failed, license_key_created, license_key_updated

Examples:
  $ lmsq webhooks create --store-id 1 --url https://example.com/webhook --secret s3cret --events order_created,subscription_created
  $ lmsq webhooks create --store-id 1 --url https://example.com/webhook --secret s3cret --events order_created --test-mode`
		)

	addGetOutputOptions(createCmd)
	addGlobalOutputOptions(createCmd)

	createCmd.action(async (opts: Record<string, unknown>) => {
		const storeId = opts.storeId as string
		const events = parseCommaSeparated(opts.events as string)

		const webhook: {
			url: string
			events: string[]
			secret: string
			testMode?: boolean
		} = {
			url: opts.url as string,
			events,
			secret: opts.secret as string
		}

		if (opts.testMode === true) {
			webhook.testMode = true
		}

		await handleAction(
			{ options: opts, resourceLabel: 'Webhook', columns: COLUMNS },
			() => createWebhook(storeId, webhook as any)
		)
	})

	// ── update ──────────────────────────────────────────────────────────
	const updateCmd = webhooks
		.command('update <id>')
		.description("Update a webhook's URL, secret, or subscribed events")
		.option('--url <url>', 'New webhook endpoint URL')
		.option('--secret <secret>', 'New signing secret')
		.option(
			'--events <events>',
			'Comma-separated list of event types to subscribe to'
		)

	addGetOutputOptions(updateCmd)
	addGlobalOutputOptions(updateCmd)

	updateCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const updateData: Record<string, unknown> = {}

		if (opts.url !== undefined) {
			updateData.url = opts.url as string
		}
		if (opts.secret !== undefined) {
			updateData.secret = opts.secret as string
		}
		if (opts.events !== undefined) {
			updateData.events = parseCommaSeparated(opts.events as string)
		}

		await handleAction(
			{ options: opts, resourceLabel: 'Webhook', columns: COLUMNS },
			() => updateWebhook(id, updateData as any)
		)
	})

	// ── delete ──────────────────────────────────────────────────────────
	const deleteCmd = webhooks
		.command('delete <id>')
		.description('Delete a webhook by its ID')

	addGlobalOutputOptions(deleteCmd)

	deleteCmd.action(async (id: string, opts: Record<string, unknown>) => {
		await handleAction(
			{ options: opts, resourceLabel: 'Webhook', columns: COLUMNS },
			() => deleteWebhook(id) as any,
			'Webhook deleted.'
		)
	})
}
