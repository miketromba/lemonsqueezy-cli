/**
 * Realistic Lemon Squeezy JSON:API response fixtures for testing.
 * These mirror the actual API response shapes.
 */

export const singleOrder = {
	jsonapi: { version: '1.0' },
	links: { self: 'https://api.lemonsqueezy.com/v1/orders/12345' },
	data: {
		type: 'orders',
		id: '12345',
		attributes: {
			store_id: 1,
			customer_id: 1,
			identifier: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			order_number: 1001,
			user_name: 'Alice Smith',
			user_email: 'alice@example.com',
			currency: 'USD',
			currency_rate: '1.0000',
			subtotal: 4900,
			setup_fee: 0,
			discount_total: 0,
			tax: 0,
			total: 4900,
			refunded_amount: 0,
			subtotal_usd: 4900,
			setup_fee_usd: 0,
			discount_total_usd: 0,
			tax_usd: 0,
			total_usd: 4900,
			refunded_amount_usd: 0,
			tax_name: 'VAT',
			tax_rate: 0,
			tax_inclusive: false,
			status: 'paid',
			status_formatted: 'Paid',
			refunded: false,
			refunded_at: null,
			subtotal_formatted: '$49.00',
			setup_fee_formatted: '$0.00',
			discount_total_formatted: '$0.00',
			tax_formatted: '$0.00',
			total_formatted: '$49.00',
			refunded_amount_formatted: '$0.00',
			first_order_item: {
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
			},
			urls: {
				receipt:
					'https://app.lemonsqueezy.com/my-orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890'
			},
			created_at: '2025-01-15T14:30:00.000000Z',
			updated_at: '2025-01-15T14:30:00.000000Z',
			test_mode: false
		},
		relationships: {
			store: {
				links: {
					self: 'https://api.lemonsqueezy.com/v1/orders/12345/relationships/store',
					related:
						'https://api.lemonsqueezy.com/v1/orders/12345/store'
				}
			},
			customer: {
				links: {
					self: 'https://api.lemonsqueezy.com/v1/orders/12345/relationships/customer',
					related:
						'https://api.lemonsqueezy.com/v1/orders/12345/customer'
				}
			},
			'order-items': {
				links: {
					self: 'https://api.lemonsqueezy.com/v1/orders/12345/relationships/order-items',
					related:
						'https://api.lemonsqueezy.com/v1/orders/12345/order-items'
				}
			},
			subscriptions: {
				links: {
					self: 'https://api.lemonsqueezy.com/v1/orders/12345/relationships/subscriptions',
					related:
						'https://api.lemonsqueezy.com/v1/orders/12345/subscriptions'
				}
			},
			'license-keys': {
				links: {
					self: 'https://api.lemonsqueezy.com/v1/orders/12345/relationships/license-keys',
					related:
						'https://api.lemonsqueezy.com/v1/orders/12345/license-keys'
				}
			},
			'discount-redemptions': {
				links: {
					self: 'https://api.lemonsqueezy.com/v1/orders/12345/relationships/discount-redemptions',
					related:
						'https://api.lemonsqueezy.com/v1/orders/12345/discount-redemptions'
				}
			}
		},
		links: {
			self: 'https://api.lemonsqueezy.com/v1/orders/12345'
		}
	}
}

export const orderList = {
	meta: {
		page: {
			currentPage: 1,
			from: 1,
			lastPage: 10,
			perPage: 5,
			to: 5,
			total: 47
		}
	},
	jsonapi: { version: '1.0' },
	links: {
		first: 'https://api.lemonsqueezy.com/v1/orders?page%5Bnumber%5D=1&page%5Bsize%5D=5',
		last: 'https://api.lemonsqueezy.com/v1/orders?page%5Bnumber%5D=10&page%5Bsize%5D=5',
		next: 'https://api.lemonsqueezy.com/v1/orders?page%5Bnumber%5D=2&page%5Bsize%5D=5'
	},
	data: [
		{
			type: 'orders',
			id: '12345',
			attributes: {
				store_id: 1,
				customer_id: 1,
				order_number: 1001,
				user_name: 'Alice Smith',
				user_email: 'alice@example.com',
				currency: 'USD',
				subtotal: 4900,
				tax: 0,
				total: 4900,
				status: 'paid',
				status_formatted: 'Paid',
				refunded: false,
				created_at: '2025-01-15T14:30:00.000000Z',
				updated_at: '2025-01-15T14:30:00.000000Z',
				test_mode: false
			},
			relationships: {
				store: { links: { self: '...', related: '...' } }
			},
			links: { self: 'https://api.lemonsqueezy.com/v1/orders/12345' }
		},
		{
			type: 'orders',
			id: '12346',
			attributes: {
				store_id: 1,
				customer_id: 2,
				order_number: 1002,
				user_name: 'Bob Jones',
				user_email: 'bob@example.com',
				currency: 'USD',
				subtotal: 2900,
				tax: 0,
				total: 2900,
				status: 'refunded',
				status_formatted: 'Refunded',
				refunded: true,
				created_at: '2025-01-16T09:15:00.000000Z',
				updated_at: '2025-01-17T11:00:00.000000Z',
				test_mode: false
			},
			relationships: {
				store: { links: { self: '...', related: '...' } }
			},
			links: { self: 'https://api.lemonsqueezy.com/v1/orders/12346' }
		}
	]
}

export const singleSubscription = {
	data: {
		type: 'subscriptions',
		id: '456',
		attributes: {
			store_id: 1,
			customer_id: 1,
			order_id: 12345,
			order_item_id: 1,
			product_id: 1,
			variant_id: 1,
			product_name: 'Pro Plan',
			variant_name: 'Monthly',
			user_name: 'Alice Smith',
			user_email: 'alice@example.com',
			status: 'active',
			status_formatted: 'Active',
			card_brand: 'visa',
			card_last_four: '4242',
			pause: null,
			cancelled: false,
			trial_ends_at: null,
			billing_anchor: 15,
			renews_at: '2025-02-15T14:30:00.000000Z',
			ends_at: null,
			created_at: '2025-01-15T14:30:00.000000Z',
			updated_at: '2025-01-15T14:30:00.000000Z',
			test_mode: false
		},
		relationships: {
			store: { links: { self: '...', related: '...' } },
			customer: { links: { self: '...', related: '...' } }
		},
		links: { self: 'https://api.lemonsqueezy.com/v1/subscriptions/456' }
	}
}

/**
 * SDK-wrapped response fixtures.
 *
 * The Lemon Squeezy SDK wraps every response in { data, error, statusCode }.
 * The `data` field contains the raw JSON:API body. These fixtures mirror
 * what handleList/handleGet actually receive from the SDK.
 */
export const sdkSingleOrder = {
	data: singleOrder,
	error: null
}

export const sdkOrderList = {
	data: orderList,
	error: null
}

export const sdkSingleSubscription = {
	data: singleSubscription,
	error: null
}

export const errorNotFound = {
	jsonapi: { version: '1.0' },
	errors: [
		{
			detail: 'Not found',
			status: '404',
			title: 'Not Found'
		}
	]
}

export const errorValidation = {
	jsonapi: { version: '1.0' },
	errors: [
		{
			detail: 'The name field is required.',
			source: { pointer: '/data/attributes/name' },
			status: '422',
			title: 'Validation Error'
		},
		{
			detail: 'The email must be a valid email address.',
			source: { pointer: '/data/attributes/email' },
			status: '422',
			title: 'Validation Error'
		}
	]
}
