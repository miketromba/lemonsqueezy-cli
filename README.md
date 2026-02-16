<p align="center">
  <img src="assets/banner.png" alt="lmsq — Lemon Squeezy CLI" width="100%">
</p>

> **Unofficial** — this project is not affiliated with or endorsed by [Lemon Squeezy](https://lemonsqueezy.com). It is a community-built tool powered by the official [TypeScript SDK](https://github.com/lmsqueezy/lemonsqueezy.js).

Comprehensive command-line interface for the [Lemon Squeezy API](https://docs.lemonsqueezy.com/api). Full API coverage with AI-agent optimized output.

## Features

- **Complete API coverage** — 62 operations across 22 resource types (stores, orders, subscriptions, license keys, checkouts, webhooks, and more)
- **AI-agent optimized** — flat `key: value` output by default, `--fields` to select specific attributes, `--only-ids` / `--count` / `--pluck` for minimal output
- **Works everywhere** — ships as a single 111 KB JS file, installs via npm/npx/yarn/pnpm/bun (Node.js 18+). Standalone binaries also available.
- **Developer-friendly** — comprehensive `--help` on every command, consistent patterns, descriptive error messages
- **Multiple output modes** — auto-detects TTY for colored tables vs. token-efficient text. `--json` for clean flattened JSON.

---

## Give it to your AI agent

Install the [Agent Skill](https://agentskills.io) so your AI assistant knows how to use `lmsq` — all commands, flags, output modes, and best practices:

```bash
npx skills add miketromba/lemonsqueezy-cli
```

That's it. Your assistant can now manage your Lemon Squeezy store from any conversation.

---

## Installation

### npm (recommended)

```bash
npm install -g lmsq
```

Works with any package manager — Node.js 18+ required:

```bash
npm install -g lmsq   # npm
yarn global add lmsq  # yarn
pnpm add -g lmsq     # pnpm
bun add -g lmsq      # bun
```

Or run without installing:

```bash
npx lmsq --help
```

**Verify:**

```bash
lmsq --version
```

### Standalone Binary (no runtime needed)

Download a pre-built binary from [GitHub Releases](https://github.com/lemonsqueezy-cli/lemonsqueezy-cli/releases) — no Node.js or Bun required.

<details>
<summary>macOS / Linux / Windows install commands</summary>

**macOS (Apple Silicon):**
```bash
curl -fsSL https://github.com/lemonsqueezy-cli/lemonsqueezy-cli/releases/latest/download/lmsq-darwin-arm64 -o lmsq
chmod +x lmsq && sudo mv lmsq /usr/local/bin/
```

**macOS (Intel):**
```bash
curl -fsSL https://github.com/lemonsqueezy-cli/lemonsqueezy-cli/releases/latest/download/lmsq-darwin-x64 -o lmsq
chmod +x lmsq && sudo mv lmsq /usr/local/bin/
```

**Linux (x64):**
```bash
curl -fsSL https://github.com/lemonsqueezy-cli/lemonsqueezy-cli/releases/latest/download/lmsq-linux-x64 -o lmsq
chmod +x lmsq && sudo mv lmsq /usr/local/bin/
```

**Linux (ARM64):**
```bash
curl -fsSL https://github.com/lemonsqueezy-cli/lemonsqueezy-cli/releases/latest/download/lmsq-linux-arm64 -o lmsq
chmod +x lmsq && sudo mv lmsq /usr/local/bin/
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "https://github.com/lemonsqueezy-cli/lemonsqueezy-cli/releases/latest/download/lmsq-windows-x64.exe" -OutFile "$env:LOCALAPPDATA\lmsq.exe"
```

</details>

### From Source

```bash
git clone https://github.com/lemonsqueezy-cli/lemonsqueezy-cli.git
cd lemonsqueezy-cli
bun install
bun run dev -- --help    # run from source (requires Bun)
```

---

## Quick Start

```bash
# 1. Authenticate with your Lemon Squeezy API key
lmsq auth login --key lsq_live_xxxxxxxxxxxx

# 2. Verify
lmsq auth status
lmsq user

# 3. Start using it
lmsq stores list
lmsq orders list --page-size 3
lmsq subscriptions list --filter-status active --count
```

## Usage Examples

```bash
# Get a specific order
lmsq orders get 12345

# List active subscriptions (just IDs)
lmsq subscriptions list --filter-status active --only-ids

# Get a subscription status (bare value — 1 token)
lmsq subscriptions get 456 --pluck status

# List orders with specific fields only
lmsq orders list --fields status,total,user_email

# Create a checkout
lmsq checkouts create --store-id 1 --variant-id 1

# Create a discount
lmsq discounts create --store-id 1 --name "Launch Sale" --amount 20 --amount-type percent

# Issue a full refund
lmsq orders refund 12345

# Activate a license (public API, no auth needed)
lmsq licenses activate --key XXXXX-XXXXX-XXXXX --instance-name "my-server"

# Get clean JSON output
lmsq orders get 12345 --json

# Get raw JSON:API response
lmsq orders get 12345 --json-raw
```

## Output Modes

The CLI auto-detects whether stdout is an interactive terminal:

- **TTY (terminal)** — colored tables with pagination hints
- **Non-TTY (piped/AI agent)** — flat `key: value` lines, no colors, no decoration

Override with flags:

| Flag | Effect |
|------|--------|
| `--json` | Clean flattened JSON (no JSON:API wrappers) |
| `--json-raw` | Full unmodified API response |
| `-f, --fields id,status,email` | Only return specific attributes |
| `--only-ids` | One ID per line (list commands) |
| `--count` | Just the total count (list commands) |
| `--pluck status` | Just the bare value (get commands) |
| `--first` | Return only the first result (list commands) |
| `-p, --page N` | Page number (default: 1) |
| `-s, --page-size N` | Results per page (default: 5, max: 100) |

## Commands

```
lmsq auth              login / logout / status
lmsq user              Show authenticated user
lmsq stores            list / get
lmsq customers         list / get / create / update / archive
lmsq products          list / get
lmsq variants          list / get
lmsq prices            list / get
lmsq files             list / get
lmsq orders            list / get / invoice / refund
lmsq order-items       list / get
lmsq subscriptions     list / get / update / cancel
lmsq subscription-invoices  list / get / generate / refund
lmsq subscription-items     list / get / update / usage
lmsq usage-records     list / get / create
lmsq discounts         list / get / create / delete
lmsq discount-redemptions   list / get
lmsq license-keys      list / get / update
lmsq license-key-instances  list / get
lmsq checkouts         list / get / create
lmsq webhooks          list / get / create / update / delete
lmsq affiliates        list / get
lmsq licenses          activate / validate / deactivate
```

Every command has full `--help`. Drill down for details:

```bash
lmsq --help                       # All command groups
lmsq subscriptions --help         # All subscription actions
lmsq subscriptions update --help  # All update options
```

## Authentication

```bash
# Interactive (prompts for key)
lmsq auth login

# Direct
lmsq auth login --key lsq_live_xxxxxxxxxxxx

# Environment variable (CI/CD, scripts, AI agents)
export LEMONSQUEEZY_API_KEY=lsq_live_xxxxxxxxxxxx

# Per-command override
lmsq stores list --api-key lsq_test_xxxxxxxxxxxx
```

**Resolution order:** `--api-key` flag > `LEMONSQUEEZY_API_KEY` env var > `~/.config/lemonsqueezy-cli/config.json`

## AI Agent Usage

The CLI is designed as a first-class tool for LLMs, coding assistants, and autonomous agents. When called via shell tools (non-TTY), output is automatically token-efficient:

```bash
# ~3 tokens
lmsq subscriptions list --filter-status active --count
# 47

# ~20 tokens per resource
lmsq orders list --fields id,status,total
# id: 12345
# status: paid
# total: 4900
#
# id: 12346
# status: refunded
# total: 2900
#
# [page 1/10, 47 total]

# 1 token
lmsq subscriptions get 456 --pluck status
# active
```

**Token savings by output mode:**

| Mode | Tokens per resource |
|------|-------------------|
| `--json-raw` (full JSON:API) | ~2,000 |
| `--json` (flattened) | ~200 |
| Default text (all fields) | ~150 |
| `--fields id,status` | ~20 |
| `--only-ids` | ~5 |
| `--count` | ~3 total |

## Supported Platforms

**npm install** works on any platform with Node.js 18+.

Standalone binaries are available for:

| Platform | Architecture | Binary |
|----------|-------------|--------|
| macOS | Apple Silicon (ARM64) | `lmsq-darwin-arm64` |
| macOS | Intel (x64) | `lmsq-darwin-x64` |
| Linux | x64 | `lmsq-linux-x64` |
| Linux | ARM64 | `lmsq-linux-arm64` |
| Windows | x64 | `lmsq-windows-x64.exe` |

## Development

Requires [Bun](https://bun.sh) for development (the published package only needs Node.js).

```bash
git clone https://github.com/lemonsqueezy-cli/lemonsqueezy-cli.git
cd lemonsqueezy-cli
bun install

bun test                # 59 tests, ~14ms
bun test --watch        # TDD workflow
bun run lint            # Biome linter
bun run typecheck       # TypeScript check
bun run dev -- --help   # Run from source (Bun)

bun run build           # Bundle for Node → dist/lmsq.js (111 KB)
node dist/lmsq.js --help  # Verify the Node bundle works

bun run build:compile       # Standalone binary for your platform
bun run build:compile:all   # Standalone binaries for all platforms
```

### How the build works

`bun run build` compiles all TypeScript source + all dependencies into a single `dist/lmsq.js` file (~111 KB) with a `#!/usr/bin/env node` shebang. Zero runtime dependencies — everything is inlined. This is what gets published to npm.

`prepublishOnly` runs the build automatically before `npm publish`, so you can never accidentally publish without building.

## License

MIT
