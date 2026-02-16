import { describe, expect, test } from 'bun:test'
import {
	flattenListResponse,
	flattenResource
} from '../../src/formatters/json.ts'
import {
	orderList,
	singleOrder,
	singleSubscription
} from '../fixtures/api-responses.ts'

describe('flattenResource', () => {
	test('promotes data.attributes to top-level with id and type', () => {
		const result = flattenResource(singleOrder)
		expect(result.id).toBe('12345')
		expect(result.type).toBe('orders')
		expect(result.status).toBe('paid')
		expect(result.total).toBe(4900)
		expect(result.user_email).toBe('alice@example.com')
	})

	test('strips jsonapi, links, and relationships wrappers', () => {
		const result = flattenResource(singleOrder)
		expect(result).not.toHaveProperty('jsonapi')
		expect(result).not.toHaveProperty('links')
		expect(result).not.toHaveProperty('relationships')
		expect(result).not.toHaveProperty('data')
	})

	test('preserves nested attribute objects as-is', () => {
		const result = flattenResource(singleOrder)
		expect(result.first_order_item).toEqual({
			id: 1,
			order_id: 12345,
			product_id: 1,
			variant_id: 1,
			product_name: 'Pro Plan',
			variant_name: 'Monthly',
			price: 4900,
			quantity: 1,
			created_at: '2025-01-15T14:30:00.000000Z',
			updated_at: '2025-01-15T14:30:00.000000Z'
		})
	})

	test('preserves null attribute values', () => {
		const result = flattenResource(singleSubscription)
		expect(result.pause).toBeNull()
		expect(result.trial_ends_at).toBeNull()
		expect(result.ends_at).toBeNull()
	})

	test('works when outer wrapper has no jsonapi/links keys', () => {
		const result = flattenResource(singleSubscription)
		expect(result.id).toBe('456')
		expect(result.type).toBe('subscriptions')
		expect(result.status).toBe('active')
	})
})

describe('flattenListResponse', () => {
	test('flattens each item in data array', () => {
		const result = flattenListResponse(orderList)
		expect(result.data).toHaveLength(2)
		expect(result.data[0]?.id).toBe('12345')
		expect(result.data[0]?.status).toBe('paid')
		expect(result.data[0]?.total).toBe(4900)
		expect(result.data[1]?.id).toBe('12346')
		expect(result.data[1]?.status).toBe('refunded')
	})

	test('strips relationships and links from each item', () => {
		const result = flattenListResponse(orderList)
		for (const item of result.data) {
			expect(item).not.toHaveProperty('relationships')
			expect(item).not.toHaveProperty('links')
			expect(item).not.toHaveProperty('attributes')
		}
	})

	test('produces simplified pagination meta', () => {
		const result = flattenListResponse(orderList)
		expect(result.meta).toEqual({
			total: 47,
			page: 1,
			pageSize: 5,
			pageCount: 10
		})
	})

	test('strips top-level jsonapi and links from list response', () => {
		const result = flattenListResponse(orderList)
		expect(result).not.toHaveProperty('jsonapi')
		expect(result).not.toHaveProperty('links')
	})
})
