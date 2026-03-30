#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_COVERAGE_THRESHOLD = 80;

function readOptionValue(argv, index) {
  if (index + 1 >= argv.length) {
    return null;
  }

  return argv[index + 1];
}

function parseArgs(argv) {
  const args = { report: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = readOptionValue(argv, index);

    if (value === null) {
      continue;
    }

    if (key === "report") {
      args.report.push(value);
      index += 1;
      continue;
    }

    args[key] = value;
    index += 1;
  }

  return args;
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/^[A-Za-z]:/, "").replace(/^\/+/, "");
}

function createStripState() {
  return {
    inLineComment: false,
    inBlockComment: false,
    inString: false,
    inVerbatimString: false,
    inChar: false,
    isEscaped: false,
  };
}

function consumeLineComment(state, current, index, result) {
  if (!state.inLineComment) {
    return null;
  }

  if (current === "\n") {
    state.inLineComment = false;
    result.push(current);
  }

  return index;
}

function consumeBlockComment(state, current, next, index, result) {
  if (!state.inBlockComment) {
    return null;
  }

  if (current === "*" && next === "/") {
    state.inBlockComment = false;
    return index + 1;
  }

  if (current === "\r" || current === "\n") {
    result.push(current);
  }

  return index;
}

function consumeEscapableLiteral(state, current, index, result, flagName, delimiter) {
  if (!state[flagName]) {
    return null;
  }

  result.push(current);

  if (state.isEscaped) {
    state.isEscaped = false;
    return index;
  }

  if (current === "\\") {
    state.isEscaped = true;
    return index;
  }

  if (current === delimiter) {
    state[flagName] = false;
  }

  return index;
}

function consumeVerbatimString(state, current, next, index, result) {
  if (!state.inVerbatimString) {
    return null;
  }

  result.push(current);

  if (current === '"' && next === '"') {
    result.push(next);
    return index + 1;
  }

  if (current === '"') {
    state.inVerbatimString = false;
  }

  return index;
}

function startToken(state, current, next, index, result) {
  if (current === "@" && next === '"') {
    state.inVerbatimString = true;
    result.push(current, next);
    return index + 1;
  }

  if (current === "/" && next === "/") {
    state.inLineComment = true;
    return index + 1;
  }

  if (current === "/" && next === "*") {
    state.inBlockComment = true;
    return index + 1;
  }

  if (current === '"') {
    state.inString = true;
    state.isEscaped = false;
    result.push(current);
    return index;
  }

  if (current === "'") {
    state.inChar = true;
    state.isEscaped = false;
    result.push(current);
    return index;
  }

  return null;
}

function appendCodeCharacter(current, result) {
  result.push(current);
}

function stripComments(value) {
  const result = [];
  const state = createStripState();
  const activeHandlers = [
    consumeLineComment,
    consumeBlockComment,
    (currentState, current, next, index, currentResult) => consumeEscapableLiteral(currentState, current, index, currentResult, "inString", '"'),
    consumeVerbatimString,
    (currentState, current, next, index, currentResult) => consumeEscapableLiteral(currentState, current, index, currentResult, "inChar", "'"),
  ];

  for (let index = 0; index < value.length;) {
    const current = value[index];
    const next = value[index + 1] ?? "";

    let handledIndex = null;

    for (const handler of activeHandlers) {
      handledIndex = handler(state, current, next, index, result);
      if (handledIndex !== null) {
        break;
      }
    }

    if (handledIndex !== null) {
      index = handledIndex + 1;
      continue;
    }

    const tokenIndex = startToken(state, current, next, index, result);
    if (tokenIndex !== null) {
      index = tokenIndex + 1;
      continue;
    }

    appendCodeCharacter(current, result);
    index += 1;
  }

  return result.join("").trim();
}

function hasExecutableSyntax(value) {
  return /(=>|\bif\b|\bfor\b|\bwhile\b|\bswitch\b|\breturn\b|\bthrow\b|\bawait\b|\bnew\b)/i.test(value);
}

function isMarkerTypeWithoutExecutableSyntax(value) {
  const hasTypeDeclaration = /\b(class|record|struct)\b/i.test(value);
  return hasTypeDeclaration && !hasExecutableSyntax(value);
}

function toRepoRelativePath(filePath, repoRoot) {
  const normalizedRepoRoot = normalizePath(path.resolve(repoRoot));
  const normalizedFilePath = normalizePath(path.resolve(filePath));

  if (normalizedFilePath.toLowerCase().startsWith(normalizedRepoRoot.toLowerCase() + "/")) {
    return normalizedFilePath.slice(normalizedRepoRoot.length + 1);
  }

  const match = normalizedFilePath.match(/(FoTestApi\.(?:Application|Domain|Infrastructure)\/.*\.cs|fotest-react\/src\/.*\.(?:ts|tsx))/i);
  return match ? match[1] : normalizedFilePath;
}

function readChangedFiles(changedListPath) {
  if (!changedListPath || !fs.existsSync(changedListPath)) {
    return [];
  }

  return fs
    .readFileSync(changedListPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizePath(line));
}

function isProductionCSharpFile(relativePath) {
  const normalized = normalizePath(relativePath);
  return /^(FoTestApi\.(Application|Domain|Infrastructure))\/.*\.cs$/i.test(normalized)
    && !/\/Program\.cs$/i.test(normalized)
    && !/\/(bin|obj)\//i.test(normalized);
}

function fileLikelyHasExecutableCSharp(filePath, repoRoot) {
  const absolutePath = path.resolve(repoRoot, filePath);
  if (!fs.existsSync(absolutePath)) {
    return true;
  }

  const compact = stripComments(fs.readFileSync(absolutePath, "utf8"));
  return !/\binterface\b/i.test(compact) && !isMarkerTypeWithoutExecutableSyntax(compact);
}

function isProductionReactFile(relativePath) {
  const normalized = normalizePath(relativePath);
  return /^fotest-react\/src\/.*\.(ts|tsx)$/i.test(normalized)
    && !/\.test\.(ts|tsx)$/i.test(normalized)
    && !/\/__mocks__\//i.test(normalized)
    && !/\/setupTests\.ts$/i.test(normalized)
    && !/\/index\.tsx$/i.test(normalized)
    && !/\/reportWebVitals\.ts$/i.test(normalized)
    && !/\/react-app-env\.d\.ts$/i.test(normalized);
}

function formatPercent(covered, total) {
  if (total === 0) {
    return "0.00";
  }

  return ((covered / total) * 100).toFixed(2);
}

function isObjectRecord(value) {
  return Boolean(value) && typeof value === "object";
}

function mergeMethodLines(coverageByLine, methodData) {
  const lines = methodData.Lines ?? {};

  for (const [lineNumber, hitCount] of Object.entries(lines)) {
    const existingHits = coverageByLine.get(lineNumber) ?? 0;
    coverageByLine.set(lineNumber, existingHits + Number(hitCount));
  }
}

function mergeDocumentCoverage(coverageByLine, documentData) {
  for (const typeData of Object.values(documentData)) {
    if (!isObjectRecord(typeData)) {
      continue;
    }

    for (const methodData of Object.values(typeData)) {
      if (!isObjectRecord(methodData)) {
        continue;
      }

      mergeMethodLines(coverageByLine, methodData);
    }
  }
}

function mergeModuleCoverage(fileCoverage, moduleData, repoRoot) {
  for (const [documentPath, documentData] of Object.entries(moduleData)) {
    if (!isObjectRecord(documentData)) {
      continue;
    }

    const relativePath = toRepoRelativePath(documentPath, repoRoot);
    const coverageByLine = fileCoverage.get(relativePath) ?? new Map();
    mergeDocumentCoverage(coverageByLine, documentData);
    fileCoverage.set(relativePath, coverageByLine);
  }
}

function loadCoverletReports(reportPaths, repoRoot) {
  const fileCoverage = new Map();

  for (const reportPath of reportPaths) {
    if (!reportPath || !fs.existsSync(reportPath)) {
      continue;
    }

    const reportJson = JSON.parse(fs.readFileSync(reportPath, "utf8"));

    for (const moduleData of Object.values(reportJson)) {
      if (!isObjectRecord(moduleData)) {
        continue;
      }

      mergeModuleCoverage(fileCoverage, moduleData, repoRoot);
    }
  }

  return fileCoverage;
}

function getTargetFiles(scope, changedFiles, availableFiles, fileFilter) {
  const scopeFiles = scope === "changed" ? changedFiles : [...availableFiles];
  return [...new Set(scopeFiles.filter(fileFilter))].sort((left, right) => left.localeCompare(right));
}

function summarizeCoveredLines(executableLines) {
  return {
    total: executableLines.length,
    covered: executableLines.filter((hitCount) => hitCount > 0).length,
  };
}

function reportCoverageTotals(label, coveredLines, totalLines, threshold) {
  const totalPercent = Number(formatPercent(coveredLines, totalLines));
  console.log(`[TOTAL] ${coveredLines}/${totalLines} ${label} covered (${totalPercent.toFixed(2)}%). Threshold: ${threshold.toFixed(2)}%.`);
  return totalPercent;
}

function collectCoverageTotals(targetFiles, evaluateFileCoverage, logCoverageSummary) {
  const totals = {
    totalLines: 0,
    coveredLines: 0,
    missingCoverageData: false,
  };

  for (const relativePath of targetFiles) {
    const fileCoverage = evaluateFileCoverage(relativePath);

    if (fileCoverage.status === "miss") {
      console.log(`[MISS] ${relativePath} - no coverage data found.`);
      totals.missingCoverageData = true;
      continue;
    }

    if (fileCoverage.status === "skip") {
      console.log(`[SKIP] ${relativePath} - no executable lines expected.`);
      continue;
    }

    totals.totalLines += fileCoverage.total;
    totals.coveredLines += fileCoverage.covered;
    logCoverageSummary(relativePath, fileCoverage);
  }

  return totals;
}

function evaluateCSharpFileCoverage(relativePath, coverletCoverage, repoRoot) {
  const coverageByLine = coverletCoverage.get(relativePath);

  if (!coverageByLine) {
    return fileLikelyHasExecutableCSharp(relativePath, repoRoot)
      ? { status: "miss" }
      : { status: "skip" };
  }

  const summary = summarizeCoveredLines([...coverageByLine.values()]);
  return { status: "file", ...summary };
}

function evaluateReactFileCoverage(relativePath, reactSummary) {
  const fileSummary = reactSummary.get(relativePath);

  if (!fileSummary) {
    return { status: "miss" };
  }

  return {
    status: "file",
    total: Number(fileSummary.total ?? 0),
    covered: Number(fileSummary.covered ?? 0),
    pct: Number(fileSummary.pct ?? 0),
  };
}

function evaluateCSharpCoverage(args) {
  const repoRoot = args["repo-root"];
  const threshold = Number(args.threshold ?? DEFAULT_COVERAGE_THRESHOLD);
  const scope = args.scope;
  const changedFiles = readChangedFiles(args["changed-list"]);
  const coverletCoverage = loadCoverletReports(args.report, repoRoot);
  const targetFiles = getTargetFiles(scope, changedFiles, coverletCoverage.keys(), isProductionCSharpFile);

  if (targetFiles.length === 0) {
    console.log("[SKIP] No production C# files matched the requested coverage scope.");
    process.exit(0);
  }

  console.log(`[INFO] Evaluating C# ${scope} coverage for ${targetFiles.length} file(s).`);

  const totals = collectCoverageTotals(
    targetFiles,
    (relativePath) => evaluateCSharpFileCoverage(relativePath, coverletCoverage, repoRoot),
    (relativePath, fileCoverage) => {
      console.log(`[FILE] ${relativePath} - ${fileCoverage.covered}/${fileCoverage.total} executable lines covered (${formatPercent(fileCoverage.covered, fileCoverage.total)}%).`);
    },
  );

  if (totals.totalLines === 0) {
    console.log("[FAIL] No executable C# lines were found for the requested scope.");
    process.exit(1);
  }

  const totalPercent = reportCoverageTotals("executable lines", totals.coveredLines, totals.totalLines, threshold);

  if (totals.missingCoverageData || totalPercent < threshold) {
    process.exit(1);
  }
}

function loadReactSummary(reportPath, repoRoot) {
  if (!reportPath || !fs.existsSync(reportPath)) {
    return new Map();
  }

  const reportJson = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const summary = new Map();

  for (const [key, value] of Object.entries(reportJson)) {
    if (key === "total") {
      continue;
    }

    const normalizedKey = normalizePath(key);
    const relativePath = normalizedKey.toLowerCase().startsWith("src/")
      ? `fotest-react/${normalizedKey}`
      : toRepoRelativePath(key, repoRoot);

    summary.set(relativePath, value.lines ?? { total: 0, covered: 0, pct: 0 });
  }

  return summary;
}

function evaluateReactCoverage(args) {
  const repoRoot = args["repo-root"];
  const threshold = Number(args.threshold ?? DEFAULT_COVERAGE_THRESHOLD);
  const scope = args.scope;
  const changedFiles = readChangedFiles(args["changed-list"]);
  const reactSummary = loadReactSummary(args.report[0], repoRoot);
  const targetFiles = getTargetFiles(scope, changedFiles, reactSummary.keys(), isProductionReactFile);

  if (targetFiles.length === 0) {
    console.log("[SKIP] No production React/TS files matched the requested coverage scope.");
    process.exit(0);
  }

  console.log(`[INFO] Evaluating React/TS ${scope} coverage for ${targetFiles.length} file(s).`);

  const totals = collectCoverageTotals(
    targetFiles,
    (relativePath) => evaluateReactFileCoverage(relativePath, reactSummary),
    (relativePath, fileCoverage) => {
      console.log(`[FILE] ${relativePath} - ${fileCoverage.covered}/${fileCoverage.total} lines covered (${fileCoverage.pct.toFixed(2)}%).`);
    },
  );

  if (totals.totalLines === 0) {
    console.log("[FAIL] No measurable React/TS lines were found for the requested scope.");
    process.exit(1);
  }

  const totalPercent = reportCoverageTotals("lines", totals.coveredLines, totals.totalLines, threshold);

  if (totals.missingCoverageData || totalPercent < threshold) {
    process.exit(1);
  }
}

const args = parseArgs(process.argv.slice(2));

if (!args.mode || !args.scope || !args["repo-root"]) {
  console.error("Usage: node scripts/check-coverage.mjs --mode <csharp|react> --scope <changed|full> --repo-root <path> [--changed-list <file>] --report <path> [--report <path>] [--threshold <number>]");
  process.exit(1);
}

if (args.mode === "csharp") {
  evaluateCSharpCoverage(args);
} else if (args.mode === "react") {
  evaluateReactCoverage(args);
} else {
  console.error(`Unsupported mode: ${args.mode}`);
  process.exit(1);
}
