/**
 * License commands: activate, validate, deactivate.
 *
 * These use the public License API — no authentication required.
 * The response shape differs from standard JSON:API responses.
 */

import {
	activateLicense,
	deactivateLicense,
	validateLicense
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { type CliError, getExitCode } from '../errors.ts'
import { parseCommaSeparated } from '../helpers.ts'
import {
	type OutputOptions,
	outputError,
	outputResource,
	resolveOutputMode
} from '../output.ts'
import { addGetOutputOptions, addGlobalOutputOptions } from '../pagination.ts'

function extractOutputOptions(opts: Record<string, unknown>): OutputOptions {
	return {
		json: opts.json as boolean | undefined,
		jsonRaw: opts.jsonRaw as boolean | undefined,
		fields: opts.fields
			? parseCommaSeparated(opts.fields as string)
			: undefined,
		pluck: opts.pluck as string | undefined,
		color: opts.color as boolean | undefined,
		noColor: opts.noColor as boolean | undefined
	}
}

function buildLicenseOutput(
	result: { data: unknown; error: unknown },
	statusField: string
): Record<string, unknown> | null {
	if (result.error) return null

	const data = result.data as Record<string, unknown>
	const flat: Record<string, unknown> = {}

	flat[statusField] = data[statusField]

	if (data.error !== undefined && data.error !== null) {
		flat.error = data.error
	}

	if (data.license_key) {
		const lk = data.license_key as Record<string, unknown>
		flat.license_key_id = lk.id
		flat.license_key_status = lk.status
		flat.license_key = lk.key
		flat.activation_limit = lk.activation_limit
		flat.activation_usage = lk.activation_usage
		flat.license_key_expires_at = lk.expires_at
	}

	if (data.instance) {
		const inst = data.instance as Record<string, unknown>
		flat.instance_id = inst.id
		flat.instance_name = inst.name
		flat.instance_created_at = inst.created_at
	}

	if (data.meta) {
		const meta = data.meta as Record<string, unknown>
		flat.store_id = meta.store_id
		flat.product_id = meta.product_id
		flat.product_name = meta.product_name
		flat.variant_id = meta.variant_id
		flat.variant_name = meta.variant_name
		flat.customer_id = meta.customer_id
		flat.customer_name = meta.customer_name
		flat.customer_email = meta.customer_email
	}

	return flat
}

export function registerLicenseCommands(program: Command): void {
	const licenses = program
		.command('licenses')
		.description(
			'Activate, validate, and deactivate license keys (public API — no authentication required)'
		)
		.addHelpText(
			'after',
			`
These commands use the public License API and do not require authentication.
They are intended for end-user license validation in your application.

Examples:
  $ lmsq licenses activate --key XXXXX-XXXXX-XXXXX --instance-name "my-server"
  $ lmsq licenses validate --key XXXXX-XXXXX-XXXXX
  $ lmsq licenses deactivate --key XXXXX-XXXXX-XXXXX --instance-id abc123`
		)

	// ── activate ────────────────────────────────────────────────────────
	const activateCmd = licenses
		.command('activate')
		.description('Activate a license key for a new instance')
		.requiredOption(
			'--key <license-key>',
			'License key to activate (required)'
		)
		.requiredOption(
			'--instance-name <name>',
			'Label for the new instance (required)'
		)
		.addHelpText(
			'after',
			`
Example:
  $ lmsq licenses activate --key XXXXX-XXXXX-XXXXX --instance-name "my-server"`
		)

	addGetOutputOptions(activateCmd)
	addGlobalOutputOptions(activateCmd)

	activateCmd.action(async (opts: Record<string, unknown>) => {
		const outputOpts = extractOutputOptions(opts)
		const mode = resolveOutputMode(outputOpts)

		try {
			const result = await activateLicense(
				opts.key as string,
				opts.instanceName as string
			)

			if (result.error) {
				const err = result.error as {
					message?: string
					status?: number
				}
				const cliError: CliError = {
					error: 'api_error',
					message: err.message ?? 'Unknown error',
					status: err.status
				}
				process.stderr.write(`${outputError(cliError, mode)}\n`)
				process.exit(getExitCode(cliError))
			}

			const flat = buildLicenseOutput(result, 'activated')
			if (flat) {
				const wrapped = { data: flat }
				process.stdout.write(
					`${outputResource(wrapped, mode, 'License', outputOpts)}\n`
				)
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			const cliError: CliError = {
				error: 'network_error',
				message
			}
			process.stderr.write(`${outputError(cliError, mode)}\n`)
			process.exit(getExitCode(cliError))
		}
	})

	// ── validate ────────────────────────────────────────────────────────
	const validateCmd = licenses
		.command('validate')
		.description('Validate a license key or license key instance')
		.requiredOption(
			'--key <license-key>',
			'License key to validate (required)'
		)
		.option(
			'--instance-id <id>',
			'Instance ID to validate (omit to validate the key itself)'
		)
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq licenses validate --key XXXXX-XXXXX-XXXXX
  $ lmsq licenses validate --key XXXXX-XXXXX-XXXXX --instance-id abc123`
		)

	addGetOutputOptions(validateCmd)
	addGlobalOutputOptions(validateCmd)

	validateCmd.action(async (opts: Record<string, unknown>) => {
		const outputOpts = extractOutputOptions(opts)
		const mode = resolveOutputMode(outputOpts)

		try {
			const result = await validateLicense(
				opts.key as string,
				opts.instanceId as string | undefined
			)

			if (result.error) {
				const err = result.error as {
					message?: string
					status?: number
				}
				const cliError: CliError = {
					error: 'api_error',
					message: err.message ?? 'Unknown error',
					status: err.status
				}
				process.stderr.write(`${outputError(cliError, mode)}\n`)
				process.exit(getExitCode(cliError))
			}

			const flat = buildLicenseOutput(result, 'valid')
			if (flat) {
				const wrapped = { data: flat }
				process.stdout.write(
					`${outputResource(wrapped, mode, 'License', outputOpts)}\n`
				)
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			const cliError: CliError = {
				error: 'network_error',
				message
			}
			process.stderr.write(`${outputError(cliError, mode)}\n`)
			process.exit(getExitCode(cliError))
		}
	})

	// ── deactivate ──────────────────────────────────────────────────────
	const deactivateCmd = licenses
		.command('deactivate')
		.description('Deactivate a license key instance')
		.requiredOption(
			'--key <license-key>',
			'License key to deactivate (required)'
		)
		.requiredOption(
			'--instance-id <id>',
			'Instance ID to deactivate (required)'
		)
		.addHelpText(
			'after',
			`
Example:
  $ lmsq licenses deactivate --key XXXXX-XXXXX-XXXXX --instance-id abc123`
		)

	addGetOutputOptions(deactivateCmd)
	addGlobalOutputOptions(deactivateCmd)

	deactivateCmd.action(async (opts: Record<string, unknown>) => {
		const outputOpts = extractOutputOptions(opts)
		const mode = resolveOutputMode(outputOpts)

		try {
			const result = await deactivateLicense(
				opts.key as string,
				opts.instanceId as string
			)

			if (result.error) {
				const err = result.error as {
					message?: string
					status?: number
				}
				const cliError: CliError = {
					error: 'api_error',
					message: err.message ?? 'Unknown error',
					status: err.status
				}
				process.stderr.write(`${outputError(cliError, mode)}\n`)
				process.exit(getExitCode(cliError))
			}

			const flat = buildLicenseOutput(result, 'deactivated')
			if (flat) {
				const wrapped = { data: flat }
				process.stdout.write(
					`${outputResource(wrapped, mode, 'License', outputOpts)}\n`
				)
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			const cliError: CliError = {
				error: 'network_error',
				message
			}
			process.stderr.write(`${outputError(cliError, mode)}\n`)
			process.exit(getExitCode(cliError))
		}
	})
}
