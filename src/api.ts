/**
 * Direct API client for SDK gaps.
 *
 * Used for: affiliates, order_number filter, invoice locale,
 * full refunds (no amount), and affiliate_activated webhook event.
 */

const BASE_URL = 'https://api.lemonsqueezy.com/v1'

interface ApiRequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
	apiKey: string
	body?: unknown
	params?: Record<string, string | number | boolean | undefined>
}

interface ApiResponse<T = unknown> {
	data: T | null
	error: { message: string; status: number } | null
}

function buildUrl(
	path: string,
	params?: Record<string, string | number | boolean | undefined>
): string {
	const url = new URL(`${BASE_URL}${path}`)
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value))
			}
		}
	}
	return url.toString()
}

export async function apiRequest<T = unknown>(
	path: string,
	options: ApiRequestOptions
): Promise<ApiResponse<T>> {
	const url = buildUrl(path, options.params)
	const headers: Record<string, string> = {
		Authorization: `Bearer ${options.apiKey}`,
		Accept: 'application/vnd.api+json'
	}

	if (options.body) {
		headers['Content-Type'] = 'application/vnd.api+json'
	}

	try {
		const response = await fetch(url, {
			method: options.method ?? 'GET',
			headers,
			body: options.body ? JSON.stringify(options.body) : undefined
		})

		if (!response.ok) {
			const errorBody: any = await response.json().catch(() => null)
			const message =
				errorBody?.errors?.[0]?.detail ??
				errorBody?.errors?.[0]?.title ??
				`HTTP ${response.status}`
			return { data: null, error: { message, status: response.status } }
		}

		if (response.status === 204) {
			return { data: null, error: null }
		}

		const data = (await response.json()) as T
		return { data, error: null }
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Unknown network error'
		return { data: null, error: { message, status: 0 } }
	}
}

export async function listAffiliates(
	apiKey: string,
	params?: {
		storeId?: string | number
		userEmail?: string
		page?: number
		pageSize?: number
	}
) {
	const queryParams: Record<string, string | number | boolean | undefined> =
		{}
	if (params?.storeId) queryParams['filter[store_id]'] = params.storeId
	if (params?.userEmail) queryParams['filter[user_email]'] = params.userEmail
	if (params?.page) queryParams['page[number]'] = params.page
	if (params?.pageSize) queryParams['page[size]'] = params.pageSize

	return apiRequest('/affiliates', { apiKey, params: queryParams })
}

export async function getAffiliate(apiKey: string, id: string | number) {
	return apiRequest(`/affiliates/${id}`, { apiKey })
}

export async function listOrdersWithOrderNumber(
	apiKey: string,
	params: {
		storeId?: string | number
		userEmail?: string
		orderNumber?: string | number
		page?: number
		pageSize?: number
		include?: string[]
	}
) {
	const queryParams: Record<string, string | number | boolean | undefined> =
		{}
	if (params.storeId) queryParams['filter[store_id]'] = params.storeId
	if (params.userEmail) queryParams['filter[user_email]'] = params.userEmail
	if (params.orderNumber)
		queryParams['filter[order_number]'] = params.orderNumber
	if (params.page) queryParams['page[number]'] = params.page
	if (params.pageSize) queryParams['page[size]'] = params.pageSize
	if (params.include) queryParams.include = params.include.join(',')

	return apiRequest('/orders', { apiKey, params: queryParams })
}

export async function generateInvoiceWithLocale(
	apiKey: string,
	resourcePath: string,
	params: Record<string, string | number | undefined>
) {
	const queryParams: Record<string, string | number | boolean | undefined> =
		{}
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) queryParams[key] = value
	}
	return apiRequest(`${resourcePath}/generate-invoice`, {
		apiKey,
		method: 'POST',
		params: queryParams
	})
}

export async function issueFullRefund(apiKey: string, resourcePath: string) {
	return apiRequest(`${resourcePath}/refund`, {
		apiKey,
		method: 'POST'
	})
}
