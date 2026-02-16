/**
 * JSON output formatter.
 *
 * Handles two modes:
 * - Flattened JSON (--json): strips JSON:API wrappers, promotes attributes to top-level
 * - Raw JSON (--json-raw): passes through unmodified API response
 */

export interface FlattenedResource {
	id: string
	type: string
	[key: string]: unknown
}

export interface FlattenedListResponse {
	data: FlattenedResource[]
	meta: {
		total: number
		page: number
		pageSize: number
		pageCount: number
	}
}

interface JsonApiResource {
	type: string
	id: string
	attributes: Record<string, unknown>
	relationships?: unknown
	links?: unknown
}

interface JsonApiSingleResponse {
	data: JsonApiResource
	jsonapi?: unknown
	links?: unknown
}

interface JsonApiListResponse {
	data: JsonApiResource[]
	meta: {
		page: {
			currentPage: number
			from: number
			lastPage: number
			perPage: number
			to: number
			total: number
		}
	}
	jsonapi?: unknown
	links?: unknown
}

/**
 * Flatten a single JSON:API resource by promoting `data.attributes` to top-level
 * and stripping `relationships`, `links`, and `jsonapi` wrappers.
 */
export function flattenResource(raw: unknown): FlattenedResource {
	const response = raw as JsonApiSingleResponse
	const resource = response.data
	return {
		id: resource.id,
		type: resource.type,
		...resource.attributes
	}
}

/**
 * Flatten a JSON:API list response. Each item in `data` is flattened,
 * and `meta.page` is simplified to a flat pagination object.
 */
export function flattenListResponse(raw: unknown): FlattenedListResponse {
	const response = raw as JsonApiListResponse
	const page = response.meta.page
	return {
		data: response.data.map(resource => ({
			id: resource.id,
			type: resource.type,
			...resource.attributes
		})),
		meta: {
			total: page.total,
			page: page.currentPage,
			pageSize: page.perPage,
			pageCount: page.lastPage
		}
	}
}
