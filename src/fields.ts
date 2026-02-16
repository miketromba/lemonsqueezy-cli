/**
 * Field selection logic for --fields, --pluck, --only-ids, --count.
 *
 * Filters resource attributes to only the requested fields.
 * `id` is always implicitly included.
 */

/**
 * Given a flat resource object and a list of field names,
 * return a new object containing only `id` and the named fields.
 * Throws if any field name is not present in the resource.
 */
export function selectFields(
	resource: Record<string, unknown>,
	fields: string[]
): Record<string, unknown> {
	const validKeys = Object.keys(resource)
	for (const field of fields) {
		if (field !== 'id' && !validKeys.includes(field)) {
			throw new Error(
				`Unknown field "${field}". Valid fields: ${validKeys.join(', ')}`
			)
		}
	}

	const result: Record<string, unknown> = { id: resource.id }
	for (const field of fields) {
		if (field !== 'id') {
			result[field] = resource[field]
		}
	}
	return result
}

/**
 * Extract a single field value from a resource.
 * Throws if the field does not exist.
 */
export function pluckField(
	resource: Record<string, unknown>,
	field: string
): unknown {
	const validKeys = Object.keys(resource)
	if (!validKeys.includes(field)) {
		throw new Error(
			`Unknown field "${field}". Valid fields: ${validKeys.join(', ')}`
		)
	}
	return resource[field]
}

/**
 * Extract IDs from a list of resources.
 */
export function extractIds(resources: Record<string, unknown>[]): string[] {
	return resources.map(r => String(r.id))
}
