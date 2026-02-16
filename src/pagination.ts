/**
 * Shared pagination option helpers for Commander commands.
 */

import type { Command } from 'commander'

/**
 * Add standard pagination options to a list command.
 */
export function addPaginationOptions(cmd: Command): Command {
	return cmd
		.option('-p, --page <number>', 'Page number (default: 1)')
		.option(
			'-s, --page-size <number>',
			'Results per page (default: 5, max: 100)'
		)
}

/**
 * Add standard list output options (--only-ids, --count, --first).
 */
export function addListOutputOptions(cmd: Command): Command {
	return cmd
		.option('--only-ids', 'Output only resource IDs, one per line')
		.option('--count', 'Output only the total count of matching resources')
		.option('--first', 'Return only the first result')
}

/**
 * Add standard get output options (--pluck).
 */
export function addGetOutputOptions(cmd: Command): Command {
	return cmd.option(
		'--pluck <field>',
		'Output only the value of a single field'
	)
}

/**
 * Add global output options to any command.
 */
export function addGlobalOutputOptions(cmd: Command): Command {
	return cmd
		.option('-j, --json', 'Output as flattened, clean JSON')
		.option('--json-raw', 'Output the full, unmodified API response')
		.option(
			'-f, --fields <list>',
			'Comma-separated list of fields to include'
		)
		.option('--color', 'Force color output')
		.option('--no-color', 'Disable color output')
		.option('--api-key <key>', 'Override the stored/env API key')
}
