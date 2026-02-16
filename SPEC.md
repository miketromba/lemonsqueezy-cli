# Lemon Squeezy CLI — Comprehensive Specification

## Table of Contents

- [1. Overview](#1-overview)
- [2. Goals & Design Principles](#2-goals--design-principles)
- [3. Tech Stack](#3-tech-stack)
- [4. Project Structure](#4-project-structure)
- [5. Authentication & Configuration](#5-authentication--configuration)
- [6. Global Options & Output Modes](#6-global-options--output-modes)
- [7. AI-Agent Optimization](#7-ai-agent-optimization)
- [8. Command Hierarchy](#8-command-hierarchy)
- [9. Commands Reference](#9-commands-reference)
  - [9.1 auth](#91-auth)
  - [9.2 user](#92-user)
  - [9.3 stores](#93-stores)
  - [9.4 customers](#94-customers)
  - [9.5 products](#95-products)
  - [9.6 variants](#96-variants)
  - [9.7 prices](#97-prices)
  - [9.8 files](#98-files)
  - [9.9 orders](#99-orders)
  - [9.10 order-items](#910-order-items)
  - [9.11 subscriptions](#911-subscriptions)
  - [9.12 subscription-invoices](#912-subscription-invoices)
  - [9.13 subscription-items](#913-subscription-items)
  - [9.14 usage-records](#914-usage-records)
  - [9.15 discounts](#915-discounts)
  - [9.16 discount-redemptions](#916-discount-redemptions)
  - [9.17 license-keys](#917-license-keys)
  - [9.18 license-key-instances](#918-license-key-instances)
  - [9.19 checkouts](#919-checkouts)
  - [9.20 webhooks](#920-webhooks)
  - [9.21 affiliates](#921-affiliates)
  - [9.22 licenses (Public API)](#922-licenses-public-api)
- [10. Pagination](#10-pagination)
- [11. Relationship Includes](#11-relationship-includes)
- [12. Output Formatting](#12-output-formatting)
- [13. Error Handling](#13-error-handling)
- [14. SDK Function-to-CLI Mapping](#14-sdk-function-to-cli-mapping)
- [15. API Coverage & Known SDK Gaps](#15-api-coverage--known-sdk-gaps)
- [16. Testing Strategy (TDD Red-Green)](#16-testing-strategy-tdd-red-green)

---

## 1. Overview

`lemonsqueezy-cli` (binary name: `lmsq`) is a comprehensive command-line interface for the [Lemon Squeezy](https://lemonsqueezy.com) platform, built on the official [`@lemonsqueezy/lemonsqueezy.js`](https://github.com/lmsqueezy/lemonsqueezy.js) TypeScript SDK. It provides **complete feature parity** with all 60 SDK functions across 17 resource types and 3 license management operations.

### What You Can Do

- Manage your store, products, variants, prices, and files
- Create and manage customers
- Handle orders, refunds, and invoices
- Control subscriptions and their lifecycle (pause, cancel, resume)
- Create and manage discount codes
- Manage license keys and instances
- Create checkout sessions
- Manage webhooks
- Activate, validate, and deactivate licenses (public API)

---

## 2. Goals & Design Principles

### AI-Agent Optimized (Context-Window Respectful)

This CLI is designed as a **first-class tool for AI agents** (LLMs, coding assistants, autonomous agents) while remaining excellent for human developers. Every output decision is made with token efficiency in mind:

- **Flat, minimal default output**: No decorative formatting, no box-drawing characters, no ANSI color codes by default. Clean `key: value` pairs that are instantly parseable and token-efficient.
- **Field selection (`--fields`)**: Every `get` and `list` command supports `--fields` to return *only* the attributes the caller needs. An AI asking "what's the status?" doesn't need to read 30 attributes.
- **Precision retrieval**: `--only-ids`, `--count`, `--first`, and `--pluck` let agents get exactly what they need in minimal tokens.
- **No wrapper noise**: JSON output is flattened — `{id, type, ...attributes}` — not the raw JSON:API envelope with nested `data.attributes`, `data.relationships.*.links`, etc.
- **Contextual hints only for humans**: Decorative hints ("→ Use --page 2") only appear in interactive TTY mode, never in piped/non-interactive contexts.

### Developer-Friendliness

- **Discoverability first**: Every command, subcommand, and option is fully documented with descriptions, examples, and defaults in `--help` output.
- **Consistent patterns**: All resource commands follow the same verb structure (`list`, `get`, `create`, `update`, `delete`) so learning one resource teaches you all of them.
- **Helpful error messages**: Errors include the failed action, the API error detail, and a suggestion for what to try next.
- **Progressive disclosure**: `lmsq --help` shows top-level resource groups. `lmsq <resource> --help` shows available actions. `lmsq <resource> <action> --help` shows all options with descriptions.

### Conventions

| Convention | Detail |
|---|---|
| Binary name | `lmsq` |
| Resource nouns | Plural, kebab-case (`license-keys`, `order-items`) |
| Action verbs | `list`, `get`, `create`, `update`, `delete`, plus resource-specific verbs |
| IDs | Always positional arguments for primary resource IDs |
| Filters | `--filter-<name>` flags (e.g. `--filter-store-id`, `--filter-status`) |
| Includes | `--include` flag accepting comma-separated relationship names |
| Pagination | `--page` and `--page-size` flags |
| Field selection | `--fields` flag accepting comma-separated attribute names |
| Output format | Default is flat text; `--json` for clean JSON; `--json-raw` for full API response |

---

## 3. Tech Stack

| Component | Choice | Reason |
|---|---|---|
| Runtime | [Bun](https://bun.sh) | Fast startup, native TypeScript, single binary potential |
| Language | TypeScript | Type safety, matches SDK language |
| SDK | `@lemonsqueezy/lemonsqueezy.js` v4.x | Official SDK with full API coverage |
| CLI Framework | [Commander.js](https://github.com/tj/commander.js) | Mature, excellent help generation, subcommand support |
| Styling | [Chalk](https://github.com/chalk/chalk) | Terminal colors and formatting |

---

## 4. Project Structure

```
lemonsqueezy-cli/
├── bin/
│   └── lmsq.ts                  # Entry point / executable
├── src/
│   ├── cli.ts                   # Root Commander program setup
│   ├── config.ts                # API key storage & retrieval
│   ├── output.ts                # Output mode detection & routing
│   ├── formatters/
│   │   ├── text.ts              # Flat key:value text formatter (AI-optimized)
│   │   ├── pretty.ts            # Colored table/detail formatter (human TTY)
│   │   └── json.ts              # JSON formatter (flattened + raw modes)
│   ├── fields.ts                # --fields, --pluck, --only-ids field selection
│   ├── api.ts                   # Direct API client for SDK gaps (affiliates, etc.)
│   ├── errors.ts                # Error handling & display (mode-aware)
│   ├── pagination.ts            # Shared pagination option helpers
│   ├── helpers.ts               # Shared utilities (parsers, validators)
│   └── commands/
│       ├── auth.ts              # auth login / logout / status
│       ├── user.ts              # user get
│       ├── stores.ts            # stores list / get
│       ├── customers.ts         # customers list / get / create / update / archive
│       ├── products.ts          # products list / get
│       ├── variants.ts          # variants list / get
│       ├── prices.ts            # prices list / get
│       ├── files.ts             # files list / get
│       ├── orders.ts            # orders list / get / invoice / refund
│       ├── order-items.ts       # order-items list / get
│       ├── subscriptions.ts     # subscriptions list / get / update / cancel
│       ├── sub-invoices.ts      # subscription-invoices list / get / generate / refund
│       ├── sub-items.ts         # subscription-items list / get / update / usage
│       ├── usage-records.ts     # usage-records list / get / create
│       ├── discounts.ts         # discounts list / get / create / delete
│       ├── discount-redemptions.ts  # discount-redemptions list / get
│       ├── license-keys.ts      # license-keys list / get / update
│       ├── license-key-instances.ts # license-key-instances list / get
│       ├── checkouts.ts         # checkouts list / get / create
│       ├── webhooks.ts          # webhooks list / get / create / update / delete
│       ├── affiliates.ts        # affiliates list / get (direct API, not in SDK)
│       └── licenses.ts          # licenses activate / validate / deactivate
├── test/
│   ├── fixtures/
│   │   └── api-responses.ts     # Realistic JSON:API response fixtures
│   ├── formatters/
│   │   ├── json.test.ts         # JSON flattening tests
│   │   └── text.test.ts         # Text formatter tests
│   ├── fields.test.ts           # Field selection / pluck / extractIds tests
│   ├── errors.test.ts           # Error formatting + exit code tests
│   └── commands/                # Per-command integration tests (mock SDK)
│       └── ...
├── package.json
├── tsconfig.json
├── SPEC.md                      # This file
└── README.md
```

---

## 5. Authentication & Configuration

### API Key Storage

The CLI stores the API key in a local config file at `~/.config/lemonsqueezy-cli/config.json`. The file structure:

```json
{
  "apiKey": "lsq_live_xxxxxxxxxxxx",
  "environment": "live"
}
```

### Auth Commands

```
lmsq auth login          # Prompt for API key interactively (masked input)
lmsq auth login --key <KEY>  # Provide API key directly
lmsq auth logout         # Remove stored API key
lmsq auth status         # Show current auth state (masked key, environment)
```

### Environment Variable Override

The `LEMONSQUEEZY_API_KEY` environment variable takes precedence over the stored config file, enabling CI/CD usage without persistent config.

### API Key Resolution Order

1. `LEMONSQUEEZY_API_KEY` environment variable
2. `~/.config/lemonsqueezy-cli/config.json` file
3. Error with instructions to run `lmsq auth login`

---

## 6. Global Options & Output Modes

### Global Options

These options are available on every command:

| Flag | Short | Description |
|---|---|---|
| `--json` | `-j` | Output as flattened, clean JSON (no JSON:API wrappers) |
| `--json-raw` | | Output the full, unmodified API response (JSON:API format) |
| `--fields <list>` | `-f` | Comma-separated list of attribute names to include in output |
| `--api-key <key>` | | Override the stored/env API key for this invocation |
| `--color` | | Force color output (default: auto-detect TTY) |
| `--no-color` | | Disable color output |
| `--help` | `-h` | Show help for the command |
| `--version` | `-V` | Show CLI version |

### List-Specific Global Options

These options are available on all `list` commands:

| Flag | Short | Description |
|---|---|---|
| `--only-ids` | | Output only resource IDs, one per line |
| `--count` | | Output only the total count of matching resources |
| `--first` | | Return only the first result (shorthand for `--page-size 1`) |
| `--page <n>` | `-p` | Page number (default: 1) |
| `--page-size <n>` | `-s` | Results per page (default: 5, max: 100) |

### Get-Specific Global Options

These options are available on all `get` commands:

| Flag | Short | Description |
|---|---|---|
| `--pluck <field>` | | Output only the value of a single field (no key, no formatting) |

### Output Modes

The CLI has four output modes, chosen by flags:

| Mode | Flag | Best For | Description |
|---|---|---|---|
| **Text** | *(default)* | AI agents, piping | Flat `key: value` pairs, no decoration. Auto-detects non-TTY. |
| **Pretty** | *(auto in TTY)* | Humans in terminal | Colored tables/detail views with hints. Only when stdout is a TTY. |
| **JSON** | `--json` | AI agents, scripting | Clean flattened JSON: `{id, type, ...attributes}` for `get`, `[{...}, ...]` for `list` |
| **JSON Raw** | `--json-raw` | Debugging, full fidelity | Unmodified JSON:API response from the Lemon Squeezy API |

#### TTY Auto-Detection

The CLI detects whether stdout is an interactive terminal:

- **TTY (interactive terminal)**: Uses the Pretty mode by default — colored output, table formatting, decorative headers, pagination hints.
- **Non-TTY (piped, redirected, or used by an AI agent)**: Uses the Text mode by default — flat `key: value` lines, no colors, no decorative elements, no hints.

This means AI agents calling the CLI via shell tools automatically get the token-efficient format without needing any extra flags.

---

## 7. AI-Agent Optimization

This section describes the design decisions made specifically to optimize the CLI for AI agent consumption, respecting context window limitations.

### 7.1 Field Selection (`--fields`)

The most impactful feature for context window optimization. Available on all `get` and `list` commands.

```bash
# Full output: returns all ~15 attributes for each subscription
lmsq subscriptions list

# Targeted: returns only what the agent needs (3 attributes)
lmsq subscriptions list --fields id,status,user_email

# Works with get too
lmsq orders get 12345 --fields status,total,customer_email
```

**Behavior**:
- `--fields` filters the output to only the named attributes
- `id` is always implicitly included (you can omit it from the list)
- Invalid field names produce a clear error listing valid fields for that resource
- Works across all output modes (text, JSON, pretty)

### 7.2 Precision Retrieval Commands

These flags let an agent get exactly the granularity of data it needs:

```bash
# Just need a count? 1 token instead of hundreds.
lmsq subscriptions list --filter-status active --count
# Output: 47

# Just need IDs for iteration?
lmsq orders list --filter-store-id 123 --only-ids
# Output:
# 12345
# 12346
# 12347

# Just need the first matching result?
lmsq customers list --filter-email alice@example.com --first
# Output: (single customer, not a list)

# Just need one specific value?
lmsq subscriptions get 456 --pluck status
# Output: active
```

### 7.3 Flattened JSON (No JSON:API Wrappers)

The Lemon Squeezy API returns JSON:API format, which is deeply nested:

```json
{
  "jsonapi": { "version": "1.0" },
  "links": { "self": "..." },
  "data": {
    "type": "orders",
    "id": "12345",
    "attributes": {
      "status": "paid",
      "total": 4900
    },
    "relationships": {
      "store": { "links": { "self": "...", "related": "..." } }
    },
    "links": { "self": "..." }
  }
}
```

With `--json`, the CLI flattens this to:

```json
{
  "id": "12345",
  "type": "orders",
  "status": "paid",
  "total": 4900
}
```

For lists, `--json` returns:

```json
{
  "data": [
    { "id": "12345", "type": "orders", "status": "paid", "total": 4900 },
    { "id": "12346", "type": "orders", "status": "refunded", "total": 2900 }
  ],
  "meta": { "total": 47, "page": 1, "pageSize": 5, "pageCount": 10 }
}
```

The `meta` object is always a simple flat structure with just the pagination essentials. Relationships links, self links, and JSON:API version headers are stripped.

If `--fields` is combined with `--json`, only the selected fields appear in the JSON objects.

The full unmodified API response is always available via `--json-raw` for debugging or when full fidelity is needed.

### 7.4 Default Text Output (Non-TTY)

When an AI agent calls the CLI through a shell tool, stdout is not a TTY. The default output in this context is flat text optimized for minimal tokens:

**`get` commands** produce `key: value` pairs:

```
id: 12345
status: paid
customer_email: alice@example.com
total: 4900
created_at: 2025-01-15T14:30:00Z
```

**`list` commands** produce a compact block per resource, separated by blank lines:

```
id: 12345
status: paid
customer_email: alice@example.com
total: 4900

id: 12346
status: refunded
customer_email: bob@example.com
total: 2900

[page 1/10, 47 total]
```

With `--fields`, only requested fields appear:

```
lmsq orders list --fields status,total
```
```
id: 12345
status: paid
total: 4900

id: 12346
status: refunded
total: 2900

[page 1/10, 47 total]
```

**Key characteristics of text mode:**
- No ANSI color codes
- No decorative characters (═══, ────, →, ✖)
- No "Use --page 2" hints
- Timestamps in ISO 8601 (machine-readable), not "January 15, 2025 at 2:30 PM"
- Money values in cents (integers), not formatted strings like "$49.00"
- Pagination metadata in a single compact `[page X/Y, N total]` line
- Blank-line separated records in lists (easy to parse, minimal overhead)

### 7.5 Compact Error Output

Errors in non-TTY mode are also token-efficient:

```
error: not_found
message: Order not found
id: 99999
status: 404
```

No decorative boxes, no emoji, no hints. Just the facts.

### 7.6 Summary of Token Savings

Example: "List active subscriptions and get their statuses"

| Approach | Approximate Tokens |
|---|---|
| `--json-raw` (full JSON:API) | ~2,000 per resource |
| `--json` (flattened) | ~200 per resource |
| Default text (all fields) | ~150 per resource |
| `--fields id,status` | ~20 per resource |
| `--only-ids` | ~5 per resource |
| `--count` | ~3 total |

---

## 8. Command Hierarchy

```
lmsq
├── auth
│   ├── login                   # Store API key
│   ├── logout                  # Remove API key
│   └── status                  # Show auth status
├── user                        # Get authenticated user
├── stores
│   ├── list                    # List all stores
│   └── get <id>                # Get a store
├── customers
│   ├── list                    # List customers
│   ├── get <id>                # Get a customer
│   ├── create                  # Create a customer
│   ├── update <id>             # Update a customer
│   └── archive <id>            # Archive a customer
├── products
│   ├── list                    # List products
│   └── get <id>                # Get a product
├── variants
│   ├── list                    # List variants
│   └── get <id>                # Get a variant
├── prices
│   ├── list                    # List prices
│   └── get <id>                # Get a price
├── files
│   ├── list                    # List files
│   └── get <id>                # Get a file
├── orders
│   ├── list                    # List orders
│   ├── get <id>                # Get an order
│   ├── invoice <id>            # Generate an order invoice
│   └── refund <id>             # Issue an order refund
├── order-items
│   ├── list                    # List order items
│   └── get <id>                # Get an order item
├── subscriptions
│   ├── list                    # List subscriptions
│   ├── get <id>                # Get a subscription
│   ├── update <id>             # Update a subscription
│   └── cancel <id>             # Cancel a subscription
├── subscription-invoices
│   ├── list                    # List subscription invoices
│   ├── get <id>                # Get a subscription invoice
│   ├── generate <id>           # Generate a subscription invoice
│   └── refund <id>             # Issue a subscription invoice refund
├── subscription-items
│   ├── list                    # List subscription items
│   ├── get <id>                # Get a subscription item
│   ├── update <id>             # Update a subscription item
│   └── usage <id>              # Get current usage for a subscription item
├── usage-records
│   ├── list                    # List usage records
│   ├── get <id>                # Get a usage record
│   └── create                  # Create a usage record
├── discounts
│   ├── list                    # List discounts
│   ├── get <id>                # Get a discount
│   ├── create                  # Create a discount
│   └── delete <id>             # Delete a discount
├── discount-redemptions
│   ├── list                    # List discount redemptions
│   └── get <id>                # Get a discount redemption
├── license-keys
│   ├── list                    # List license keys
│   ├── get <id>                # Get a license key
│   └── update <id>             # Update a license key
├── license-key-instances
│   ├── list                    # List license key instances
│   └── get <id>                # Get a license key instance
├── checkouts
│   ├── list                    # List checkouts
│   ├── get <id>                # Get a checkout
│   └── create                  # Create a checkout
├── webhooks
│   ├── list                    # List webhooks
│   ├── get <id>                # Get a webhook
│   ├── create                  # Create a webhook
│   ├── update <id>             # Update a webhook
│   └── delete <id>             # Delete a webhook
├── affiliates
│   ├── list                    # List affiliates
│   └── get <id>                # Get an affiliate
└── licenses
    ├── activate                # Activate a license key
    ├── validate                # Validate a license key
    └── deactivate              # Deactivate a license key
```

**Total: 22 resource groups, 59 subcommands**

---

## 9. Commands Reference

> **Note**: All `list` and `get` commands also support the global output options described in [Section 6](#6-global-options--output-modes): `--fields`, `--json`, `--json-raw`, and for `list` commands: `--only-ids`, `--count`, `--first`. For `get` commands: `--pluck`. These are not repeated in each command's options below.

### 9.1 auth

Local configuration management for API key storage.

#### `lmsq auth login`

Store a Lemon Squeezy API key for CLI usage.

```
Options:
  --key <api-key>    Provide API key directly (otherwise prompts interactively)
```

**Behavior**: Validates the key by calling `getAuthenticatedUser()` before storing. Shows the authenticated user's name and email on success.

#### `lmsq auth logout`

Remove the stored API key.

#### `lmsq auth status`

Display current authentication status: whether a key is configured, its source (env var vs config file), the key prefix (masked), and the associated user.

---

### 9.2 user

#### `lmsq user`

Retrieve and display the currently authenticated user. Maps to `getAuthenticatedUser()`.

```
lmsq user
lmsq user --json
```

**Output fields**: Name, email, color, avatar URL, created/updated timestamps. Use `--fields name,email` to limit output.

---

### 9.3 stores

#### `lmsq stores list`

List all stores for the authenticated user. Maps to `listStores()`.

```
Options:
  --include <relations>   Comma-separated: products, orders, subscriptions, discounts,
                          license-keys, webhooks
  --page <number>         Page number (default: 1)
  --page-size <number>    Results per page (default: 5, max: 100)
```

#### `lmsq stores get <id>`

Get a specific store by ID. Maps to `getStore()`.

```
Arguments:
  id                      Store ID

Options:
  --include <relations>   Comma-separated: products, orders, subscriptions, discounts,
                          license-keys, webhooks
```

---

### 9.4 customers

#### `lmsq customers list`

List customers. Maps to `listCustomers()`.

```
Options:
  --filter-store-id <id>    Filter by store ID
  --filter-email <email>    Filter by email address
  --include <relations>     Comma-separated: store, orders, subscriptions, license-keys
  --page <number>           Page number (default: 1)
  --page-size <number>      Results per page (default: 10, max: 100)
```

#### `lmsq customers get <id>`

Get a specific customer. Maps to `getCustomer()`.

```
Arguments:
  id                        Customer ID

Options:
  --include <relations>     Comma-separated: store, orders, subscriptions, license-keys
```

#### `lmsq customers create`

Create a new customer. Maps to `createCustomer()`.

```
Options:
  --store-id <id>           (required) Store ID
  --name <name>             (required) Customer name
  --email <email>           (required) Customer email
  --city <city>             Customer city
  --country <code>          ISO 3166-1 alpha-2 country code (e.g. US, GB, DE)
  --region <region>         Customer region/state
```

#### `lmsq customers update <id>`

Update a customer. Maps to `updateCustomer()`.

```
Arguments:
  id                        Customer ID

Options:
  --name <name>             Customer name
  --email <email>           Customer email
  --city <city>             Customer city
  --country <code>          ISO 3166-1 alpha-2 country code
  --region <region>         Customer region/state
```

#### `lmsq customers archive <id>`

Archive a customer. Maps to `archiveCustomer()`.

```
Arguments:
  id                        Customer ID
```

---

### 9.5 products

#### `lmsq products list`

List products. Maps to `listProducts()`.

```
Options:
  --filter-store-id <id>    Filter by store ID
  --include <relations>     Comma-separated: store, variants
  --page <number>           Page number (default: 1)
  --page-size <number>      Results per page (default: 10, max: 100)
```

#### `lmsq products get <id>`

Get a specific product. Maps to `getProduct()`.

```
Arguments:
  id                        Product ID

Options:
  --include <relations>     Comma-separated: store, variants
```

---

### 9.6 variants

#### `lmsq variants list`

List variants. Maps to `listVariants()`.

```
Options:
  --filter-product-id <id>    Filter by product ID
  --filter-status <status>    Filter by status: pending, draft, published
  --include <relations>       Comma-separated: product, files, price-model
  --page <number>             Page number (default: 1)
  --page-size <number>        Results per page (default: 10, max: 100)
```

#### `lmsq variants get <id>`

Get a specific variant. Maps to `getVariant()`.

```
Arguments:
  id                          Variant ID

Options:
  --include <relations>       Comma-separated: product, files, price-model
```

---

### 9.7 prices

#### `lmsq prices list`

List prices. Maps to `listPrices()`.

```
Options:
  --filter-variant-id <id>    Filter by variant ID
  --include <relations>       Comma-separated: variant
  --page <number>             Page number (default: 1)
  --page-size <number>        Results per page (default: 10, max: 100)
```

#### `lmsq prices get <id>`

Get a specific price. Maps to `getPrice()`.

```
Arguments:
  id                          Price ID

Options:
  --include <relations>       Comma-separated: variant
```

---

### 9.8 files

#### `lmsq files list`

List files. Maps to `listFiles()`.

```
Options:
  --filter-variant-id <id>    Filter by variant ID
  --include <relations>       Comma-separated: variant
  --page <number>             Page number (default: 1)
  --page-size <number>        Results per page (default: 10, max: 100)
```

#### `lmsq files get <id>`

Get a specific file. Maps to `getFile()`.

```
Arguments:
  id                          File ID

Options:
  --include <relations>       Comma-separated: variant
```

---

### 9.9 orders

#### `lmsq orders list`

List orders. Maps to `listOrders()` (with direct API fallback for `order_number` filter).

```
Options:
  --filter-store-id <id>        Filter by store ID
  --filter-user-email <email>   Filter by user email
  --filter-order-number <num>   Filter by order number (direct API call, not in SDK)
  --include <relations>         Comma-separated: store, customer, order-items, subscriptions,
                                license-keys, discount-redemptions
  --page <number>               Page number (default: 1)
  --page-size <number>          Results per page (default: 5, max: 100)
```

#### `lmsq orders get <id>`

Get a specific order. Maps to `getOrder()`.

```
Arguments:
  id                          Order ID

Options:
  --include <relations>       Comma-separated: store, customer, order-items, subscriptions,
                              license-keys, discount-redemptions
```

#### `lmsq orders invoice <id>`

Generate a downloadable invoice for an order. Maps to `generateOrderInvoice()` (with direct API fallback for `locale`).

```
Arguments:
  id                          Order ID

Options:
  --name <name>               Customer/business name for the invoice
  --address <address>         Street address
  --city <city>               City
  --state <state>             State/region
  --zip-code <code>           ZIP/postal code (numeric)
  --country <country>         Country name
  --notes <notes>             Additional notes to include on the invoice
  --locale <locale>           Invoice locale/language (direct API call, not in SDK)
```

**Output**: Returns a download URL for the generated invoice PDF.

#### `lmsq orders refund <id>`

Issue a refund for an order. Maps to `issueOrderRefund()` or direct API call for full refund.

```
Arguments:
  id                          Order ID

Options:
  --amount <cents>            Refund amount in cents. Omit for a full refund.
                              (Full refund uses direct API call to bypass SDK requirement)
```

---

### 9.10 order-items

#### `lmsq order-items list`

List order items. Maps to `listOrderItems()`.

```
Options:
  --filter-order-id <id>      Filter by order ID
  --filter-product-id <id>    Filter by product ID
  --filter-variant-id <id>    Filter by variant ID
  --include <relations>       Comma-separated: order, product, variant
  --page <number>             Page number (default: 1)
  --page-size <number>        Results per page (default: 10, max: 100)
```

#### `lmsq order-items get <id>`

Get a specific order item. Maps to `getOrderItem()`.

```
Arguments:
  id                          Order item ID

Options:
  --include <relations>       Comma-separated: order, product, variant
```

---

### 9.11 subscriptions

#### `lmsq subscriptions list`

List subscriptions. Maps to `listSubscriptions()`.

```
Options:
  --filter-store-id <id>        Filter by store ID
  --filter-order-id <id>        Filter by order ID
  --filter-order-item-id <id>   Filter by order item ID
  --filter-product-id <id>      Filter by product ID
  --filter-variant-id <id>      Filter by variant ID
  --filter-user-email <email>   Filter by user email
  --filter-status <status>      Filter by status: on_trial, active, paused, pause,
                                past_due, unpaid, cancelled, expired
  --include <relations>         Comma-separated: store, customer, order, order-item,
                                product, variant, subscription-items,
                                subscription-invoices
  --page <number>               Page number (default: 1)
  --page-size <number>          Results per page (default: 10, max: 100)
```

#### `lmsq subscriptions get <id>`

Get a specific subscription. Maps to `getSubscription()`.

```
Arguments:
  id                            Subscription ID

Options:
  --include <relations>         Comma-separated: store, customer, order, order-item,
                                product, variant, subscription-items,
                                subscription-invoices
```

#### `lmsq subscriptions update <id>`

Update a subscription (change plan, pause, unpause, billing). Maps to `updateSubscription()`.

```
Arguments:
  id                              Subscription ID

Options:
  Plan Change:
  --variant-id <id>               New variant ID (to change the subscription plan)

  Pause/Resume:
  --pause <mode>                  Pause the subscription: "void" (stop invoicing) or
                                  "free" (provide free access)
  --pause-resumes-at <date>       ISO 8601 date-time when the pause should auto-resume
  --unpause                       Unpause the subscription (sets pause to null)

  Cancellation:
  --cancelled                     Cancel the subscription
  --uncancelled                   Resume a cancelled subscription (set cancelled to false)

  Trial:
  --trial-ends-at <datetime>      Set/change the trial end date (ISO 8601 format)

  Billing:
  --billing-anchor <day>          Day of month (1-31) for billing. Set to 0 to clear.
  --invoice-immediately           Charge any changes immediately (prorated invoice).
                                  Overridden by --disable-prorations if both set.
  --disable-prorations            Skip proration — charge new price at next renewal.
                                  Overrides --invoice-immediately if both set.
```

**Notes**:
- `--pause` and `--unpause` are mutually exclusive
- `--cancelled` and `--uncancelled` are mutually exclusive
- `--pause-resumes-at` can only be used with `--pause`
- `--disable-prorations` overrides `--invoice-immediately` if both are provided

#### `lmsq subscriptions cancel <id>`

Cancel a subscription. Maps to `cancelSubscription()`.

```
Arguments:
  id                            Subscription ID
```

---

### 9.12 subscription-invoices

#### `lmsq subscription-invoices list`

List subscription invoices. Maps to `listSubscriptionInvoices()`.

```
Options:
  --filter-store-id <id>          Filter by store ID
  --filter-status <status>        Filter by invoice status
  --filter-refunded <bool>        Filter by refunded status: true, false
  --filter-subscription-id <id>   Filter by subscription ID
  --include <relations>           Comma-separated: store, subscription, customer
  --page <number>                 Page number (default: 1)
  --page-size <number>            Results per page (default: 10, max: 100)
```

#### `lmsq subscription-invoices get <id>`

Get a specific subscription invoice. Maps to `getSubscriptionInvoice()`.

```
Arguments:
  id                              Subscription invoice ID

Options:
  --include <relations>           Comma-separated: store, subscription, customer
```

#### `lmsq subscription-invoices generate <id>`

Generate a downloadable invoice for a subscription invoice. Maps to `generateSubscriptionInvoice()` (with direct API fallback for `locale`).

```
Arguments:
  id                              Subscription invoice ID

Options:
  --name <name>                   Customer/business name for the invoice
  --address <address>             Street address
  --city <city>                   City
  --state <state>                 State/region
  --zip-code <code>               ZIP/postal code (numeric)
  --country <country>             Country name
  --notes <notes>                 Additional notes to include on the invoice
  --locale <locale>               Invoice locale/language (direct API call, not in SDK)
```

**Output**: Returns a download URL for the generated invoice PDF.

#### `lmsq subscription-invoices refund <id>`

Issue a refund for a subscription invoice. Maps to `issueSubscriptionInvoiceRefund()` or direct API call for full refund.

```
Arguments:
  id                              Subscription invoice ID

Options:
  --amount <cents>                Refund amount in cents. Omit for a full refund.
                                  (Full refund uses direct API call to bypass SDK requirement)
```

---

### 9.13 subscription-items

#### `lmsq subscription-items list`

List subscription items. Maps to `listSubscriptionItems()`.

```
Options:
  --filter-subscription-id <id>   Filter by subscription ID
  --filter-price-id <id>          Filter by price ID
  --include <relations>           Comma-separated: subscription, price, usage-records
  --page <number>                 Page number (default: 1)
  --page-size <number>            Results per page (default: 10, max: 100)
```

#### `lmsq subscription-items get <id>`

Get a specific subscription item. Maps to `getSubscriptionItem()`.

```
Arguments:
  id                              Subscription item ID

Options:
  --include <relations>           Comma-separated: subscription, price, usage-records
```

#### `lmsq subscription-items update <id>`

Update a subscription item (change quantity). Maps to `updateSubscriptionItem()`.

```
Arguments:
  id                              Subscription item ID

Options:
  --quantity <number>             (required) New quantity for the subscription item
  --invoice-immediately           Invoice the customer immediately for the change
                                  (default: false)
  --disable-prorations            Disable prorations for this change (default: false;
                                  overrides --invoice-immediately if set)
```

#### `lmsq subscription-items usage <id>`

Get current usage for a subscription item. Maps to `getSubscriptionItemCurrentUsage()`.

```
Arguments:
  id                              Subscription item ID
```

**Output**: Current billing period usage including quantity, period start/end.

---

### 9.14 usage-records

#### `lmsq usage-records list`

List usage records. Maps to `listUsageRecords()`.

```
Options:
  --filter-subscription-item-id <id>   Filter by subscription item ID
  --include <relations>                Comma-separated: subscription-item
  --page <number>                      Page number (default: 1)
  --page-size <number>                 Results per page (default: 10, max: 100)
```

#### `lmsq usage-records get <id>`

Get a specific usage record. Maps to `getUsageRecord()`.

```
Arguments:
  id                                   Usage record ID

Options:
  --include <relations>                Comma-separated: subscription-item
```

#### `lmsq usage-records create`

Create a usage record for a subscription item. Maps to `createUsageRecord()`.

```
Options:
  --subscription-item-id <id>    (required) Subscription item ID
  --quantity <number>            (required) Usage quantity (positive integer)
  --action <type>                Action type: "increment" (add to current) or "set"
                                 (replace current). Default: "increment"
```

---

### 9.15 discounts

#### `lmsq discounts list`

List discounts. Maps to `listDiscounts()`.

```
Options:
  --filter-store-id <id>         Filter by store ID
  --include <relations>          Comma-separated: store, variants, discount-redemptions
  --page <number>                Page number (default: 1)
  --page-size <number>           Results per page (default: 10, max: 100)
```

#### `lmsq discounts get <id>`

Get a specific discount. Maps to `getDiscount()`.

```
Arguments:
  id                             Discount ID

Options:
  --include <relations>          Comma-separated: store, variants, discount-redemptions
```

#### `lmsq discounts create`

Create a new discount. Maps to `createDiscount()`.

```
Options:
  --store-id <id>                (required) Store ID
  --name <name>                  (required) Discount name (for internal reference)
  --amount <number>              (required) Discount amount (percentage or fixed in cents)
  --amount-type <type>           (required) Amount type: "percent" or "fixed"
  --code <code>                  Discount code (default: auto-generated 8-char string)
  --is-limited-redemptions       Limit the number of redemptions
  --max-redemptions <number>     Maximum redemptions (required if --is-limited-redemptions)
  --starts-at <datetime>         Start date (ISO 8601 format)
  --expires-at <datetime>        Expiration date (ISO 8601 format)
  --duration <type>              Duration for recurring: "once", "repeating", "forever"
                                 (default: "once")
  --duration-in-months <number>  Number of months for "repeating" duration (default: 1)
  --is-limited-to-products       Limit to specific product variants
  --variant-ids <ids>            Comma-separated variant IDs (required if
                                 --is-limited-to-products)
  --test-mode                    Create in test mode
```

#### `lmsq discounts delete <id>`

Delete a discount. Maps to `deleteDiscount()`.

```
Arguments:
  id                             Discount ID
```

---

### 9.16 discount-redemptions

#### `lmsq discount-redemptions list`

List discount redemptions. Maps to `listDiscountRedemptions()`.

```
Options:
  --filter-discount-id <id>      Filter by discount ID
  --filter-order-id <id>         Filter by order ID
  --include <relations>          Comma-separated: discount, order
  --page <number>                Page number (default: 1)
  --page-size <number>           Results per page (default: 10, max: 100)
```

#### `lmsq discount-redemptions get <id>`

Get a specific discount redemption. Maps to `getDiscountRedemption()`.

```
Arguments:
  id                             Discount redemption ID

Options:
  --include <relations>          Comma-separated: discount, order
```

---

### 9.17 license-keys

#### `lmsq license-keys list`

List license keys. Maps to `listLicenseKeys()`.

```
Options:
  --filter-store-id <id>         Filter by store ID
  --filter-order-id <id>         Filter by order ID
  --filter-order-item-id <id>    Filter by order item ID
  --filter-product-id <id>       Filter by product ID
  --filter-status <status>       Filter by status: inactive, active, expired, disabled
  --include <relations>          Comma-separated: store, customer, order, order-item,
                                 product, license-key-instances
  --page <number>                Page number (default: 1)
  --page-size <number>           Results per page (default: 10, max: 100)
```

#### `lmsq license-keys get <id>`

Get a specific license key. Maps to `getLicenseKey()`.

```
Arguments:
  id                             License key ID

Options:
  --include <relations>          Comma-separated: store, customer, order, order-item,
                                 product, license-key-instances
```

#### `lmsq license-keys update <id>`

Update a license key. Maps to `updateLicenseKey()`.

```
Arguments:
  id                             License key ID

Options:
  --activation-limit <number>    Max activations (use "unlimited" for no limit)
  --expires-at <datetime>        Expiration date (ISO 8601 format, or "never" to clear)
  --disabled                     Disable the license key
  --enabled                      Enable the license key (sets disabled to false)
```

---

### 9.18 license-key-instances

#### `lmsq license-key-instances list`

List license key instances. Maps to `listLicenseKeyInstances()`.

```
Options:
  --filter-license-key-id <id>   Filter by license key ID
  --include <relations>          Comma-separated: license-key
  --page <number>                Page number (default: 1)
  --page-size <number>           Results per page (default: 10, max: 100)
```

#### `lmsq license-key-instances get <id>`

Get a specific license key instance. Maps to `getLicenseKeyInstance()`.

```
Arguments:
  id                             License key instance ID

Options:
  --include <relations>          Comma-separated: license-key
```

---

### 9.19 checkouts

#### `lmsq checkouts list`

List checkouts. Maps to `listCheckouts()`.

```
Options:
  --filter-store-id <id>         Filter by store ID
  --filter-variant-id <id>       Filter by variant ID
  --include <relations>          Comma-separated: store, variant
  --page <number>                Page number (default: 1)
  --page-size <number>           Results per page (default: 10, max: 100)
```

#### `lmsq checkouts get <id>`

Get a specific checkout. Maps to `getCheckout()`.

```
Arguments:
  id                             Checkout ID

Options:
  --include <relations>          Comma-separated: store, variant
```

#### `lmsq checkouts create`

Create a new checkout session. Maps to `createCheckout()`.

```
Options:
  --store-id <id>                    (required) Store ID
  --variant-id <id>                  (required) Variant ID
  --custom-price <cents>             Custom price in cents (positive integer)

  Product Options:
  --product-name <name>              Override product name
  --product-description <desc>       Override product description
  --product-media <urls>             Comma-separated media URLs
  --redirect-url <url>               Post-purchase redirect URL
  --receipt-button-text <text>       Receipt button text
  --receipt-link-url <url>           Receipt button link URL
  --receipt-thank-you-note <text>    Receipt thank-you note
  --enabled-variants <ids>           Comma-separated enabled variant IDs
  --confirmation-title <text>        Confirmation page title
  --confirmation-message <text>      Confirmation page message
  --confirmation-button-text <text>  Confirmation page button text

  Checkout Options:
  --embed                            Optimized for embedding
  --no-media                         Hide product media
  --no-logo                          Hide store logo
  --no-desc                          Hide product description
  --no-discount                      Hide discount code field
  --skip-trial                       Skip free trial
  --subscription-preview             Show subscription preview
  --background-color <hex>           Background color (hex)
  --button-color <hex>               Button color (hex)

  Checkout Data:
  --email <email>                    Pre-fill customer email
  --name <name>                      Pre-fill customer name
  --billing-country <code>           Billing country (ISO 3166-1 alpha-2)
  --billing-zip <zip>                Billing ZIP code
  --tax-number <number>              Tax/VAT number
  --discount-code <code>             Pre-apply discount code
  --custom <json>                    Custom data as JSON string

  Other:
  --preview                          Preview mode (returns price info, no real checkout)
  --test-mode                        Create in test mode
  --expires-at <datetime>            Checkout expiration (ISO 8601 format)
```

**Output**: Returns the checkout URL by default. Use `--pluck url` to get just the URL string. In JSON mode, returns the full checkout object.

---

### 9.20 webhooks

#### `lmsq webhooks list`

List webhooks. Maps to `listWebhooks()`.

```
Options:
  --filter-store-id <id>         Filter by store ID
  --include <relations>          Comma-separated: store
  --page <number>                Page number (default: 1)
  --page-size <number>           Results per page (default: 10, max: 100)
```

#### `lmsq webhooks get <id>`

Get a specific webhook. Maps to `getWebhook()`.

```
Arguments:
  id                             Webhook ID

Options:
  --include <relations>          Comma-separated: store
```

#### `lmsq webhooks create`

Create a webhook. Maps to `createWebhook()`.

```
Options:
  --store-id <id>                (required) Store ID
  --url <url>                    (required) Webhook endpoint URL
  --secret <secret>              (required) Webhook signing secret
  --events <events>              (required) Comma-separated events to subscribe to.
                                 Available events:
                                   order_created, order_refunded,
                                   subscription_created, subscription_updated,
                                   subscription_cancelled, subscription_resumed,
                                   subscription_expired, subscription_paused,
                                   subscription_unpaused,
                                   subscription_payment_success,
                                   subscription_payment_failed,
                                   subscription_payment_recovered,
                                   subscription_payment_refunded,
                                   license_key_created, license_key_updated,
                                   affiliate_activated
  --test-mode                    Create in test mode
```

#### `lmsq webhooks update <id>`

Update a webhook. Maps to `updateWebhook()`.

```
Arguments:
  id                             Webhook ID

Options:
  --url <url>                    New webhook endpoint URL
  --secret <secret>              New webhook signing secret
  --events <events>              Comma-separated events (same list as create)
```

#### `lmsq webhooks delete <id>`

Delete a webhook. Maps to `deleteWebhook()`.

```
Arguments:
  id                             Webhook ID
```

---

### 9.21 affiliates

> **Note**: The Lemon Squeezy API supports affiliates but the official SDK (v4.0.0) does not include affiliate functions. These commands use direct API calls.

#### `lmsq affiliates list`

List affiliates. Uses direct `GET /v1/affiliates` API call.

```
Options:
  --filter-store-id <id>         Filter by store ID
  --filter-user-email <email>    Filter by user email
  --page <number>                Page number (default: 1)
  --page-size <number>           Results per page (default: 5, max: 100)
```

#### `lmsq affiliates get <id>`

Get a specific affiliate. Uses direct `GET /v1/affiliates/:id` API call.

```
Arguments:
  id                             Affiliate ID
```

---

### 9.22 licenses (Public API)

These commands use the public license API and do **not** require an API key. They are intended for end-user license management.

#### `lmsq licenses activate`

Activate a license key. Maps to `activateLicense()`.

```
Options:
  --key <license-key>            (required) License key to activate
  --instance-name <name>         (required) Name for this activation instance
                                 (e.g. hostname, device name)
```

**Output**: Activation status, license key details, instance ID.

#### `lmsq licenses validate`

Validate a license key. Maps to `validateLicense()`.

```
Options:
  --key <license-key>            (required) License key to validate
  --instance-id <id>             Specific instance ID to validate (optional)
```

**Output**: Validation status (valid/invalid/expired/disabled), license meta, instance info.

#### `lmsq licenses deactivate`

Deactivate a license key instance. Maps to `deactivateLicense()`.

```
Options:
  --key <license-key>            (required) License key
  --instance-id <id>             (required) Instance ID to deactivate
```

---

## 10. Pagination

All `list` commands support pagination:

| Flag | Short | Description | Default |
|---|---|---|---|
| `--page <number>` | `-p` | Page number to fetch | 1 |
| `--page-size <number>` | `-s` | Number of results per page | 5 |
| `--first` | | Return only the first result | *(off)* |

The default page size is **5** (not 10 or 25) to keep output concise for AI agent consumption. Agents can request larger pages when needed with `--page-size 25`.

The `--first` flag is shorthand for `--page-size 1` and also changes the output shape — instead of a list with one item, it outputs as if it were a `get` command (no list wrapper, no pagination line).

### Pagination Display by Output Mode

**Text mode (non-TTY)** — compact metadata line:

```
[page 1/10, 47 total]
```

**Pretty mode (TTY)** — human-friendly with navigation hint:

```
Showing 1-5 of 47 results (page 1 of 10)
→ Use --page 2 to see the next page
```

**JSON mode** — metadata in `meta` object:

```json
{
  "data": [...],
  "meta": { "total": 47, "page": 1, "pageSize": 5, "pageCount": 10 }
}
```

**`--count` mode** — just the total, no data:

```
47
```

---

## 11. Relationship Includes

The `--include` flag accepts comma-separated relationship names and maps to the SDK's `include` parameter. Available relationships per resource:

| Resource | Available Includes |
|---|---|
| Stores | `products`, `orders`, `subscriptions`, `discounts`, `license-keys`, `webhooks` |
| Customers | `store`, `orders`, `subscriptions`, `license-keys` |
| Products | `store`, `variants` |
| Variants | `product`, `files`, `price-model` |
| Prices | `variant` |
| Files | `variant` |
| Orders | `store`, `customer`, `order-items`, `subscriptions`, `license-keys`, `discount-redemptions` |
| Order Items | `order`, `product`, `variant` |
| Subscriptions | `store`, `customer`, `order`, `order-item`, `product`, `variant`, `subscription-items`, `subscription-invoices` |
| Subscription Invoices | `store`, `subscription`, `customer` |
| Subscription Items | `subscription`, `price`, `usage-records` |
| Usage Records | `subscription-item` |
| Discounts | `store`, `variants`, `discount-redemptions` |
| Discount Redemptions | `discount`, `order` |
| License Keys | `store`, `customer`, `order`, `order-item`, `product`, `license-key-instances` |
| License Key Instances | `license-key` |
| Checkouts | `store`, `variant` |
| Webhooks | `store` |

| Affiliates | `store`, `user` |

Invalid include values produce a clear error listing the valid options for that resource.

---

## 12. Output Formatting

The CLI has four output modes. The default is chosen automatically based on whether stdout is an interactive terminal (TTY).

### Text Mode (default when non-TTY)

Optimized for AI agents and piping. No colors, no decoration, minimal tokens.

**`get` commands** — flat `key: value` pairs:

```
id: 12345
type: orders
status: paid
customer_email: alice@example.com
total: 4900
total_formatted: $49.00
currency: USD
created_at: 2025-01-15T14:30:00Z
updated_at: 2025-01-15T14:30:00Z
```

**`list` commands** — records separated by blank lines with a pagination footer:

```
id: 12345
status: paid
customer_email: alice@example.com
total: 4900

id: 12346
status: refunded
customer_email: bob@example.com
total: 2900

[page 1/10, 47 total]
```

**With `--fields id,status,total`:**

```
id: 12345
status: paid
total: 4900

id: 12346
status: refunded
total: 2900

[page 1/10, 47 total]
```

**With `--only-ids`:**

```
12345
12346
12347
12348
12349
[47 total]
```

**With `--count`:**

```
47
```

**With `--pluck status` (on a `get`):**

```
paid
```

### Pretty Mode (default when TTY)

For humans in an interactive terminal. Uses color, alignment, and visual structure.

**`list` commands** render a table:

```
 ID     Status     Customer Email         Total       Created
 ────── ────────── ────────────────────── ─────────── ──────────────────
 12345  paid       alice@example.com      $49.00      2025-01-15 14:30
 12346  refunded   bob@example.com        $29.00      2025-01-16 09:15

Showing 1-5 of 47 results (page 1 of 10)
→ Use --page 2 to see the next page
```

**`get` commands** render a detailed view:

```
Order #12345
═══════════════════════════════

  Status:          paid
  Customer Email:  alice@example.com
  Total:           $49.00 USD
  Tax:             $0.00
  Created:         January 15, 2025 at 2:30 PM
```

### JSON Mode (`--json`)

Clean, flattened JSON with JSON:API wrappers removed. Attributes are promoted to top-level.

**`get` commands:**

```json
{
  "id": "12345",
  "type": "orders",
  "status": "paid",
  "customer_email": "alice@example.com",
  "total": 4900
}
```

**`list` commands:**

```json
{
  "data": [
    { "id": "12345", "type": "orders", "status": "paid", "total": 4900 },
    { "id": "12346", "type": "orders", "status": "refunded", "total": 2900 }
  ],
  "meta": { "total": 47, "page": 1, "pageSize": 5, "pageCount": 10 }
}
```

`--fields` works with `--json` — only selected fields appear in each object (plus `id` and `type` always).

### JSON Raw Mode (`--json-raw`)

The unmodified JSON:API response from the Lemon Squeezy API. Useful for debugging or when full fidelity is required. This is the only mode that preserves relationship links, self links, and the JSON:API version header.

**Note**: `--fields` has no effect in `--json-raw` mode since the raw response is passed through unmodified.

---

## 13. Error Handling

### Error Display by Output Mode

**Text mode (non-TTY / AI agents):**

```
error: not_found
message: Order not found
status: 404
```

Compact, parseable, no decorative noise. Uses the same `key: value` format as successful output.

**Pretty mode (TTY / humans):**

```
✖ Error: Could not fetch order #99999

  API Error: Not found
  Status: 404

  Hint: Check that the order ID is correct and belongs to your store.
```

Includes color, the action context, and a human-friendly hint.

**JSON mode (`--json`):**

```json
{
  "error": "not_found",
  "message": "Order not found",
  "status": 404
}
```

### Exit Codes

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | API error (4xx/5xx) |
| `2` | Invalid usage (missing required flag, invalid argument) |
| `3` | Authentication error (no API key, invalid key) |
| `4` | Network error (connection failed, timeout) |

Distinct exit codes let AI agents branch on error type without parsing the output.

### Common Error Scenarios

| Scenario | Behavior |
|---|---|
| No API key configured | Exit 3 with instruction to run `lmsq auth login` |
| Invalid API key | Exit 3 suggesting to check the key |
| Resource not found | Exit 1, status 404 |
| Validation error | Exit 1, display validation messages with field names |
| Network error | Exit 4, suggest checking connection |
| Rate limited | Exit 1, display retry-after seconds if available |
| Missing required option | Exit 2, Commander's built-in error with the missing flag name |

---

## 14. SDK Function-to-CLI Mapping

Complete mapping of all 60 SDK functions to CLI commands:

| # | SDK Function | CLI Command |
|---|---|---|
| 1 | `lemonSqueezySetup()` | Internal — called automatically with stored API key |
| 2 | `getAuthenticatedUser()` | `lmsq user` |
| 3 | `getStore()` | `lmsq stores get <id>` |
| 4 | `listStores()` | `lmsq stores list` |
| 5 | `createCustomer()` | `lmsq customers create` |
| 6 | `updateCustomer()` | `lmsq customers update <id>` |
| 7 | `archiveCustomer()` | `lmsq customers archive <id>` |
| 8 | `getCustomer()` | `lmsq customers get <id>` |
| 9 | `listCustomers()` | `lmsq customers list` |
| 10 | `getProduct()` | `lmsq products get <id>` |
| 11 | `listProducts()` | `lmsq products list` |
| 12 | `getVariant()` | `lmsq variants get <id>` |
| 13 | `listVariants()` | `lmsq variants list` |
| 14 | `getPrice()` | `lmsq prices get <id>` |
| 15 | `listPrices()` | `lmsq prices list` |
| 16 | `getFile()` | `lmsq files get <id>` |
| 17 | `listFiles()` | `lmsq files list` |
| 18 | `getOrder()` | `lmsq orders get <id>` |
| 19 | `listOrders()` | `lmsq orders list` |
| 20 | `generateOrderInvoice()` | `lmsq orders invoice <id>` |
| 21 | `issueOrderRefund()` | `lmsq orders refund <id>` |
| 22 | `getOrderItem()` | `lmsq order-items get <id>` |
| 23 | `listOrderItems()` | `lmsq order-items list` |
| 24 | `getSubscription()` | `lmsq subscriptions get <id>` |
| 25 | `updateSubscription()` | `lmsq subscriptions update <id>` |
| 26 | `cancelSubscription()` | `lmsq subscriptions cancel <id>` |
| 27 | `listSubscriptions()` | `lmsq subscriptions list` |
| 28 | `getSubscriptionInvoice()` | `lmsq subscription-invoices get <id>` |
| 29 | `listSubscriptionInvoices()` | `lmsq subscription-invoices list` |
| 30 | `generateSubscriptionInvoice()` | `lmsq subscription-invoices generate <id>` |
| 31 | `issueSubscriptionInvoiceRefund()` | `lmsq subscription-invoices refund <id>` |
| 32 | `getSubscriptionItem()` | `lmsq subscription-items get <id>` |
| 33 | `getSubscriptionItemCurrentUsage()` | `lmsq subscription-items usage <id>` |
| 34 | `listSubscriptionItems()` | `lmsq subscription-items list` |
| 35 | `updateSubscriptionItem()` | `lmsq subscription-items update <id>` |
| 36 | `getUsageRecord()` | `lmsq usage-records get <id>` |
| 37 | `listUsageRecords()` | `lmsq usage-records list` |
| 38 | `createUsageRecord()` | `lmsq usage-records create` |
| 39 | `createDiscount()` | `lmsq discounts create` |
| 40 | `listDiscounts()` | `lmsq discounts list` |
| 41 | `getDiscount()` | `lmsq discounts get <id>` |
| 42 | `deleteDiscount()` | `lmsq discounts delete <id>` |
| 43 | `getDiscountRedemption()` | `lmsq discount-redemptions get <id>` |
| 44 | `listDiscountRedemptions()` | `lmsq discount-redemptions list` |
| 45 | `getLicenseKey()` | `lmsq license-keys get <id>` |
| 46 | `listLicenseKeys()` | `lmsq license-keys list` |
| 47 | `updateLicenseKey()` | `lmsq license-keys update <id>` |
| 48 | `getLicenseKeyInstance()` | `lmsq license-key-instances get <id>` |
| 49 | `listLicenseKeyInstances()` | `lmsq license-key-instances list` |
| 50 | `createCheckout()` | `lmsq checkouts create` |
| 51 | `getCheckout()` | `lmsq checkouts get <id>` |
| 52 | `listCheckouts()` | `lmsq checkouts list` |
| 53 | `createWebhook()` | `lmsq webhooks create` |
| 54 | `getWebhook()` | `lmsq webhooks get <id>` |
| 55 | `updateWebhook()` | `lmsq webhooks update <id>` |
| 56 | `deleteWebhook()` | `lmsq webhooks delete <id>` |
| 57 | `listWebhooks()` | `lmsq webhooks list` |
| 58 | `activateLicense()` | `lmsq licenses activate` |
| 59 | `validateLicense()` | `lmsq licenses validate` |
| 60 | `deactivateLicense()` | `lmsq licenses deactivate` |
| 61 | *(direct API call)* | `lmsq affiliates list` |
| 62 | *(direct API call)* | `lmsq affiliates get <id>` |

---

## 15. API Coverage & Known SDK Gaps

The CLI targets **complete Lemon Squeezy API coverage**. Most commands use the official `@lemonsqueezy/lemonsqueezy.js` SDK, but the SDK (v4.0.0) does not cover 100% of the API. The following are implemented via direct HTTP calls to fill the gaps:

### Covered via Direct API Calls (not in SDK)

| Feature | API Endpoint | CLI Command | Notes |
|---|---|---|---|
| List affiliates | `GET /v1/affiliates` | `lmsq affiliates list` | SDK has no affiliate support |
| Get affiliate | `GET /v1/affiliates/:id` | `lmsq affiliates get <id>` | SDK has no affiliate support |

### SDK Gaps Filled via Direct API Calls or Bypasses

Where the SDK doesn't expose an API feature, the CLI fills the gap with direct HTTP calls or type bypasses so the user has full API access:

| Feature | API Behavior | SDK Gap | CLI Implementation |
|---|---|---|---|
| Order `order_number` filter | `filter[order_number]` on `GET /v1/orders` | Not in `ListOrdersParams` | Direct API call with filter param appended |
| Invoice `locale` parameter | `locale` query param on invoice generation | Not in `GenerateOrderInvoiceParams` | Direct API call with locale param appended |
| `affiliate_activated` webhook event | Valid webhook event | Not in SDK `Events` type | Accept as string, bypass SDK type check |
| Full refund (no amount) | `amount` is optional (omit for full refund) | `amount` is required in SDK | Direct API call when `--amount` is omitted |

### Rate Limits

| API | Rate Limit |
|---|---|
| Main API (`/v1/*`) | 300 requests/minute |
| License API (`/v1/licenses/*`) | 60 requests/minute |

---

## 16. Testing Strategy (TDD Red-Green)

The CLI is developed using strict Test-Driven Development. Tests are written **before** implementation. The test runner is `bun:test` (built into Bun, zero extra dependencies).

### Test Layers

| Layer | What | Mocking | Tests |
|---|---|---|---|
| **Core Logic** | Formatters, field selection, JSON flattening, error formatting | None — pure functions | `test/formatters/`, `test/fields.test.ts`, `test/errors.test.ts` |
| **Command Wiring** | CLI args → correct SDK function + params | Mock SDK functions | `test/commands/` |
| **Integration** | End-to-end: spawn `lmsq` binary, assert stdout + exit code | Mock HTTP layer | `test/integration/` |

### Layer 1: Core Logic (pure functions, no mocking)

These tests define the exact input→output contracts for every formatting and data transformation function. They are the foundation — everything else builds on these.

**JSON Flattening** (`test/formatters/json.test.ts`):
- `flattenResource()` — given a raw JSON:API single-resource response, assert it produces `{id, type, ...attributes}` with no `jsonapi`, `links`, `relationships` wrappers
- `flattenListResponse()` — given a raw JSON:API list response, assert each item is flattened and `meta.page` is simplified to `{total, page, pageSize, pageCount}`

**Text Formatting** (`test/formatters/text.test.ts`):
- `formatResourceAsText()` — assert `key: value` lines, no ANSI codes, no decorative chars
- `formatListAsText()` — assert blank-line-separated blocks with `[page X/Y, N total]` footer
- `formatIdsAsText()` — assert one ID per line with `[N total]` footer
- `formatCountAsText()` — assert bare number string
- `formatPluckAsText()` — assert bare value string
- All with `--fields` filtering behavior

**Field Selection** (`test/fields.test.ts`):
- `selectFields()` — assert correct filtering, `id` always included, throws on invalid fields with helpful message listing valid fields
- `pluckField()` — assert single value extraction, throws on missing field
- `extractIds()` — assert ID extraction from resource arrays

**Error Formatting** (`test/errors.test.ts`):
- `formatErrorAsText()` — assert compact `key: value` error output, no decoration
- `formatErrorAsJson()` — assert valid JSON with correct fields
- `getExitCode()` — assert correct exit codes: 0 (success), 1 (API), 2 (usage), 3 (auth), 4 (network)

### Layer 2: Command Wiring (mock SDK)

Each command file gets a test that:
1. Mocks the relevant SDK function(s)
2. Invokes the command with specific CLI args
3. Asserts the SDK was called with the correct parameters (filters, includes, pagination)
4. Asserts the output was formatted correctly

```typescript
// Example: test/commands/orders.test.ts
import { mock } from "bun:test";

test("orders list passes filters to SDK", async () => {
  const mockListOrders = mock(() => Promise.resolve({ data: ..., error: null }));
  // Register mock, invoke command, assert:
  expect(mockListOrders).toHaveBeenCalledWith({
    filter: { storeId: "123" },
    page: { number: 1, size: 5 },
  });
});
```

### Layer 3: Integration (end-to-end)

Spawn the actual `lmsq` binary as a subprocess and assert on stdout, stderr, and exit code:

```typescript
// Example: test/integration/orders.test.ts
import { $ } from "bun";

test("orders get with --pluck returns bare value", async () => {
  const result = await $`./bin/lmsq.ts orders get 12345 --pluck status`.quiet();
  expect(result.stdout.toString().trim()).toBe("paid");
  expect(result.exitCode).toBe(0);
});
```

### Running Tests

```bash
bun test              # Run all tests
bun test --watch      # Re-run on file changes (TDD workflow)
bun test test/formatters  # Run only formatter tests
```

### TDD Workflow

1. **Red**: Write a test for the next behavior. Run `bun test` — it fails.
2. **Green**: Write the minimal implementation to make the test pass.
3. **Refactor**: Clean up the implementation while keeping tests green.
4. **Repeat**: Move to the next behavior.

The implementation order follows the dependency graph:

```
1. src/formatters/json.ts    (JSON flattening — no deps)
2. src/fields.ts             (field selection — no deps)
3. src/errors.ts             (error formatting — no deps)
4. src/formatters/text.ts    (text output — uses fields.ts)
5. src/formatters/pretty.ts  (pretty output — uses fields.ts)
6. src/output.ts             (mode routing — uses all formatters)
7. src/config.ts             (API key storage)
8. src/api.ts                (direct API client for SDK gaps)
9. src/commands/*.ts          (each command — uses output + SDK/api)
10. src/cli.ts               (root program — registers all commands)
11. bin/lmsq.ts              (entry point)
```

---

*This spec covers 100% of the Lemon Squeezy API surface area: 60 SDK functions + 2 direct API calls = 62 operations mapped to 59 CLI subcommands across 22 command groups. All output is AI-agent optimized by default with field selection, precision retrieval, flattened JSON, and automatic non-TTY detection.*
