#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_COVERAGE_THRESHOLD = 80;
const EMPTY_LINE_SUMMARY = { total: 0, covered: 0, pct: 0 };

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

function stripComments(value) {
  let result = "";
  let inLineComment = false;
  let inBlockComment = false;
  let inString = false;
  let inVerbatimString = false;
  let inChar = false;
  let isEscaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const current = value[index];
    const next = value[index + 1] ?? "";

    if (inLineComment) {
      if (current === "\n") {
        inLineComment = false;
        result += current;
      }

      continue;
    }

    if (inBlockComment) {
      if (current === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
        continue;
      }

      if (current === "\r" || current === "\n") {
        result += current;
      }

      continue;
    }

    if (inString) {
      result += current;

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (current === "\\") {
        isEscaped = true;
        continue;
      }

      if (current === '"') {
        inString = false;
      }

      continue;
    }

    if (inVerbatimString) {
      result += current;

      if (current === '"' && next === '"') {
        result += next;
        index += 1;
        continue;
      }

      if (current === '"') {
        inVerbatimString = false;
      }

      continue;
    }

    if (inChar) {
      result += current;

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (current === "\\") {
        isEscaped = true;
        continue;
      }

      if (current === "'") {
        inChar = false;
      }

      continue;
    }

    if (current === "@" && next === '"') {
      inVerbatimString = true;
      result += current;
      result += next;
      index += 1;
      continue;
    }

    if (current === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (current === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (current === '"') {
      inString = true;
      isEscaped = false;
      result += current;
      continue;
    }

    if (current === "'") {
      inChar = true;
      isEscaped = false;
      result += current;
      continue;
    }

    result += current;
  }

  return result.trim();
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

  if (/\binterface\b/i.test(compact)) {
    return false;
  }

  // Empty marker/derived types with no bodies or executable syntax should not fail coverage.
  if (isMarkerTypeWithoutExecutableSyntax(compact)) {
    return false;
  }

  return true;
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

function loadCoverletReports(reportPaths, repoRoot) {
  const fileCoverage = new Map();

  for (const reportPath of reportPaths) {
    if (!reportPath || !fs.existsSync(reportPath)) {
      continue;
    }

    const reportJson = JSON.parse(fs.readFileSync(reportPath, "utf8"));

    for (const moduleData of Object.values(reportJson)) {
      if (!moduleData || typeof moduleData !== "object") {
        continue;
      }

      for (const [documentPath, documentData] of Object.entries(moduleData)) {
        const relativePath = toRepoRelativePath(documentPath, repoRoot);
        const coverageByLine = fileCoverage.get(relativePath) ?? new Map();

        if (!documentData || typeof documentData !== "object") {
          continue;
        }

        for (const typeData of Object.values(documentData)) {
          if (!typeData || typeof typeData !== "object") {
            continue;
          }

          for (const methodData of Object.values(typeData)) {
            if (!methodData || typeof methodData !== "object") {
              continue;
            }

            const lines = methodData.Lines ?? {};

            for (const [lineNumber, hitCount] of Object.entries(lines)) {
              const existingHits = coverageByLine.get(lineNumber) ?? 0;
              coverageByLine.set(lineNumber, existingHits + Number(hitCount));
            }
          }
        }

        fileCoverage.set(relativePath, coverageByLine);
      }
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

  let totalLines = 0;
  let coveredLines = 0;
  let missingCoverageData = false;

  console.log(`[INFO] Evaluating C# ${scope} coverage for ${targetFiles.length} file(s).`);

  for (const relativePath of targetFiles) {
    const fileCoverage = evaluateCSharpFileCoverage(relativePath, coverletCoverage, repoRoot);

    if (fileCoverage.status === "miss") {
      console.log(`[MISS] ${relativePath} - no coverage data found.`);
      missingCoverageData = true;
      continue;
    }

    if (fileCoverage.status === "skip") {
      console.log(`[SKIP] ${relativePath} - no executable lines expected.`);
      continue;
    }

    totalLines += fileCoverage.total;
    coveredLines += fileCoverage.covered;

    console.log(`[FILE] ${relativePath} - ${fileCoverage.covered}/${fileCoverage.total} executable lines covered (${formatPercent(fileCoverage.covered, fileCoverage.total)}%).`);
  }

  if (totalLines === 0) {
    console.log("[FAIL] No executable C# lines were found for the requested scope.");
    process.exit(1);
  }

  const totalPercent = reportCoverageTotals("executable lines", coveredLines, totalLines, threshold);

  if (missingCoverageData || totalPercent < threshold) {
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

  let totalLines = 0;
  let coveredLines = 0;
  let missingCoverageData = false;

  console.log(`[INFO] Evaluating React/TS ${scope} coverage for ${targetFiles.length} file(s).`);

  for (const relativePath of targetFiles) {
    const fileCoverage = evaluateReactFileCoverage(relativePath, reactSummary);

    if (fileCoverage.status === "miss") {
      console.log(`[MISS] ${relativePath} - no coverage data found.`);
      missingCoverageData = true;
      continue;
    }

    totalLines += fileCoverage.total;
    coveredLines += fileCoverage.covered;

    console.log(`[FILE] ${relativePath} - ${fileCoverage.covered}/${fileCoverage.total} lines covered (${fileCoverage.pct.toFixed(2)}%).`);
  }

  if (totalLines === 0) {
    console.log("[FAIL] No measurable React/TS lines were found for the requested scope.");
    process.exit(1);
  }

  const totalPercent = reportCoverageTotals("lines", coveredLines, totalLines, threshold);

  if (missingCoverageData || totalPercent < threshold) {
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
