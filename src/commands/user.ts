/**
 * User command — retrieves the authenticated user profile.
 *
 * This is a top-level command with no subcommands.
 */

import { getAuthenticatedUser } from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import { handleGet } from '../command-handler.ts'
import { addGetOutputOptions, addGlobalOutputOptions } from '../pagination.ts'

export function registerUserCommands(program: Command): void {
	const cmd = program
		.command('user')
		.description('Show the currently authenticated Lemon Squeezy user')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq user
  $ lmsq user --json
  $ lmsq user --pluck email`
		)

	addGetOutputOptions(cmd)
	addGlobalOutputOptions(cmd)

	cmd.action(async (opts: Record<string, unknown>) => {
		await handleGet(
			{
				options: opts,
				resourceLabel: 'User',
				columns: [
					{ key: 'name', label: 'Name' },
					{ key: 'email', label: 'Email' },
					{ key: 'color', label: 'Color' }
				]
			},
			() => getAuthenticatedUser()
		)
	})
}
