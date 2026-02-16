import { describe, expect, test } from 'bun:test'
import { extractIds, pluckField, selectFields } from '../src/fields.ts'

describe('selectFields', () => {
	const resource = {
		id: '12345',
		type: 'orders',
		status: 'paid',
		user_email: 'alice@example.com',
		total: 4900,
		created_at: '2025-01-15T14:30:00.000000Z'
	}

	test('returns only id and requested fields', () => {
		const result = selectFields(resource, ['status', 'total'])
		expect(result).toEqual({
			id: '12345',
			status: 'paid',
			total: 4900
		})
	})

	test('always includes id even if not in fields list', () => {
		const result = selectFields(resource, ['status'])
		expect(result).toHaveProperty('id')
		expect(result.id).toBe('12345')
	})

	test('includes id even if explicitly listed', () => {
		const result = selectFields(resource, ['id', 'status'])
		expect(result).toEqual({
			id: '12345',
			status: 'paid'
		})
	})

	test('throws on invalid field name', () => {
		expect(() => selectFields(resource, ['nonexistent'])).toThrow()
	})

	test('error message for invalid field lists the valid fields', () => {
		try {
			selectFields(resource, ['nonexistent'])
		} catch (e) {
			const msg = (e as Error).message
			expect(msg).toContain('nonexistent')
			expect(msg).toContain('status')
			expect(msg).toContain('total')
		}
	})

	test('preserves null values in selected fields', () => {
		const result = selectFields(
			{ id: '1', status: 'active', pause: null },
			['pause']
		)
		expect(result).toEqual({ id: '1', pause: null })
	})

	test('with empty fields list, returns only id', () => {
		const result = selectFields(resource, [])
		expect(result).toEqual({ id: '12345' })
	})
})

describe('pluckField', () => {
	const resource = {
		id: '12345',
		status: 'paid',
		total: 4900,
		cancelled: false,
		pause: null
	}

	test('extracts a string field', () => {
		expect(pluckField(resource, 'status')).toBe('paid')
	})

	test('extracts a number field', () => {
		expect(pluckField(resource, 'total')).toBe(4900)
	})

	test('extracts a boolean field', () => {
		expect(pluckField(resource, 'cancelled')).toBe(false)
	})

	test('extracts a null field', () => {
		expect(pluckField(resource, 'pause')).toBeNull()
	})

	test('extracts the id field', () => {
		expect(pluckField(resource, 'id')).toBe('12345')
	})

	test('throws on nonexistent field', () => {
		expect(() => pluckField(resource, 'nonexistent')).toThrow()
	})

	test('error message for nonexistent field lists valid fields', () => {
		try {
			pluckField(resource, 'nonexistent')
		} catch (e) {
			const msg = (e as Error).message
			expect(msg).toContain('nonexistent')
			expect(msg).toContain('status')
		}
	})
})

describe('extractIds', () => {
	test('extracts id from each resource', () => {
		const resources = [
			{ id: '12345', status: 'paid' },
			{ id: '12346', status: 'refunded' },
			{ id: '12347', status: 'paid' }
		]
		expect(extractIds(resources)).toEqual(['12345', '12346', '12347'])
	})

	test('returns empty array for empty list', () => {
		expect(extractIds([])).toEqual([])
	})

	test('converts numeric ids to strings', () => {
		const resources = [{ id: 1 }, { id: 2 }] as unknown as Record<
			string,
			unknown
		>[]
		expect(extractIds(resources)).toEqual(['1', '2'])
	})
})
