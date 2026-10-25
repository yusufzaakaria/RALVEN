import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const workerPath = resolve(projectRoot, "dist/server/index.js");
const manifestPath = resolve(projectRoot, "dist/.openai/hosting.json");

const [source, manifest] = await Promise.all([
  readFile(workerPath, "utf8"),
  readFile(manifestPath, "utf8"),
]);
JSON.parse(manifest);

// A data URL forces ESM parsing even though the generated output has no package.json.
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const workerModule = await import(moduleUrl);
assert.equal(
  typeof workerModule.default?.fetch,
  "function",
  `${pathToFileURL(workerPath)} must export default.fetch`,
);

// Static requests and health checks must work before market data initializes.
const request = pathname => new Request(`https://ralven.test${pathname}`);
const index = await workerModule.default.fetch(request("/"));
assert.equal(index.status, 200);
assert.match(await index.text(), /workspace\.css/);
const stylesheet = await workerModule.default.fetch(request("/workspace.css"));
assert.equal(stylesheet.status, 200);
assert.match(stylesheet.headers.get("Content-Type"), /text\/css/);
assert.match(await stylesheet.text(), /trading-workspace/);
for (const path of ["/terminal.js", "/evidence-ui.js", "/statement-ui.js", "/src/sensitivity.mjs", "/src/evidence.mjs", "/vendor/xlsx.full.min.js"]) {
  const script = await workerModule.default.fetch(request(path));
  assert.equal(script.status, 200);
  assert.match(script.headers.get("Content-Type"), /text\/javascript/, `${path} must be served as a browser script`);
}
const health = await workerModule.default.fetch(request("/api/health"));
assert.equal((await health.json()).status, "ok");
assert.equal((await workerModule.default.fetch(request("/not-a-route"))).status, 404);
const snapshot = await workerModule.default.fetch(request("/data/evidence/CPIN.json"));
assert.equal(snapshot.headers.get("Content-Encoding"), null);
const evidence = await snapshot.json();
assert.ok(evidence.observations.some(o => o.sourceType === 'primary'));
const register = await (await workerModule.default.fetch(request('/data/statement-index.json'))).json();
assert.equal(register.totals.issuers, 962);
assert.equal(register.totals.withReports, 924);
const taxonomy = await (await workerModule.default.fetch(request('/data/statement-taxonomy.json'))).json();
const cpinStatements = await (await workerModule.default.fetch(request('/data/statements/CPIN.json'))).json();
assert.ok(cpinStatements.reports.length >= 2);
assert.ok(cpinStatements.reports.every(report => report.rows.every(([tag, col, value]) => typeof taxonomy[tag] === 'string' && report.columns[col] && Number.isFinite(value))));
assert.ok(cpinStatements.reports.some(report => report.rows.some(([tag]) => /Inventories|IncomeTax/.test(taxonomy[tag]))));
const csv = await workerModule.default.fetch(request('/data/completeness.csv'));
assert.match(csv.headers.get('Content-Type'), /text\/csv/);
assert.match(await csv.text(), /"ticker"/);
// Exercise lazy decompression/initialization and cached company delivery with
// providers offline. The check makes no requests to external data services.
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => Response.json({}, {status: 503});
  const companyResponse = await workerModule.default.fetch(request("/api/company/CPIN"));
  assert.equal(companyResponse.status, 200);
  const company = await companyResponse.json();
  assert.equal(company.ticker, "CPIN");
  assert.equal(company.period, "2026-06-30");
  assert.ok(Math.abs(company.ebit - 10111.511) < 1e-6);
  assert.equal(company.debt, null);
  assert.equal(company.evidence.rows.find(x => x.field === "debt").availability, "partial");
} finally {
  globalThis.fetch = originalFetch;
}
console.log("Artifact passes cold routes, gzip snapshot, lazy provider and offline CPIN delivery checks");
