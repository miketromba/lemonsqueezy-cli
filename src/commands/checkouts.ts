/**
 * Checkout commands: list, get, create.
 */

import {
	createCheckout,
	getCheckout,
	listCheckouts,
	type NewCheckout
} from '@lemonsqueezy/lemonsqueezy.js'
import type { Command } from 'commander'
import {
	getPageParams,
	handleAction,
	handleGet,
	handleList
} from '../command-handler.ts'
import {
	buildFilter,
	buildInclude,
	parseCommaSeparated,
	parseCommaSeparatedNumbers
} from '../helpers.ts'
import {
	addGetOutputOptions,
	addGlobalOutputOptions,
	addListOutputOptions,
	addPaginationOptions
} from '../pagination.ts'

const VALID_INCLUDES = ['store', 'variant']

const COLUMNS = [
	{ key: 'url', label: 'URL' },
	{ key: 'store_id', label: 'Store ID' },
	{ key: 'variant_id', label: 'Variant ID' },
	{ key: 'created_at', label: 'Created At' }
]

export function registerCheckoutCommands(program: Command): void {
	const checkouts = program
		.command('checkouts')
		.description('Manage Lemon Squeezy checkouts')
		.addHelpText(
			'after',
			`
Examples:
  $ lmsq checkouts list --store-id 123
  $ lmsq checkouts get 456
  $ lmsq checkouts create --store-id 1 --variant-id 1
  $ lmsq checkouts create --store-id 1 --variant-id 1 --email jane@example.com`
		)

	// ── list ────────────────────────────────────────────────────────────
	const listCmd = checkouts
		.command('list')
		.description('List checkouts, optionally filtered by store or variant')
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)
		.option('--store-id <id>', 'Filter by store ID')
		.option('--variant-id <id>', 'Filter by variant ID')

	addPaginationOptions(listCmd)
	addListOutputOptions(listCmd)
	addGlobalOutputOptions(listCmd)

	listCmd.action(async (opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)
		const page = getPageParams(opts)
		const filter = buildFilter({
			storeId: opts.storeId as string | undefined,
			variantId: opts.variantId as string | undefined
		})

		await handleList(
			{ options: opts, resourceLabel: 'Checkout', columns: COLUMNS },
			() =>
				listCheckouts({
					filter: filter as any,
					include: include as any,
					page
				})
		)
	})

	// ── get ─────────────────────────────────────────────────────────────
	const getCmd = checkouts
		.command('get <id>')
		.description('Retrieve a single checkout by its ID')
		.option(
			'-i, --include <resources>',
			`Comma-separated related resources to include (${VALID_INCLUDES.join(', ')})`
		)

	addGetOutputOptions(getCmd)
	addGlobalOutputOptions(getCmd)

	getCmd.action(async (id: string, opts: Record<string, unknown>) => {
		const include = buildInclude(
			opts.include as string | undefined,
			VALID_INCLUDES
		)

		await handleGet(
			{ options: opts, resourceLabel: 'Checkout', columns: COLUMNS },
			() =>
				getCheckout(id, {
					include: include as any
				})
		)
	})

	// ── create ──────────────────────────────────────────────────────────
	const createCmd = checkouts
		.command('create')
		.description('Create a new checkout')
		.requiredOption('--store-id <id>', 'Store ID (required)')
		.requiredOption('--variant-id <id>', 'Variant ID (required)')
		.option('--custom-price <cents>', 'Custom price in cents')
		// Product options
		.option('--product-name <name>', 'Custom product name')
		.option('--product-description <desc>', 'Custom product description')
		.option(
			'--product-media <urls>',
			'Comma-separated image URLs for product media'
		)
		.option('--redirect-url <url>', 'Custom redirect URL after purchase')
		.option(
			'--receipt-button-text <text>',
			'Custom text for receipt email button'
		)
		.option(
			'--receipt-link-url <url>',
			'Custom URL for receipt email button'
		)
		.option(
			'--receipt-thank-you-note <text>',
			'Custom thank you note for receipt email'
		)
		.option(
			'--enabled-variants <ids>',
			'Comma-separated variant IDs to enable'
		)
		.option(
			'--confirmation-title <text>',
			'Custom payment success alert title'
		)
		.option(
			'--confirmation-message <text>',
			'Custom payment success alert content'
		)
		.option(
			'--confirmation-button-text <text>',
			'Custom payment success alert button text'
		)
		// Checkout options
		.option('--embed', 'Show the checkout overlay')
		.option('--no-media', 'Hide product media')
		.option('--no-logo', 'Hide store logo')
		.option('--no-desc', 'Hide product description')
		.option('--no-discount', 'Hide the discount code field')
		.option('--skip-trial', 'Remove the free trial')
		.option(
			'--subscription-preview',
			'Show the "You will be charged..." subscription preview text'
		)
		.option(
			'--background-color <hex>',
			'Custom hex color for checkout background'
		)
		.option('--button-color <hex>', 'Custom hex color for checkout button')
		// Checkout data
		.option('--email <email>', 'Pre-filled email address')
		.option('--name <name>', 'Pre-filled name')
		.option(
			'--billing-country <code>',
			'Pre-filled billing country (ISO 3166-1 alpha-2)'
		)
		.option('--billing-zip <zip>', 'Pre-filled billing zip/postal code')
		.option('--tax-number <number>', 'Pre-filled tax number')
		.option('--discount-code <code>', 'Pre-filled discount code')
		.option('--custom <json>', 'Custom data as a JSON string')
		// Other
		.option('--preview', 'Return a pricing preview with the checkout')
		.option('--test-mode', 'Create checkout in test mode')
		.option(
			'--expires-at <datetime>',
			'Checkout expiration (ISO 8601 datetime)'
		)
		.addHelpText(
			'after',
			`
Only --store-id and --variant-id are required. All other options customize
the checkout appearance, pre-fill customer data, or override product details.

Examples:
  $ lmsq checkouts create --store-id 1 --variant-id 1
  $ lmsq checkouts create --store-id 1 --variant-id 1 --custom-price 4900
  $ lmsq checkouts create --store-id 1 --variant-id 1 --email jane@example.com --discount-code SAVE20
  $ lmsq checkouts create --store-id 1 --variant-id 1 --redirect-url https://example.com/thanks
  $ lmsq checkouts create --store-id 1 --variant-id 1 --no-logo --no-discount --button-color "#7C3AED"
  $ lmsq checkouts create --store-id 1 --variant-id 1 --custom '{"user_id": "abc123"}'
  $ lmsq checkouts create --store-id 1 --variant-id 1 --test-mode`
		)

	addGetOutputOptions(createCmd)
	addGlobalOutputOptions(createCmd)

	createCmd.action(async (opts: Record<string, unknown>) => {
		const storeId = opts.storeId as string
		const variantId = opts.variantId as string

		const checkout: NewCheckout = {}

		if (opts.customPrice !== undefined) {
			checkout.customPrice = parseInt(opts.customPrice as string, 10)
		}

		// Build product options
		const productOptions: NonNullable<NewCheckout['productOptions']> = {}
		let hasProductOptions = false

		if (opts.productName !== undefined) {
			productOptions.name = opts.productName as string
			hasProductOptions = true
		}
		if (opts.productDescription !== undefined) {
			productOptions.description = opts.productDescription as string
			hasProductOptions = true
		}
		if (opts.productMedia !== undefined) {
			productOptions.media = parseCommaSeparated(
				opts.productMedia as string
			)
			hasProductOptions = true
		}
		if (opts.redirectUrl !== undefined) {
			productOptions.redirectUrl = opts.redirectUrl as string
			hasProductOptions = true
		}
		if (opts.receiptButtonText !== undefined) {
			productOptions.receiptButtonText = opts.receiptButtonText as string
			hasProductOptions = true
		}
		if (opts.receiptLinkUrl !== undefined) {
			productOptions.receiptLinkUrl = opts.receiptLinkUrl as string
			hasProductOptions = true
		}
		if (opts.receiptThankYouNote !== undefined) {
			productOptions.receiptThankYouNote =
				opts.receiptThankYouNote as string
			hasProductOptions = true
		}
		if (opts.enabledVariants !== undefined) {
			productOptions.enabledVariants = parseCommaSeparatedNumbers(
				opts.enabledVariants as string
			)
			hasProductOptions = true
		}
		if (opts.confirmationTitle !== undefined) {
			productOptions.confirmationTitle = opts.confirmationTitle as string
			hasProductOptions = true
		}
		if (opts.confirmationMessage !== undefined) {
			productOptions.confirmationMessage =
				opts.confirmationMessage as string
			hasProductOptions = true
		}
		if (opts.confirmationButtonText !== undefined) {
			productOptions.confirmationButtonText =
				opts.confirmationButtonText as string
			hasProductOptions = true
		}

		if (hasProductOptions) {
			checkout.productOptions = productOptions
		}

		// Build checkout options
		const checkoutOptions: NonNullable<NewCheckout['checkoutOptions']> = {}
		let hasCheckoutOptions = false

		if (opts.embed === true) {
			checkoutOptions.embed = true
			hasCheckoutOptions = true
		}
		if (opts.media === false) {
			checkoutOptions.media = false
			hasCheckoutOptions = true
		}
		if (opts.logo === false) {
			checkoutOptions.logo = false
			hasCheckoutOptions = true
		}
		if (opts.desc === false) {
			checkoutOptions.desc = false
			hasCheckoutOptions = true
		}
		if (opts.discount === false) {
			checkoutOptions.discount = false
			hasCheckoutOptions = true
		}
		if (opts.skipTrial === true) {
			checkoutOptions.skipTrial = true
			hasCheckoutOptions = true
		}
		if (opts.subscriptionPreview === true) {
			checkoutOptions.subscriptionPreview = true
			hasCheckoutOptions = true
		}
		if (opts.backgroundColor !== undefined) {
			checkoutOptions.backgroundColor = opts.backgroundColor as string
			hasCheckoutOptions = true
		}
		if (opts.buttonColor !== undefined) {
			checkoutOptions.buttonColor = opts.buttonColor as string
			hasCheckoutOptions = true
		}

		if (hasCheckoutOptions) {
			checkout.checkoutOptions = checkoutOptions
		}

		// Build checkout data
		const checkoutData: NonNullable<NewCheckout['checkoutData']> = {}
		let hasCheckoutData = false

		if (opts.email !== undefined) {
			checkoutData.email = opts.email as string
			hasCheckoutData = true
		}
		if (opts.name !== undefined) {
			checkoutData.name = opts.name as string
			hasCheckoutData = true
		}
		if (
			opts.billingCountry !== undefined ||
			opts.billingZip !== undefined
		) {
			const billingAddress: { country?: string; zip?: string } = {}
			if (opts.billingCountry !== undefined) {
				billingAddress.country = opts.billingCountry as string
			}
			if (opts.billingZip !== undefined) {
				billingAddress.zip = opts.billingZip as string
			}
			checkoutData.billingAddress = billingAddress as any
			hasCheckoutData = true
		}
		if (opts.taxNumber !== undefined) {
			checkoutData.taxNumber = opts.taxNumber as string
			hasCheckoutData = true
		}
		if (opts.discountCode !== undefined) {
			checkoutData.discountCode = opts.discountCode as string
			hasCheckoutData = true
		}
		if (opts.custom !== undefined) {
			checkoutData.custom = JSON.parse(opts.custom as string)
			hasCheckoutData = true
		}

		if (hasCheckoutData) {
			checkout.checkoutData = checkoutData
		}

		// Other top-level options
		if (opts.preview === true) {
			checkout.preview = true
		}
		if (opts.testMode === true) {
			checkout.testMode = true
		}
		if (opts.expiresAt !== undefined) {
			checkout.expiresAt = opts.expiresAt as string
		}

		await handleAction(
			{ options: opts, resourceLabel: 'Checkout', columns: COLUMNS },
			() => createCheckout(storeId, variantId, checkout)
		)
	})
}
