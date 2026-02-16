/**
 * Affiliate commands: list, get.
 *
 * Uses direct API calls because the SDK does not have affiliate support.
 */

import type { Command } from 'commander'
import { getAffiliate, listAffiliates } from '../api.ts'
import { getApiKey } from '../config.ts'
import { type CliError, getExitCode } from '../errors.ts'
import { buildPage, parseCommaSeparated } from '../helpers.ts'
import {
	type OutputOptions,
	outputError,
	outputList,
	outputResource,
	resolveOutputMode
} from '../output.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const COLUMNS = [
	{ key: 'user_name', label: 'User Name' },
	{ key: 'user_email', label: 'User Email' },
	{ key: 'status', label: 'Status' },
	{ key: 'total_earnings', label: 'Total Earnings' }
]

function extractOutputOptions(opts: Record<string, unknown>): OutputOptions {
	return {
		json: opts.json as boolean | undefined,
		jsonRaw: opts.jsonRaw as boolean | undefined,
		fields: opts.fields
			? parseCommaSeparated(opts.fields as string)
			: undefined,
		onlyIds: opts.onlyIds as boolean | undefined,
		count: opts.count as boolean | undefined,
		first: opts.first as boolean | undefined,
		pluck: opts.pluck as string | undefined,
		color: opts.color as boolean | undefined,
		noColor: opts.noColor as boolean | undefined
	}
}

export function registerAffiliateCommands(program: Command): void {
	const affiliates = program
		.command('affiliates')
		.description('Manage Lemon Squeezy affiliates')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq affiliates list --store-id 123
  $ lmsq affiliates get 456`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = affiliates
		.command('list')
		.description(
			'List affiliates, optionally filtered by store or user email'
		)
		.option('--store-id <id>', 'Filter by store ID')
		.option('--user-email <email>', 'Filter by user email')

	addPaginationOptions(listCmd)
	addListOutputOptions(listCmd)
	addGlobalOutputOptions(listCmd)

	listCmd.action(async (opts: Record<string, unknown>) => {
		const outputOpts = extractOutputOptions(opts)
		const mode = resolveOutputMode(outputOpts)

		try {
			const apiKey = getApiKey(opts.apiKey as string | undefined)
			const page = buildPage(
				opts.page as string | undefined,
				opts.first ? '1' : (opts.pageSize as string | undefined)
			)

			const result = await listAffiliates(apiKey, {
				storeId: opts.storeId as string | undefined,
				userEmail: opts.userEmail as string | undefined,
				page: page?.number,
				pageSize: page?.size
			})

			if (result.error) {
				const cliError: CliError = {
					error: 'api_error',
					message: result.error.message,
					status: result.error.status
				}
				process.stderr.write(`${outputError(cliError, mode)}\n`)
				process.exit(getExitCode(cliError))
			}

			process.stdout.write(
				`${outputList(result.data, mode, COLUMNS, outputOpts)}\n`
			)
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			const isAuth =
				message.includes('API key') || message.includes('auth')
			const cliError: CliError = {
				error: isAuth ? 'auth_error' : 'network_error',
				message
			}
			process.stderr.write(`${outputError(cliError, mode)}\n`)
			process.exit(getExitCode(cliError))
		}
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = affiliates
		.command('get <id>')
		.description('Retrieve a single affiliate by its ID')

	addGetOutputOptions(getCmd)
	addGlobalOutputOptions(getCmd)

	getCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const outputOpts = extractOutputOptions(opts)
		const mode = resolveOutputMode(outputOpts)

		try {
			const apiKey = getApiKey(opts.apiKey as string | undefined)
			const result = await getAffiliate(apiKey, id)

			if (result.error) {
				const cliError: CliError = {
					error: 'api_error',
					message: result.error.message,
					status: result.error.status
				}
				process.stderr.write(`${outputError(cliError, mode)}\n`)
				process.exit(getExitCode(cliError))
			}

			process.stdout.write(
				`${outputResource(result.data, mode, 'Affiliate', outputOpts)}\n`
			)
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			const isAuth =
				message.includes('API key') || message.includes('auth')
			const cliError: CliError = {
				error: isAuth ? 'auth_error' : 'network_error',
				message
			}
			process.stderr.write(`${outputError(cliError, mode)}\n`)
			process.exit(getExitCode(cliError))
		}
	})
}
