#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = { report: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const value = argv[index + 1];

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
  return value.replace(/\\/g, "/").replace(/^[A-Za-z]:/, "").replace(/^\/+/, "");
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

function isProductionReactFile(relativePath) {
  const normalized = normalizePath(relativePath);
  return /^fotest-react\/src\/.*\.(ts|tsx)$/i.test(normalized)
    && !/\.test\.(ts|tsx)$/i.test(normalized)
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

function evaluateCSharpCoverage(args) {
  const repoRoot = args["repo-root"];
  const threshold = Number(args.threshold ?? 80);
  const scope = args.scope;
  const changedFiles = readChangedFiles(args["changed-list"]);
  const coverletCoverage = loadCoverletReports(args.report, repoRoot);

  let targetFiles = [];

  if (scope === "changed") {
    targetFiles = changedFiles.filter(isProductionCSharpFile);
  } else {
    targetFiles = [...coverletCoverage.keys()].filter(isProductionCSharpFile);
  }

  targetFiles = [...new Set(targetFiles)].sort((left, right) => left.localeCompare(right));

  if (targetFiles.length === 0) {
    console.log("[SKIP] No production C# files matched the requested coverage scope.");
    process.exit(0);
  }

  let totalLines = 0;
  let coveredLines = 0;
  let missingCoverageData = false;

  console.log(`[INFO] Evaluating C# ${scope} coverage for ${targetFiles.length} file(s).`);

  for (const relativePath of targetFiles) {
    const coverageByLine = coverletCoverage.get(relativePath);

    if (!coverageByLine) {
      console.log(`[MISS] ${relativePath} - no coverage data found.`);
      missingCoverageData = true;
      continue;
    }

    const executableLines = [...coverageByLine.values()];
    const fileTotal = executableLines.length;
    const fileCovered = executableLines.filter((hitCount) => hitCount > 0).length;

    totalLines += fileTotal;
    coveredLines += fileCovered;

    console.log(`[FILE] ${relativePath} - ${fileCovered}/${fileTotal} executable lines covered (${formatPercent(fileCovered, fileTotal)}%).`);
  }

  if (totalLines === 0) {
    console.log("[FAIL] No executable C# lines were found for the requested scope.");
    process.exit(1);
  }

  const totalPercent = Number(formatPercent(coveredLines, totalLines));
  console.log(`[TOTAL] ${coveredLines}/${totalLines} executable lines covered (${totalPercent.toFixed(2)}%). Threshold: ${threshold.toFixed(2)}%.`);

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
      : toRepoRelativePath(normalizedKey, repoRoot);

    summary.set(relativePath, value.lines ?? { total: 0, covered: 0, pct: 0 });
  }

  return summary;
}

function evaluateReactCoverage(args) {
  const repoRoot = args["repo-root"];
  const threshold = Number(args.threshold ?? 80);
  const scope = args.scope;
  const changedFiles = readChangedFiles(args["changed-list"]);
  const reactSummary = loadReactSummary(args.report[0], repoRoot);

  let targetFiles = [];

  if (scope === "changed") {
    targetFiles = changedFiles.filter(isProductionReactFile);
  } else {
    targetFiles = [...reactSummary.keys()].filter(isProductionReactFile);
  }

  targetFiles = [...new Set(targetFiles)].sort((left, right) => left.localeCompare(right));

  if (targetFiles.length === 0) {
    console.log("[SKIP] No production React/TS files matched the requested coverage scope.");
    process.exit(0);
  }

  let totalLines = 0;
  let coveredLines = 0;
  let missingCoverageData = false;

  console.log(`[INFO] Evaluating React/TS ${scope} coverage for ${targetFiles.length} file(s).`);

  for (const relativePath of targetFiles) {
    const fileSummary = reactSummary.get(relativePath);

    if (!fileSummary) {
      console.log(`[MISS] ${relativePath} - no coverage data found.`);
      missingCoverageData = true;
      continue;
    }

    totalLines += Number(fileSummary.total ?? 0);
    coveredLines += Number(fileSummary.covered ?? 0);

    console.log(`[FILE] ${relativePath} - ${fileSummary.covered}/${fileSummary.total} lines covered (${Number(fileSummary.pct ?? 0).toFixed(2)}%).`);
  }

  if (totalLines === 0) {
    console.log("[FAIL] No measurable React/TS lines were found for the requested scope.");
    process.exit(1);
  }

  const totalPercent = Number(formatPercent(coveredLines, totalLines));
  console.log(`[TOTAL] ${coveredLines}/${totalLines} lines covered (${totalPercent.toFixed(2)}%). Threshold: ${threshold.toFixed(2)}%.`);

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
