#!/usr/bin/env node
/**
 * luhn MCP server. Three tools: `verify`, `checksum`, `complete`.
 *
 * Luhn (mod-10) algorithm — checksum used by credit cards, IMEI, Canadian
 * SIN, US NPI, and many other ID schemes. Spaces and dashes in input are
 * stripped; everything else must be ASCII digits.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const VERSION = '0.1.0';

function digits(input: string): number[] {
  const trimmed = input.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(trimmed)) throw new Error('input must be digits (spaces and dashes allowed)');
  return Array.from(trimmed).map((c) => c.charCodeAt(0) - 48);
}

/** Standard Luhn check: walk right-to-left, double every other digit, sum. */
export function verify(input: string): boolean {
  const ds = digits(input);
  if (ds.length < 2) return false;
  let sum = 0;
  for (let i = ds.length - 1; i >= 0; i--) {
    const fromRight = ds.length - 1 - i;
    let d = ds[i];
    if (fromRight % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** Compute the Luhn check digit that should appear at the rightmost position. */
export function checksum(input: string): number {
  const ds = digits(input);
  // Append a 0 placeholder; the digit needed is (10 - sum % 10) % 10.
  let sum = 0;
  for (let i = ds.length - 1; i >= 0; i--) {
    const fromRight = ds.length - i; // shifted because we'll append one more digit
    let d = ds[i];
    if (fromRight % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/** Append the Luhn check digit to a number that's missing it. */
export function complete(input: string): string {
  return input.replace(/[\s-]/g, '') + String(checksum(input));
}

const server = new Server({ name: 'luhn', version: VERSION }, { capabilities: { tools: {} } });

const TOOLS = [
  {
    name: 'verify',
    description: 'Run the Luhn check on a number. Spaces and dashes in input are ignored.',
    inputSchema: {
      type: 'object',
      properties: { input: { type: 'string' } },
      required: ['input'],
    },
  },
  {
    name: 'checksum',
    description: 'Compute the Luhn check digit (the digit that would make the input check-valid).',
    inputSchema: {
      type: 'object',
      properties: { input: { type: 'string' } },
      required: ['input'],
    },
  },
  {
    name: 'complete',
    description: 'Append the Luhn check digit to an input that lacks one.',
    inputSchema: {
      type: 'object',
      properties: { input: { type: 'string' } },
      required: ['input'],
    },
  },
] as const;

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    const a = args as unknown as { input: string };
    if (name === 'verify') return jsonResult({ valid: verify(a.input) });
    if (name === 'checksum') return jsonResult({ check_digit: checksum(a.input) });
    if (name === 'complete') return jsonResult({ complete: complete(a.input) });
    return errorResult('unknown tool: ' + name);
  } catch (err) {
    return errorResult('luhn failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`luhn MCP server v${VERSION} ready on stdio\n`);
}
