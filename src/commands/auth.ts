/**
 * Authentication commands: login, logout, status.
 *
 * These are special — they don't go through the shared handleGet/handleList
 * flow because they manage credentials directly rather than fetching resources.
 */

import {
	getAuthenticatedUser,
	lemonSqueezySetup
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import {
	getApiKey,
	getApiKeySource,
	maskKey,
	removeApiKey,
	saveApiKey
} from '../config.ts'

export function registerAuthCommands(program: Command): void {
	const auth = program
		.command('auth')
		.description('Manage API key authentication for Lemon Squeezy')

	// ── login ──────────────────────────────────────────────────────────
	auth.command('login')
		.description(
			'Authenticate with a Lemon Squeezy API key and save it locally'
		)
		.option(
			'-k, --key <api-key>',
			'API key to store (if omitted, you will be prompted)'
		)
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq auth login                              # interactive prompt
  $ lmsq auth login --key lsq_live_xxxxxxxxxxxx  # direct`
		)
		.action(async (opts: { key?: string }) => {
			let apiKey = opts.key

			if (!apiKey) {
				const entered = prompt('Enter your Lemon Squeezy API key:')
				if (!entered) {
					process.stderr.write('No API key provided. Aborting.\n')
					process.exit(1)
				}
				apiKey = entered
			}

			// Validate the key by making an authenticated request
			try {
				lemonSqueezySetup({ apiKey, onError: () => {} })
				const { data, error } = await getAuthenticatedUser()

				if (error) {
					process.stderr.write(
						`Authentication failed: ${(error as { message?: string }).message ?? 'Invalid API key'}\n`
					)
					process.exit(1)
				}

				saveApiKey(apiKey)

				const name =
					(data as { data?: { attributes?: { name?: string } } })
						?.data?.attributes?.name ?? 'Unknown'
				process.stdout.write(
					`Authenticated as ${name}. API key saved to ~/.config/lemonsqueezy-cli/config.json\n`
				)
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e)
				process.stderr.write(`Authentication failed: ${message}\n`)
				process.exit(1)
			}
		})

	// ── logout ─────────────────────────────────────────────────────────
	auth.command('logout')
		.description('Remove the stored API key from local configuration')
		.addHelpText(
			'after',
			`
Example:
  $ lmsq auth logout`
		)
		.action(() => {
			removeApiKey()
			process.stdout.write(
				'API key removed from ~/.config/lemonsqueezy-cli/config.json\n'
			)
		})

	// ── status ─────────────────────────────────────────────────────────
	auth.command('status')
		.description(
			'Show current authentication status, key source, and user info'
		)
		.addHelpText(
			'after',
			`
Example:
  $ lmsq auth status`
		)
		.action(async () => {
			let apiKey: string
			try {
				apiKey = getApiKey()
			} catch {
				process.stdout.write(
					'Not authenticated. Run `lmsq auth login`.\n'
				)
				return
			}

			const source = getApiKeySource()
			process.stdout.write(`API key source: ${source}\n`)
			process.stdout.write(`API key:        ${maskKey(apiKey)}\n`)

			try {
				lemonSqueezySetup({ apiKey, onError: () => {} })
				const { data, error } = await getAuthenticatedUser()

				if (error) {
					process.stderr.write(
						`Could not fetch user info: ${(error as { message?: string }).message ?? 'unknown error'}\n`
					)
					return
				}

				const attrs = (
					data as { data?: { attributes?: Record<string, unknown> } }
				)?.data?.attributes
				if (attrs) {
					process.stdout.write(
						`Name:           ${attrs.name ?? 'N/A'}\n`
					)
					process.stdout.write(
						`Email:          ${attrs.email ?? 'N/A'}\n`
					)
				}
			} catch (e) {
				const message = e instanceof Error ? e.message : String(e)
				process.stderr.write(`Could not fetch user info: ${message}\n`)
			}
		})
}
