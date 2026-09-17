/**
 * AST scanning shared by `i18n-extract.mjs` (resource generation) and
 * `check-i18n.mjs` (CI gate).
 *
 * Two questions are answered here:
 *   1. Which msgids does the source ask for?  (`t('…')` / `msg('…')`)
 *   2. Which user-facing strings bypass the copy layer entirely?  (hardcoded copy)
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export const COPY_LOCALES = ['zh-CN', 'zh-TW', 'ko', 'ja'];

const COPY_IMPORT_PREFIX = '@/lib/i18n/tool-copy/';

/** Attributes whose value is rendered to the user. */
const TEXT_ATTRS = new Set([
  'label',
  'title',
  'placeholder',
  'aria-label',
  'aria-description',
  'aria-valuetext',
  'alt',
]);

/** Object properties whose string value is rendered to the user. */
const TEXT_PROPS = new Set([
  'label',
  'title',
  'placeholder',
  'question',
  'answer',
  'note',
  'notes',
  'message',
  'description',
  'heading',
  'caption',
  'subtitle',
  'kicker',
  'lead',
  'eyebrow',
  'ariaLabel',
]);

/** Registry entries own their English copy through `tool-dictionaries/`, not the copy layer. */
const SKIP_HARDCODED = [
  /^src\/lib\//,
  /^src\/tools\/index\.ts$/,
  /^src\/tools\/[^/]+\/index\.ts$/,
  /^src\/components\/tools\/ProcessWorkflowBar\.tsx$/,
  /^src\/app\/manifest\.ts$/,
  /^src\/app\/layout\.tsx$/,
  /^src\/app\/api\/og\//,
  /\.test\.tsx?$/,
  /^e2e\//,
];

const ENTITIES = {
  '&apos;': "'",
  '&quot;': '"',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&ldquo;': '“',
  '&rdquo;': '”',
};

export function decodeEntities(text) {
  return text.replace(/&(?:apos|quot|amp|lt|gt|nbsp|mdash|ndash|ldquo|rdquo);/g, (entity) => ENTITIES[entity] ?? entity);
}

export function normalizeCopy(text) {
  return decodeEntities(text).replace(/\s+/g, ' ').trim();
}

/**
 * True when a string looks like copy a human reads, rather than an identifier,
 * a CSS class, a unit symbol or a data value.
 */
export function looksLikeCopy(text) {
  const value = normalizeCopy(text);
  if (value.length < 2) return false;
  if (!/[A-Za-z\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(value)) return false;
  if (/^[a-z][A-Za-z0-9]*$/.test(value)) return false; // camelCase identifier
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(value)) return false; // kebab-case slug / class
  if (/^[A-Z][A-Z0-9_]*$/.test(value) && value.length <= 4) return false; // short constant
  if (/^(?:Torr|mTorr|Pa|kPa|MPa|GPa|bar|mbar|psi|atm|nm|µm|mil|sccm|slm|cm²|W\/cm²|°C|°F|K|Å)(?::)?$/i.test(value)) return false;
  if (/^(?:Å\s*\(Angstrom\)|°C\s*\(Celsius\)|K\s*\(Kelvin\)|°F\s*\(Fahrenheit\)|µm\s*\(Micron\))$/i.test(value)) return false;
  if (/^(?:Power|RF Level|Date|Rev|Status|Format):$/i.test(value)) return false;
  if (/^\d+\s*mm\s*\(\d+["']?\)$/.test(value)) return false;
  if (/^[A-Z0-9][a-z0-9]*(?:\/[A-Z0-9a-z-]+)+(?:\s+[A-Za-z]+)?$/i.test(value)) return false;
  if (/^[RΣ]\s*(?:Dt\s*)?=|^\+?\s*Dt\s*=|^(?:mm|µm|nm|inch)\s*[•\(\)]|[•\(\)]\s*(?:mm|µm|nm|inch)|^[□■]|µm\s*\|\s*⌀|Split-\d+/i.test(value)) return false;
  if (/^(?:GitHub|github\.com\S*|IndexedDB:\s*\S+|SEMI|-TOOLS|SemiTools|Esc|V\d[\w.-]*|v\d[\w.-]*|SECURE RUN|STEP-\d+|LSL|USL|Traveler QR Code|\+\s*Leak Rate)$/i.test(value)) return false;
  if (/^(?:Gate CD-SEM|Furnace Oxide|Cu CMP Erosion|Implant Rs)\s*\(\d+\s*wfr\s*×\s*\d+\)$/i.test(value)) return false;
  if (/^(?:28nm HKMG Gate Stack|Cu Damascene BEOL|GaN-on-Si Power HEMT|Thermal Oxidation|CVD \/ PECVD \/ LPCVD|ALD \(Atomic Layer\)|Electroplating \(ECP\)|PVD \/ Sputter|Spin-Coating)$/i.test(value)) return false;
  return true;
}

export function sourceFiles(root) {
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) out.push(full);
  }
  return out;
}

function parse(file) {
  return ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

const literalText = (node) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;
const propertyKey = (name) =>
  name && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : null;

/**
 * Collects every msgid a file asks for, together with the copy resource that
 * owns it (`<tool>` from the import, `shared` when the file does not name one).
 */
export function collectMsgids(file, repoRoot) {
  const source = parse(file);
  const bindings = new Set();
  let importedResource = null;
  const msgids = new Set();
  const dynamic = [];

  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const spec = node.moduleSpecifier.text;
      if (spec.startsWith(COPY_IMPORT_PREFIX)) {
        const resource = spec.slice(COPY_IMPORT_PREFIX.length).replace(/\.ts$/, '').replace(/^resources\//, '');
        if (!importedResource && !['msg', 'types', 'index'].includes(resource)) importedResource = resource;
      }
    }
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      node.initializer.expression.text === 'useToolCopy' &&
      ts.isIdentifier(node.name)
    ) {
      bindings.add(node.name.text);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callee = node.expression.text;
      if (bindings.has(callee) || callee === 'msg') {
        const [first] = node.arguments;
        const text = literalText(first);
        if (text !== null) msgids.add(text);
        else if (first && (ts.isTemplateExpression(first) || ts.isBinaryExpression(first))) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart());
          dynamic.push(`${path.relative(repoRoot, file)}:${line + 1}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return { msgids, resource: importedResource ?? 'shared', dynamic };
}

/** User-facing literals in a file that are not wrapped in `t(…)` or `msg(…)`. */
export function findHardcodedCopy(file, repoRoot) {
  const relative = path.relative(repoRoot, file).split(path.sep).join('/');
  if (SKIP_HARDCODED.some((pattern) => pattern.test(relative))) return [];

  const source = parse(file);
  const findings = [];
  const add = (node, text, kind) => {
    const value = normalizeCopy(text);
    if (!looksLikeCopy(value)) return;
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    findings.push({ file: relative, line: line + 1, kind, text: value });
  };

  // Track wrapper call ranges so an argument already wrapped in t()/msg() is not
  // reported twice.
  const wrapped = new Set();
  const collectWrapped = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      const callee = node.expression.text;
      if (callee === 'msg' || callee.length <= 3) {
        for (const argument of node.arguments) {
          if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
            wrapped.add(argument.getStart());
          }
        }
      }
    }
    ts.forEachChild(node, collectWrapped);
  };
  collectWrapped(source);

  const visit = (node) => {
    if (ts.isJsxText(node)) add(node, node.getText(), 'jsx-text');
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = propertyKey(node.name);
      if (name && TEXT_ATTRS.has(name) && !wrapped.has(node.initializer.getStart())) {
        add(node.initializer, node.initializer.text, `attr:${name}`);
      }
    }
    if (
      ts.isPropertyAssignment(node) &&
      (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))
    ) {
      const name = propertyKey(node.name);
      if (name && TEXT_PROPS.has(name) && !wrapped.has(node.initializer.getStart())) {
        let parent = node.parent;
        let isRouteMetadata = false;
        while (parent) {
          if (ts.isVariableDeclaration(parent) && propertyKey(parent.name) === 'metadata') {
            isRouteMetadata = true;
            break;
          }
          parent = parent.parent;
        }
        if (!isRouteMetadata) {
          add(node.initializer, node.initializer.text, `prop:${name}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  return findings;
}
