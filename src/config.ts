/**
 * API key storage and retrieval.
 *
 * Resolution order:
 * 1. LEMONSQUEEZY_API_KEY environment variable
 * 2. ~/.config/lemonsqueezy-cli/config.json
 * 3. Error with instructions
 */

import {
	existsSync,
	mkdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync
} from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface Config {
	apiKey: string
}

function getConfigDir(): string {
	return join(homedir(), '.config', 'lemonsqueezy-cli')
}

function getConfigPath(): string {
	return join(getConfigDir(), 'config.json')
}

export function getApiKey(override?: string): string {
	if (override) return override

	const envKey = process.env.LEMONSQUEEZY_API_KEY
	if (envKey) return envKey

	const configPath = getConfigPath()
	if (existsSync(configPath)) {
		const raw = readFileSync(configPath, 'utf-8')
		const config: Config = JSON.parse(raw)
		if (config.apiKey) return config.apiKey
	}

	throw new Error(
		'No API key configured. Run `lmsq auth login` or set LEMONSQUEEZY_API_KEY.'
	)
}

export function getApiKeySource(override?: string): string {
	if (override) return 'flag'
	if (process.env.LEMONSQUEEZY_API_KEY) return 'env'
	const configPath = getConfigPath()
	if (existsSync(configPath)) return 'config'
	return 'none'
}

export function saveApiKey(apiKey: string): void {
	const dir = getConfigDir()
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true })
	}
	const config: Config = { apiKey }
	writeFileSync(getConfigPath(), `${JSON.stringify(config, null, 2)}\n`)
}

export function removeApiKey(): void {
	const configPath = getConfigPath()
	if (existsSync(configPath)) {
		unlinkSync(configPath)
	}
}

export function maskKey(key: string): string {
	if (key.length <= 8) return '****'
	return `${key.slice(0, 8)}…${'*'.repeat(8)}`
}
