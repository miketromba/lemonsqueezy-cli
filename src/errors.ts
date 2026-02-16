/**
 * Error handling and formatting, mode-aware.
 *
 * Produces compact `key: value` errors for text/non-TTY mode
 * and decorated errors for pretty/TTY mode.
 */

export interface CliError {
	error: string
	message: string
	status?: number
	fields?: string[]
}

export const EXIT_CODES = {
	SUCCESS: 0,
	API_ERROR: 1,
	INVALID_USAGE: 2,
	AUTH_ERROR: 3,
	NETWORK_ERROR: 4
} as const

/**
 * Format an error for text mode (non-TTY / AI agents).
 * Returns compact `key: value` lines.
 */
export function formatErrorAsText(error: CliError): string {
	const lines: string[] = [
		`error: ${error.error}`,
		`message: ${error.message}`
	]
	if (error.status !== undefined) {
		lines.push(`status: ${error.status}`)
	}
	if (error.fields && error.fields.length > 0) {
		lines.push(`fields: ${error.fields.join(', ')}`)
	}
	return lines.join('\n')
}

/**
 * Format an error for JSON mode.
 * Returns a JSON string.
 */
export function formatErrorAsJson(error: CliError): string {
	const obj: Record<string, unknown> = {
		error: error.error,
		message: error.message
	}
	if (error.status !== undefined) {
		obj.status = error.status
	}
	if (error.fields && error.fields.length > 0) {
		obj.fields = error.fields
	}
	return JSON.stringify(obj, null, 2)
}

/**
 * Determine the exit code for a given error.
 */
export function getExitCode(error: CliError): number {
	if (error.error === 'auth_error' || error.status === 401) {
		return EXIT_CODES.AUTH_ERROR
	}
	if (error.error === 'network_error') {
		return EXIT_CODES.NETWORK_ERROR
	}
	if (error.error === 'invalid_usage') {
		return EXIT_CODES.INVALID_USAGE
	}
	return EXIT_CODES.API_ERROR
}
