/**
 * Customer commands: list, get, create, update, archive.
 */

import {
	archiveCustomer,
	createCustomer,
	getCustomer,
	listCustomers,
	updateCustomer
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

const VALID_INCLUDES = ['store', 'orders', 'subscriptions', 'license-keys']

const COLUMNS = [
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email' },
	{ key: 'status', label: 'Status' },
	{ key: 'city', label: 'City' },
	{ key: 'country', label: 'Country' }
]

export function registerCustomerCommands(program: Command): void {
	const customers = program
		.command('customers')
		.description('Manage Lemon Squeezy customers')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq customers list --store-id 123
  $ lmsq customers list --email jane@example.com
  $ lmsq customers get 456
  $ lmsq customers create --store-id 123 --name "Jane Doe" --email jane@example.com
  $ lmsq customers update 456 --name "Jane Smith"
  $ lmsq customers archive 456`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = customers
		.command('list')
		.description('List customers, optionally filtered by store or email')
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--store-id <id>', 'Filter by store ID')
		.option('--email <email>', 'Filter by customer email address')

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
			email: opts.email as string | undefined
		})
		const page = getPageParams(opts)

		await handleList(
			{ options: opts, resourceLabel: 'Customer', columns: COLUMNS },
			() =>
				listCustomers({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = customers
		.command('get <id>')
		.description('Retrieve a single customer by their ID')
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
			{ options: opts, resourceLabel: 'Customer', columns: COLUMNS },
			() =>
				getCustomer(id, {
					include: include as any
				})
		)
	})

	// ── create ──────────────────────────────────────────────────────────
	const createCmd = customers
		.command('create')
		.description('Create a new customer in a given store')
		.requiredOption('--store-id <id>', 'Store ID to create the customer in')
		.requiredOption('--name <name>', 'Full name of the customer')
		.requiredOption('--email <email>', 'Email address of the customer')
		.option('--city <city>', 'City of the customer')
		.option('--country <country>', 'Two-letter ISO country code')
		.option('--region <region>', 'State or region of the customer')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq customers create --store-id 123 --name "Jane Doe" --email jane@example.com
  $ lmsq customers create --store-id 123 --name "Jane Doe" --email jane@example.com --country US --region CA --city "San Francisco"`
		)

	addGetOutputOptions(createCmd)
	addGlobalOutputOptions(createCmd)

	createCmd.action(async (opts: Record<string, unknown>) => {
		await handleAction(
			{ options: opts, resourceLabel: 'Customer', columns: COLUMNS },
			() =>
				createCustomer(
					opts.storeId as string,
					{
						name: opts.name as string,
						email: opts.email as string,
						city: opts.city as string | undefined,
						country: opts.country as string | undefined,
						region: opts.region as string | undefined
					} as any
				)
		)
	})

	// ── update ──────────────────────────────────────────────────────────
	const updateCmd = customers
		.command('update <id>')
		.description('Update an existing customer by their ID')
		.option('--name <name>', 'Updated full name')
		.option('--email <email>', 'Updated email address')
		.option('--city <city>', 'Updated city')
		.option('--country <country>', 'Updated two-letter ISO country code')
		.option('--region <region>', 'Updated state or region')

	addGetOutputOptions(updateCmd)
	addGlobalOutputOptions(updateCmd)

	updateCmd.action(async (id: string, opts: Record<string, unknown>) => {
		await handleAction(
			{ options: opts, resourceLabel: 'Customer', columns: COLUMNS },
			() =>
				updateCustomer(id, {
					name: opts.name as string | undefined,
					email: opts.email as string | undefined,
					city: opts.city as string | undefined,
					country: opts.country as string | undefined,
					region: opts.region as string | undefined
				} as any)
		)
	})

	// ── archive ─────────────────────────────────────────────────────────
	const archiveCmd = customers
		.command('archive <id>')
		.description('Archive a customer by their ID (soft-delete)')

	addGetOutputOptions(archiveCmd)
	addGlobalOutputOptions(archiveCmd)

	archiveCmd.action(async (id: string, opts: Record<string, unknown>) => {
		await handleAction(
			{ options: opts, resourceLabel: 'Customer', columns: COLUMNS },
			() => archiveCustomer(id),
			`Customer ${id} archived successfully.`
		)
	})
}
