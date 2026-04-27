import { readFile, readdir } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const srcDir = resolve(rootDir, 'src');
const visibleEscapePattern = /\\u00[0-9a-f]{2}/gi;
const technicalExceptions = [
  {
    filePath: 'src/lib/invoiceParser.ts',
    pattern: /\\u00a0/i,
    reason: 'normalizacao tecnica do parser para espaco nao separavel',
  },
];
const errors = [];

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = extname(entry.name);

    if (!['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md'].includes(extension)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function isVisualTsx(filePath) {
  return extname(filePath) === '.tsx';
}

function findTechnicalException(filePath, escapedText) {
  const relativePath = relative(rootDir, filePath).replace(/\\/g, '/');

  return technicalExceptions.find((exception) => {
    return exception.filePath === relativePath && exception.pattern.test(escapedText);
  });
}

function registerError(filePath, lineNumber, match, reason) {
  errors.push({
    filePath: relative(rootDir, filePath),
    lineNumber,
    match,
    reason,
  });
}

const files = await collectFiles(srcDir);

for (const filePath of files) {
  const content = await readFile(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const matches = [...line.matchAll(visibleEscapePattern)];

    if (matches.length === 0) {
      return;
    }

    for (const match of matches) {
      const escapedText = match[0];
      const exception = findTechnicalException(filePath, escapedText);

      if (isVisualTsx(filePath)) {
        registerError(
          filePath,
          index + 1,
          escapedText,
          'escape Unicode visivel em arquivo .tsx. Troque pelo caractere UTF-8 real para nao vazar para a UI.',
        );
        continue;
      }

      if (exception) {
        continue;
      }

      registerError(
        filePath,
        index + 1,
        escapedText,
        'escape Unicode encontrado sem excecao tecnica explicita. So casos listados no script, como parser/normalizacao/PDF, podem usar esse padrao.',
      );
    }
  });
}

if (errors.length > 0) {
  console.error('check:copy-encoding falhou.\n');

  for (const error of errors) {
    console.error(`- ${error.filePath}:${error.lineNumber} -> ${error.match}`);
    console.error(`  ${error.reason}`);
  }

  process.exit(1);
}

console.log('check:copy-encoding passou. Nenhum escape Unicode visivel encontrado em src/.');
