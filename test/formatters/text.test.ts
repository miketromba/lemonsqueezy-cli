import { describe, expect, test } from 'bun:test'
import {
	formatCountAsText,
	formatIdsAsText,
	formatListAsText,
	formatPluckAsText,
	formatResourceAsText
} from '../../src/formatters/text.ts'

describe('formatResourceAsText', () => {
	const resource = {
		id: '12345',
		type: 'orders',
		status: 'paid',
		user_email: 'alice@example.com',
		total: 4900,
		created_at: '2025-01-15T14:30:00.000000Z'
	}

	test('produces key: value lines for all fields', () => {
		const result = formatResourceAsText(resource)
		const lines = result.split('\n')
		expect(lines).toContain('id: 12345')
		expect(lines).toContain('type: orders')
		expect(lines).toContain('status: paid')
		expect(lines).toContain('user_email: alice@example.com')
		expect(lines).toContain('total: 4900')
		expect(lines).toContain('created_at: 2025-01-15T14:30:00.000000Z')
	})

	test('contains no ANSI color codes', () => {
		const result = formatResourceAsText(resource)
		// biome-ignore lint/suspicious/noControlCharactersInRegex: testing ANSI escape codes
		expect(result).not.toMatch(/\x1b\[/)
	})

	test('contains no decorative characters', () => {
		const result = formatResourceAsText(resource)
		expect(result).not.toContain('═')
		expect(result).not.toContain('─')
		expect(result).not.toContain('→')
		expect(result).not.toContain('✖')
	})

	test('with --fields, only includes id and selected fields', () => {
		const result = formatResourceAsText(resource, {
			fields: ['status', 'total']
		})
		const lines = result.split('\n').filter(l => l.length > 0)
		expect(lines).toHaveLength(3) // id + status + total
		expect(lines).toContain('id: 12345')
		expect(lines).toContain('status: paid')
		expect(lines).toContain('total: 4900')
	})

	test('with --fields, id is always included even if not requested', () => {
		const result = formatResourceAsText(resource, { fields: ['status'] })
		expect(result).toContain('id: 12345')
		expect(result).toContain('status: paid')
	})

	test('handles null values', () => {
		const result = formatResourceAsText({ id: '1', pause: null })
		expect(result).toContain('pause: null')
	})

	test('handles boolean values', () => {
		const result = formatResourceAsText({
			id: '1',
			cancelled: false,
			test_mode: true
		})
		expect(result).toContain('cancelled: false')
		expect(result).toContain('test_mode: true')
	})
})

describe('formatListAsText', () => {
	const resources = [
		{ id: '12345', status: 'paid', total: 4900 },
		{ id: '12346', status: 'refunded', total: 2900 }
	]
	const pagination = { page: 1, pageCount: 10, total: 47 }

	test('separates resources with blank lines', () => {
		const result = formatListAsText(resources, pagination)
		expect(result).toContain('id: 12345')
		expect(result).toContain('id: 12346')
		// Should have a blank line between resources
		expect(result).toContain('total: 4900\n\nid: 12346')
	})

	test('ends with pagination footer', () => {
		const result = formatListAsText(resources, pagination)
		expect(result).toContain('[page 1/10, 47 total]')
	})

	test('with --fields, filters each resource', () => {
		const result = formatListAsText(resources, pagination, {
			fields: ['status']
		})
		expect(result).toContain('id: 12345')
		expect(result).toContain('status: paid')
		expect(result).not.toContain('total: 4900')
	})

	test('single-page results still show pagination footer', () => {
		const result = formatListAsText(resources, {
			page: 1,
			pageCount: 1,
			total: 2
		})
		expect(result).toContain('[page 1/1, 2 total]')
	})
})

describe('formatIdsAsText', () => {
	test('outputs one ID per line with total footer', () => {
		const result = formatIdsAsText(['12345', '12346', '12347'], 47)
		expect(result).toBe('12345\n12346\n12347\n[47 total]')
	})

	test('works with a single ID', () => {
		const result = formatIdsAsText(['12345'], 1)
		expect(result).toBe('12345\n[1 total]')
	})
})

describe('formatCountAsText', () => {
	test('outputs just the number', () => {
		expect(formatCountAsText(47)).toBe('47')
	})

	test('outputs zero', () => {
		expect(formatCountAsText(0)).toBe('0')
	})
})

describe('formatPluckAsText', () => {
	test('outputs a string value bare', () => {
		expect(formatPluckAsText('active')).toBe('active')
	})

	test('outputs a number value bare', () => {
		expect(formatPluckAsText(4900)).toBe('4900')
	})

	test('outputs null as the string null', () => {
		expect(formatPluckAsText(null)).toBe('null')
	})

	test('outputs boolean values', () => {
		expect(formatPluckAsText(true)).toBe('true')
		expect(formatPluckAsText(false)).toBe('false')
	})
})
