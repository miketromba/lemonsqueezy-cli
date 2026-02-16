/**
 * Root Commander program setup.
 * Registers all command groups and global options.
 */

import { Command } from 'commander'
import { registerAffiliateCommands } from './commands/affiliates.ts'
import { registerAuthCommands } from './commands/auth.ts'
import { registerCheckoutCommands } from './commands/checkouts.ts'
import { registerCustomerCommands } from './commands/customers.ts'
import { registerDiscountRedemptionCommands } from './commands/discount-redemptions.ts'
import { registerDiscountCommands } from './commands/discounts.ts'
import { registerFileCommands } from './commands/files.ts'
import { registerLicenseKeyInstanceCommands } from './commands/license-key-instances.ts'
import { registerLicenseKeyCommands } from './commands/license-keys.ts'
import { registerLicenseCommands } from './commands/licenses.ts'
import { registerOrderItemCommands } from './commands/order-items.ts'
import { registerOrderCommands } from './commands/orders.ts'
import { registerPriceCommands } from './commands/prices.ts'
import { registerProductCommands } from './commands/products.ts'
import { registerStoreCommands } from './commands/stores.ts'
import { registerSubInvoiceCommands } from './commands/sub-invoices.ts'
import { registerSubItemCommands } from './commands/sub-items.ts'
import { registerSubscriptionCommands } from './commands/subscriptions.ts'
import { registerUsageRecordCommands } from './commands/usage-records.ts'
import { registerUserCommands } from './commands/user.ts'
import { registerVariantCommands } from './commands/variants.ts'
import { registerWebhookCommands } from './commands/webhooks.ts'

export function createProgram(): Command {
	const program = new Command()

	program
		.name('lmsq')
		.description(
			'Lemon Squeezy CLI — manage your store from the command line.\n\n' +
				'Complete API coverage with AI-agent optimized output.\n' +
				'Use --json for clean JSON, --fields to select specific attributes,\n' +
				'--only-ids or --count for minimal output.'
		)
		.version('0.1.3')
		.addHelpText(
			'after',
			`
Getting started:
  $ lmsq auth login --key lsq_live_xxxxxxxxxxxx
  $ lmsq stores list
  $ lmsq orders list --page-size 3

Output modes:
  Default text      Auto-detected: colored tables (TTY) or flat key: value (piped)
  --json            Clean flattened JSON
  --json-raw        Full unmodified JSON:API response
  --fields a,b      Only return specific attributes
  --only-ids        One ID per line (list commands)
  --count           Just the total count (list commands)
  --pluck <field>   Just the bare value (get commands)

Run "lmsq <command> --help" for details on a specific command.`
		)

	registerAuthCommands(program)
	registerUserCommands(program)
	registerStoreCommands(program)
	registerCustomerCommands(program)
	registerProductCommands(program)
	registerVariantCommands(program)
	registerPriceCommands(program)
	registerFileCommands(program)
	registerOrderCommands(program)
	registerOrderItemCommands(program)
	registerSubscriptionCommands(program)
	registerSubInvoiceCommands(program)
	registerSubItemCommands(program)
	registerUsageRecordCommands(program)
	registerDiscountCommands(program)
	registerDiscountRedemptionCommands(program)
	registerLicenseKeyCommands(program)
	registerLicenseKeyInstanceCommands(program)
	registerCheckoutCommands(program)
	registerWebhookCommands(program)
	registerAffiliateCommands(program)
	registerLicenseCommands(program)

	return program
}
