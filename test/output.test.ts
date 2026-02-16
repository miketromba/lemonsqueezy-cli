/**
 * Integration tests for output.ts — the layer between SDK responses and formatters.
 *
 * These tests use SDK-wrapped fixtures ({ data, error }) to verify the full
 * pipeline from SDK response → output function → formatted string.
 * A gap here is exactly what caused Bug #2: the formatters received the SDK
 * wrapper instead of the unwrapped JSON:API body, so meta.page was undefined.
 */

import { describe, expect, test } from 'bun:test'
import { outputList, outputResource } from '../src/output.ts'
import {
	orderList,
	singleOrder,
	singleSubscription
} from './fixtures/api-responses.ts'

const COLUMNS = [
	{ key: 'status', label: 'Status' },
	{ key: 'total', label: 'Total' }
]

describe('outputResource', () => {
	test('json mode produces flattened JSON from a JSON:API single response', () => {
		const result = outputResource(singleOrder, 'json', 'Order')
		const parsed = JSON.parse(result)
		expect(parsed.id).toBe('12345')
		expect(parsed.type).toBe('orders')
		expect(parsed.status).toBe('paid')
		expect(parsed).not.toHaveProperty('data')
		expect(parsed).not.toHaveProperty('jsonapi')
	})

	test('json-raw mode passes through the full JSON:API body', () => {
		const result = outputResource(singleOrder, 'json-raw', 'Order')
		const parsed = JSON.parse(result)
		expect(parsed.data).toBeDefined()
		expect(parsed.data.id).toBe('12345')
		expect(parsed.data.attributes.status).toBe('paid')
	})

	test('text mode produces key: value lines', () => {
		const result = outputResource(singleOrder, 'text', 'Order')
		expect(result).toContain('id: 12345')
		expect(result).toContain('status: paid')
	})

	test('json mode with --fields selects only requested fields', () => {
		const result = outputResource(singleOrder, 'json', 'Order', {
			fields: ['status', 'total']
		})
		const parsed = JSON.parse(result)
		expect(parsed.id).toBe('12345')
		expect(parsed.status).toBe('paid')
		expect(parsed.total).toBe(4900)
		expect(parsed).not.toHaveProperty('user_email')
	})

	test('json mode with --pluck returns a single value', () => {
		const result = outputResource(singleOrder, 'json', 'Order', {
			pluck: 'status'
		})
		expect(JSON.parse(result)).toBe('paid')
	})

	test('works with subscriptions (no jsonapi/links wrapper)', () => {
		const result = outputResource(
			singleSubscription,
			'json',
			'Subscription'
		)
		const parsed = JSON.parse(result)
		expect(parsed.id).toBe('456')
		expect(parsed.status).toBe('active')
	})
})

describe('outputList', () => {
	test('json mode produces flattened data array with pagination meta', () => {
		const result = outputList(orderList, 'json', COLUMNS)
		const parsed = JSON.parse(result)
		expect(parsed.data).toBeArray()
		expect(parsed.data).toHaveLength(2)
		expect(parsed.data[0].id).toBe('12345')
		expect(parsed.data[0].status).toBe('paid')
		expect(parsed.meta).toEqual({
			total: 47,
			page: 1,
			pageSize: 5,
			pageCount: 10
		})
	})

	test('json-raw mode passes through the full JSON:API body', () => {
		const result = outputList(orderList, 'json-raw', COLUMNS)
		const parsed = JSON.parse(result)
		expect(parsed.meta.page.currentPage).toBe(1)
		expect(parsed.data).toBeArray()
		expect(parsed.data[0].attributes).toBeDefined()
	})

	test('text mode produces key: value lines with pagination footer', () => {
		const result = outputList(orderList, 'text', COLUMNS)
		expect(result).toContain('id: 12345')
		expect(result).toContain('status: paid')
		expect(result).toContain('[page 1/10, 47 total]')
	})

	test('json mode with --count returns total count', () => {
		const result = outputList(orderList, 'json', COLUMNS, { count: true })
		const parsed = JSON.parse(result)
		expect(parsed).toEqual({ count: 47 })
	})

	test('json mode with --only-ids returns id array', () => {
		const result = outputList(orderList, 'json', COLUMNS, { onlyIds: true })
		const parsed = JSON.parse(result)
		expect(parsed.ids).toEqual(['12345', '12346'])
		expect(parsed.meta.total).toBe(47)
	})

	test('json mode with --fields selects only requested fields', () => {
		const result = outputList(orderList, 'json', COLUMNS, {
			fields: ['status']
		})
		const parsed = JSON.parse(result)
		expect(parsed.data[0]).toEqual({ id: '12345', status: 'paid' })
		expect(parsed.data[0]).not.toHaveProperty('total')
	})
})
