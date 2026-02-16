/**
 * License Key Instance commands: list, get.
 */

import {
	getLicenseKeyInstance,
	listLicenseKeyInstances
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { getPageParams, handleGet, handleList } from '../command-handler.ts'
import { buildFilter, buildInclude } from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['license-key']

const COLUMNS = [
	{ key: 'license_key_id', label: 'License Key ID' },
	{ key: 'identifier', label: 'Identifier' },
	{ key: 'name', label: 'Name' }
]

export function registerLicenseKeyInstanceCommands(program: Command): void {
	const instances = program
		.command('license-key-instances')
		.description('Manage Lemon Squeezy license key instances')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq license-key-instances list --license-key-id 456
  $ lmsq license-key-instances get 789`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = instances
		.command('list')
		.description(
			'List license key instances, optionally filtered by license key'
		)
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--license-key-id <id>', 'Filter by license key ID')

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
			licenseKeyId: opts.licenseKeyId as string | undefined
		})

		await handleList(
			{
				options: opts,
				resourceLabel: 'License Key Instance',
				columns: COLUMNS
			},
			() =>
				listLicenseKeyInstances({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = instances
		.command('get <id>')
		.description('Retrieve a single license key instance by its ID')
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
				resourceLabel: 'License Key Instance',
				columns: COLUMNS
			},
			() =>
				getLicenseKeyInstance(id, {
					include: include as any
				})
		)
	})
}
