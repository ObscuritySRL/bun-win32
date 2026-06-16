#!/usr/bin/env bun
/**
 * published-deps.ts — pre-publish gate: every workspace:* dependency a publishable
 * package declares will be pinned by `bun publish` to the DEPENDENCY's current
 * workspace version (workspace:* -> that exact version). If that version was bumped
 * locally but never published to npm, the published package installs BROKEN — the
 * exact failure that shipped in bun-uia@1.6.0 (it pinned @bun-win32/shcore@1.0.1 and
 * @bun-win32/shell32@1.0.8, which existed only in the workspace, not on npm).
 *
 * preflight.ts is OFFLINE (lockfile <-> package.json) and cannot see this: the dep's
 * package.json version matched the lockfile fine — it just wasn't on the registry.
 *
 * This gate resolves each @bun-win32/* dependency to the version bun publish would pin
 * (the dep package's workspace package.json version) and verifies that version exists
 * on npm. It ALSO verifies packages/uia mcp.ts SERVER_INFO.version matches its
 * package.json (the serverInfo drift that shipped 1.6.0 reporting "1.5.0").
 *
 * Run before every publish (after preflight). Non-zero exit on any problem.
 *
 * Usage:
 *   bun run scripts/published-deps.ts
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const PACKAGES = join(ROOT, 'packages');

interface Pkg {
  dir: string;
  name: string;
  version: string;
  private: boolean;
  dependencies: Record<string, string>;
}

const pkgs: Pkg[] = [];
for (const dir of readdirSync(PACKAGES)) {
  const file = join(PACKAGES, dir, 'package.json');
  try {
    const json = JSON.parse(readFileSync(file, 'utf-8'));
    pkgs.push({ dir, name: json.name, version: json.version, private: json.private === true, dependencies: json.dependencies ?? {} });
  } catch {}
}

// name -> the version bun publish will pin a workspace:* reference to (the dep's current workspace version)
const workspaceVersion = new Map<string, string>();
for (const p of pkgs) workspaceVersion.set(p.name, p.version);

const published = new Map<string, Set<string>>(); // name -> published versions on npm
async function publishedVersions(name: string): Promise<Set<string>> {
  const cached = published.get(name);
  if (cached !== undefined) return cached;
  const set = new Set<string>();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2F')}`);
      if (res.ok) {
        const data = (await res.json()) as { versions?: Record<string, unknown> };
        for (const v of Object.keys(data.versions ?? {})) set.add(v);
        break;
      }
      if (res.status === 404) break; // never published
    } catch {
      await Bun.sleep(800);
    }
  }
  published.set(name, set);
  return set;
}

const problems: string[] = [];

// Optional scope: `bun run scripts/published-deps.ts @bun-win32/uia bun-uia` checks only those packages' pins (the
// release set). With no args, every publishable package is checked (the @bun-win32/all aggregator will flag every
// binding bumped past npm — expected; pass the release set to focus).
const scope = new Set(Bun.argv.slice(2));

for (const p of pkgs) {
  if (p.private) continue; // not published
  if (scope.size > 0 && !scope.has(p.name)) continue;
  for (const [dep, range] of Object.entries(p.dependencies)) {
    if (!dep.startsWith('@bun-win32/') && dep !== 'bun-uia') continue;
    if (!range.startsWith('workspace:')) continue; // only workspace:* gets re-pinned
    const pinned = workspaceVersion.get(dep);
    if (pinned === undefined) {
      problems.push(`${p.name}: dep ${dep} is workspace:* but no such workspace package found`);
      continue;
    }
    if (scope.has(dep)) continue; // a dep being published in THIS batch (release set) will exist by the time dependents resolve
    const vers = await publishedVersions(dep);
    if (!vers.has(pinned)) {
      problems.push(`${p.name} -> ${dep}@${pinned}: bun publish will pin this, but it is NOT on npm (latest there: ${[...vers].sort().pop() ?? 'none'}). Publish ${dep}@${pinned} first.`);
    }
  }
}

// SERVER_INFO drift: packages/uia mcp.ts must report its own package.json version.
try {
  const mcp = readFileSync(join(PACKAGES, 'uia', 'mcp.ts'), 'utf-8');
  const uiaVersion = workspaceVersion.get('@bun-win32/uia');
  const m = /SERVER_INFO\s*=\s*\{[^}]*version:\s*'([^']+)'/.exec(mcp);
  if (m === null) problems.push('packages/uia/mcp.ts: SERVER_INFO version literal not found');
  else if (uiaVersion !== undefined && m[1] !== uiaVersion) problems.push(`packages/uia/mcp.ts SERVER_INFO.version='${m[1]}' but package.json='${uiaVersion}' — bump the SERVER_INFO literal to match.`);
} catch {
  problems.push('packages/uia/mcp.ts not readable for SERVER_INFO check');
}

if (problems.length > 0) {
  console.error(`\n✗ PUBLISHED-DEPS GATE — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error('\n  A published package would install broken (or mis-report its version). Fix before publishing.\n');
  process.exit(1);
}

console.log('✓ Every workspace:* pin resolves to a published npm version; uia SERVER_INFO matches package.json.');
process.exit(0);
