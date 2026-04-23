import { mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testEntry = resolve(rootDir, 'src/lib/mvpJourneyState.test.ts');
const outputDir = resolve(rootDir, 'node_modules/.cache/domain-tests');
const outputFile = resolve(outputDir, 'mvpJourneyState.test.mjs');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await build({
  entryPoints: [testEntry],
  outfile: outputFile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  sourcemap: 'inline',
  absWorkingDir: rootDir,
  alias: {
    '@': resolve(rootDir, 'src'),
  },
  external: ['node:test', 'node:assert/strict'],
});

const testProcess = spawn(process.execPath, ['--test', outputFile], {
  stdio: 'inherit',
});

testProcess.on('exit', (code) => {
  process.exit(code ?? 1);
});
