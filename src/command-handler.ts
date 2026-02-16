/**
 * Shared command handler that wraps SDK/API calls with output formatting
 * and error handling. Every command delegates to this.
 */

import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js'
import { getApiKey } from './config.ts'
import { type CliError, getExitCode } from './errors.ts'
import { buildPage, parseCommaSeparated } from './helpers.ts'
import {
	type OutputOptions,
	outputError,
	outputList,
	outputResource,
	resolveOutputMode
} from './output.ts'

export interface CommandContext {
	options: Record<string, unknown>
	resourceLabel: string
	columns: { key: string; label: string; width?: number }[]
}

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

export function setupSdk(opts: Record<string, unknown>): void {
	const apiKey = getApiKey(opts.apiKey as string | undefined)
	lemonSqueezySetup({ apiKey, onError: () => {} })
}

export function getPageParams(opts: Record<string, unknown>) {
	const pageSize = opts.first ? '1' : (opts.pageSize as string | undefined)
	return buildPage(opts.page as string | undefined, pageSize)
}

export async function handleGet(
	ctx: CommandContext,
	apiFn: () => Promise<{ data: unknown; error: unknown }>
): Promise<void> {
	const outputOpts = extractOutputOptions(ctx.options)
	const mode = resolveOutputMode(outputOpts)

	try {
		setupSdk(ctx.options)
		const result = await apiFn()

		if (result.error) {
			const err = result.error as { message?: string; status?: number }
			const cliError: CliError = {
				error: 'api_error',
				message: err.message ?? 'Unknown error',
				status: err.status
			}
			process.stderr.write(`${outputError(cliError, mode)}\n`)
			process.exit(getExitCode(cliError))
		}

		process.stdout.write(
			`${outputResource(result, mode, ctx.resourceLabel, outputOpts)}\n`
		)
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		const isAuth = message.includes('API key') || message.includes('auth')
		const cliError: CliError = {
			error: isAuth ? 'auth_error' : 'network_error',
			message
		}
		process.stderr.write(`${outputError(cliError, mode)}\n`)
		process.exit(getExitCode(cliError))
	}
}

export async function handleList(
	ctx: CommandContext,
	apiFn: () => Promise<{ data: unknown; error: unknown }>
): Promise<void> {
	const outputOpts = extractOutputOptions(ctx.options)
	const mode = resolveOutputMode(outputOpts)

	try {
		setupSdk(ctx.options)
		const result = await apiFn()

		if (result.error) {
			const err = result.error as { message?: string; status?: number }
			const cliError: CliError = {
				error: 'api_error',
				message: err.message ?? 'Unknown error',
				status: err.status
			}
			process.stderr.write(`${outputError(cliError, mode)}\n`)
			process.exit(getExitCode(cliError))
		}

		process.stdout.write(
			`${outputList(result, mode, ctx.columns, outputOpts)}\n`
		)
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		const isAuth = message.includes('API key') || message.includes('auth')
		const cliError: CliError = {
			error: isAuth ? 'auth_error' : 'network_error',
			message
		}
		process.stderr.write(`${outputError(cliError, mode)}\n`)
		process.exit(getExitCode(cliError))
	}
}

export async function handleAction(
	ctx: CommandContext,
	apiFn: () => Promise<{ data: unknown; error: unknown }>,
	successMessage?: string
): Promise<void> {
	const outputOpts = extractOutputOptions(ctx.options)
	const mode = resolveOutputMode(outputOpts)

	try {
		setupSdk(ctx.options)
		const result = await apiFn()

		if (result.error) {
			const err = result.error as { message?: string; status?: number }
			const cliError: CliError = {
				error: 'api_error',
				message: err.message ?? 'Unknown error',
				status: err.status
			}
			process.stderr.write(`${outputError(cliError, mode)}\n`)
			process.exit(getExitCode(cliError))
		}

		if (result.data === null && successMessage) {
			process.stdout.write(`${successMessage}\n`)
			return
		}

		if (result.data !== null) {
			process.stdout.write(
				outputResource(result, mode, ctx.resourceLabel, outputOpts) +
					'\n'
			)
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e)
		const isAuth = message.includes('API key') || message.includes('auth')
		const cliError: CliError = {
			error: isAuth ? 'auth_error' : 'network_error',
			message
		}
		process.stderr.write(`${outputError(cliError, mode)}\n`)
		process.exit(getExitCode(cliError))
	}
}
