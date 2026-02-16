import { describe, expect, test } from 'bun:test'
import {
	type CliError,
	EXIT_CODES,
	formatErrorAsJson,
	formatErrorAsText,
	getExitCode
} from '../src/errors.ts'

describe('formatErrorAsText', () => {
	test('produces compact key: value lines', () => {
		const err: CliError = {
			error: 'not_found',
			message: 'Order not found',
			status: 404
		}
		const result = formatErrorAsText(err)
		const lines = result.split('\n')
		expect(lines).toContain('error: not_found')
		expect(lines).toContain('message: Order not found')
		expect(lines).toContain('status: 404')
	})

	test('contains no ANSI color codes', () => {
		const err: CliError = {
			error: 'not_found',
			message: 'Order not found',
			status: 404
		}
		const result = formatErrorAsText(err)
		// biome-ignore lint/suspicious/noControlCharactersInRegex: testing ANSI escape codes
		expect(result).not.toMatch(/\x1b\[/)
	})

	test('contains no decorative characters', () => {
		const err: CliError = {
			error: 'not_found',
			message: 'Order not found',
			status: 404
		}
		const result = formatErrorAsText(err)
		expect(result).not.toContain('✖')
		expect(result).not.toContain('═')
		expect(result).not.toContain('→')
	})

	test('omits status line when status is undefined', () => {
		const err: CliError = {
			error: 'auth_error',
			message: 'No API key configured'
		}
		const result = formatErrorAsText(err)
		expect(result).not.toContain('status:')
	})

	test('includes field names when present', () => {
		const err: CliError = {
			error: 'validation_error',
			message: 'Validation failed',
			status: 422,
			fields: ['name', 'email']
		}
		const result = formatErrorAsText(err)
		expect(result).toContain('fields: name, email')
	})
})

describe('formatErrorAsJson', () => {
	test('produces valid JSON', () => {
		const err: CliError = {
			error: 'not_found',
			message: 'Order not found',
			status: 404
		}
		const result = formatErrorAsJson(err)
		const parsed = JSON.parse(result)
		expect(parsed.error).toBe('not_found')
		expect(parsed.message).toBe('Order not found')
		expect(parsed.status).toBe(404)
	})

	test('omits undefined fields from JSON', () => {
		const err: CliError = { error: 'auth_error', message: 'No API key' }
		const result = formatErrorAsJson(err)
		const parsed = JSON.parse(result)
		expect(parsed).not.toHaveProperty('status')
		expect(parsed).not.toHaveProperty('fields')
	})
})

describe('getExitCode', () => {
	test('returns API_ERROR for 4xx/5xx status codes', () => {
		expect(
			getExitCode({ error: 'not_found', message: '', status: 404 })
		).toBe(EXIT_CODES.API_ERROR)
		expect(
			getExitCode({ error: 'server_error', message: '', status: 500 })
		).toBe(EXIT_CODES.API_ERROR)
		expect(
			getExitCode({ error: 'rate_limited', message: '', status: 429 })
		).toBe(EXIT_CODES.API_ERROR)
	})

	test('returns AUTH_ERROR for auth-related errors', () => {
		expect(
			getExitCode({ error: 'auth_error', message: '', status: 401 })
		).toBe(EXIT_CODES.AUTH_ERROR)
		expect(getExitCode({ error: 'auth_error', message: '' })).toBe(
			EXIT_CODES.AUTH_ERROR
		)
	})

	test('returns INVALID_USAGE for validation errors', () => {
		expect(getExitCode({ error: 'invalid_usage', message: '' })).toBe(
			EXIT_CODES.INVALID_USAGE
		)
	})

	test('returns NETWORK_ERROR for network errors', () => {
		expect(getExitCode({ error: 'network_error', message: '' })).toBe(
			EXIT_CODES.NETWORK_ERROR
		)
	})

	test('defaults to API_ERROR for unknown error types', () => {
		expect(getExitCode({ error: 'unknown', message: '' })).toBe(
			EXIT_CODES.API_ERROR
		)
	})
})

describe('EXIT_CODES', () => {
	test('has distinct values', () => {
		const values = Object.values(EXIT_CODES)
		const unique = new Set(values)
		expect(unique.size).toBe(values.length)
	})

	test('SUCCESS is 0', () => {
		expect(EXIT_CODES.SUCCESS).toBe(0)
	})
})
