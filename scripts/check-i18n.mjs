#!/usr/bin/env node
/**
 * Static i18n coverage gate.
 *
 * This deliberately does not require translated values to differ from the
 * English msgid: English fallback is a valid, reviewable state while copy is
 * being translated. It does require every extracted msgid to have a generated
 * resource entry, and reports user-facing literals that bypass the copy layer.
 *
 * Usage: node scripts/check-i18n.mjs
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { COPY_LOCALES, collectMsgids, findHardcodedCopy, sourceFiles } from './lib/i18n-scan.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(repoRoot, 'src');
const copyRoot = path.join(srcRoot, 'lib', 'i18n', 'tool-copy', 'resources');
const sharedNames = { 'zh-CN': 'SHARED_ZH_CN', 'zh-TW': 'SHARED_ZH_TW', ko: 'SHARED_KO', ja: 'SHARED_JA' };

const errors = [];
const hardcoded = [];
const dynamic = [];
const relative = (file) => path.relative(repoRoot, file).split(path.sep).join('/');
const addError = (file, message) => errors.push(`${relative(file)}: ${message}`);

function parse(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  for (const diagnostic of source.parseDiagnostics) {
    const position = diagnostic.start == null ? 0 : diagnostic.start;
    const line = source.getLineAndCharacterOfPosition(position).line + 1;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
    addError(file, `line ${line}: malformed TypeScript (${message})`);
  }
  return source;
}

function keyOf(name) {
  return name && (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) ? name.text : null;
}

/** Return object entries while detecting syntax that the generator cannot represent. */
function objectEntries(file, node, label) {
  const entries = new Map();
  if (!node || !ts.isObjectLiteralExpression(node)) {
    addError(file, `${label} must be an object literal`);
    return entries;
  }
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) {
      addError(file, `${label} contains a non-property entry`);
      continue;
    }
    const key = keyOf(property.name);
    if (key === null) {
      addError(file, `${label} contains a computed or unsupported key`);
      continue;
    }
    if (entries.has(key)) addError(file, `${label} contains duplicate key ${JSON.stringify(key)}`);
    entries.set(key, property);
  }
  return entries;
}

function namedObject(file, name) {
  const source = parse(file);
  let found;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && keyOf(node.name) === name) found = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!found) addError(file, `missing generated export object ${name}`);
  return found;
}

function literalValue(property) {
  const value = property?.initializer;
  return value && (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) ? value.text : null;
}

function expectedKeys(entries, expected, file, label) {
  const actual = [...entries.keys()].sort((a, b) => a.localeCompare(b));
  const wanted = [...expected].sort((a, b) => a.localeCompare(b));
  for (const key of wanted) if (!entries.has(key)) addError(file, `${label} is missing msgid ${JSON.stringify(key)}`);
  for (const key of actual) if (!expected.has(key)) addError(file, `${label} has stale msgid ${JSON.stringify(key)}`);
  return actual;
}

function checkToolResource(resource, msgids) {
  const file = path.join(copyRoot, `${resource}.ts`);
  if (!existsSync(file)) {
    addError(file, `missing generated resource for ${resource}`);
    return;
  }
  const root = objectEntries(file, namedObject(file, 'COPY'), 'COPY');
  for (const locale of COPY_LOCALES) {
    const localeEntry = root.get(locale);
    const localeObject = localeEntry?.initializer;
    const messages = objectEntries(file, localeObject, `COPY.${locale}`);
    expectedKeys(messages, msgids, file, `COPY.${locale}`);
    for (const [msgid, property] of messages) {
      if (literalValue(property) === null) addError(file, `COPY.${locale}.${JSON.stringify(msgid)} must be a string literal`);
    }
  }
}

function checkSharedResource(msgids) {
  for (const locale of COPY_LOCALES) {
    const file = path.join(copyRoot, 'shared', `${locale}.ts`);
    if (!existsSync(file)) {
      addError(file, `missing generated shared resource for ${locale}`);
      continue;
    }
    const root = objectEntries(file, namedObject(file, sharedNames[locale]), sharedNames[locale]);
    expectedKeys(root, msgids, file, sharedNames[locale]);
    for (const [msgid, property] of root) {
      if (literalValue(property) === null) addError(file, `${sharedNames[locale]}.${JSON.stringify(msgid)} must be a string literal`);
    }
  }
}

function checkRegistry(resources) {
  const file = path.join(copyRoot, 'registry.ts');
  if (!existsSync(file)) {
    addError(file, 'missing generated tool-copy registry');
    return;
  }
  const root = objectEntries(file, namedObject(file, 'TOOL_COPY_LOADERS'), 'TOOL_COPY_LOADERS');
  expectedKeys(root, new Set(resources), file, 'TOOL_COPY_LOADERS');
  for (const [resource, property] of root) {
    const source = property.initializer?.getText() ?? '';
    if (!source.includes(`import('./${resource}')`) && !source.includes(`import("./${resource}")`)) {
      addError(file, `TOOL_COPY_LOADERS.${JSON.stringify(resource)} does not import ./${resource}`);
    }
  }
}

const requested = new Map();
const sharedMsgids = new Set();
for (const file of sourceFiles(srcRoot)) {
  const scan = collectMsgids(file, repoRoot);
  dynamic.push(...scan.dynamic);
  // Resource imports may include the generated `resources/` directory; the
  // registry key and generated filename are the tool id itself.
  const resource = scan.resource.replace(/^resources\//, '');
  for (const msgid of scan.msgids) {
    if (!requested.has(resource)) requested.set(resource, new Set());
    requested.get(resource).add(msgid);
    if (resource === 'shared') sharedMsgids.add(msgid);
  }
  hardcoded.push(...findHardcodedCopy(file, repoRoot));
}

const resources = [...requested.keys()].filter((resource) => resource !== 'shared').sort();
for (const resource of resources) checkToolResource(resource, requested.get(resource));
checkSharedResource(sharedMsgids);
checkRegistry(resources);

// A resource module with no corresponding source msgids is stale and can hide a
// removed route's copy. Keep this check separate so its filename is actionable.
if (existsSync(copyRoot)) {
  for (const entry of readdirSync(copyRoot, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'registry.ts') {
      const resource = entry.name.slice(0, -3);
      if (!requested.has(resource)) addError(path.join(copyRoot, entry.name), `stale generated resource ${resource}`);
    }
  }
  const sharedRoot = path.join(copyRoot, 'shared');
  if (existsSync(sharedRoot)) {
    for (const entry of readdirSync(sharedRoot, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.ts') && !COPY_LOCALES.includes(entry.name.slice(0, -3))) {
        addError(path.join(sharedRoot, entry.name), 'unexpected generated shared resource');
      }
    }
  }
}

hardcoded.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.text.localeCompare(b.text));
dynamic.sort();
errors.sort((a, b) => a.localeCompare(b));

console.log(`[i18n-check] scanned ${sourceFiles(srcRoot).length} source files`);
console.log(`[i18n-check] found ${requested.size ? [...requested.values()].reduce((sum, keys) => sum + keys.size, 0) : 0} msgids across ${requested.size} resources`);
if (hardcoded.length) {
  console.error(`[i18n-check] hardcoded user-facing copy (${hardcoded.length}):`);
  for (const finding of hardcoded) console.error(`  ${finding.file}:${finding.line} ${finding.kind}: ${JSON.stringify(finding.text)}`);
}
if (dynamic.length) {
  console.error(`[i18n-check] dynamic msgids cannot be extracted (${dynamic.length}):`);
  for (const finding of dynamic) console.error(`  ${finding}`);
}
if (errors.length) {
  console.error(`[i18n-check] generated resource errors (${errors.length}):`);
  for (const error of errors) console.error(`  ${error}`);
}

const failureCount = hardcoded.length + dynamic.length + errors.length;
if (failureCount) {
  console.error(`[i18n-check] FAIL: ${failureCount} issue(s); wrap user-facing literals with msg()/useToolCopy() and regenerate resources`);
  process.exitCode = 1;
} else {
  console.log('[i18n-check] PASS: copy callsites and generated resources are covered');
}
