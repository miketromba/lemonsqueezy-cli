#!/usr/bin/env bun
/**
 * lmsq — Lemon Squeezy CLI entry point.
 */

import { createProgram } from '../src/cli.ts'

const program = createProgram()
program.parse(process.argv)
