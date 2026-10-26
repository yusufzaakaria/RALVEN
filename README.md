# RALVEN — Indonesian Equity Valuation

Functional web application for the Digital Business Valuation midterm project by Yusuf Zakaria. The submitted company case is **BMRI — PT Bank Mandiri (Persero) Tbk**.

- [Public application](https://ralven-equity-terminal.airycoot8.chatgpt.site)
- [Reproduce the archived BMRI case](https://ralven-equity-terminal.airycoot8.chatgpt.site/?case=BMRI-2026-10-25)
- [Open BMRI using the current saved snapshot](https://ralven-equity-terminal.airycoot8.chatgpt.site/?ticker=BMRI)
- [BMRI model and report clarifications](BMRI_Deliverable_Alignment.md)

## Current release: 5.3.1

Period-matched source repair and direct Data-menu access on narrow screens, released after submission on 26 October 2026. [Changes, measured gaps, validation and remaining work](Remediation_Progress.md).

Queried supplemental statements for all 962 directory issuers: 650 returned 31,890 explicit dated records and 312 returned none of the requested fields. These are Yahoo aggregator records, separately identified from IDX filings. Original quote/filing dates remain unchanged; no quarterly multiplication or zero-for-absence inference is used. [Issuer-level refresh audit](https://ralven-equity-terminal.airycoot8.chatgpt.site/data/source-refresh.json).

Missing selected-basis debt inputs decreased from 333 to 157, EBITDA from 737 to 316 and capex from 821 to 372. Unsupported legacy preferred/minority zero assumptions are quarantined; preferred gaps consequently increased. Full D&A remains separate from depreciation-only figures. Same-origin Yahoo records do not count as independent corroboration.

Data now exposes 5,407 selected financing, capital and depreciation note excerpts for 726 issuers, with source periods/contexts and search. Excel includes source-note and rejected-default appendices; PDF indexes supporting notes. Text does not automatically become valuation input. Primary statement archives still cover 924 issuers; this is not complete financial data for every company.

161 tests pass, including archived BMRI values, period/definition controls, zero versus missing, source conflicts and recovery checks. 676 supported fundamental analyses pass sensitivity-center, tornado and simulation checks. The package records 475 two-method assessments: 69 DCF + relative and 406 residual income + relative. Accounting-based residual income is not cash-flow DCF. Conditional/blocked outcomes remain explicit; a second method or a trading rating is not fabricated.

Cash-funded operating recovery from version 5.2 remains available in Data/Forecast. [Synthetic recovery example](https://ralven-equity-terminal.airycoot8.chatgpt.site/?case=RECOVERY-DEMO) uses fictional inputs solely for inspection. Remaining work includes claim/D&A/PDF verification, source-conflict resolution, issuer-specific forecast review and specialized sector models.

Original BMRI submission materials and the baseline branch remain preserved. Later source and documentation are versioned rather than backdated.

## BMRI deliverables

The archived case uses a 25 October 2026 valuation date, a Rp3,900 observed close dated 23 October, and the TTM financial basis ended 30 June 2026. It reproduces Rp6,447 dividend-discount value, Rp4,050 relative value, and Rp5,248 weighted fair value using 50% / 50% weights. The conditional model indication is BUY at +34.6% upside. These are dated model results, not current prices or independently verified investment advice.

- [Formula Excel workbook](RALVEN_BMRI_Model.xlsx)
- [English report](RALVEN_BMRI_2026-10-25_en_v5.pdf)
- [Indonesian report](RALVEN_BMRI_2026-10-25_id_v5.pdf)
- [Editable supporting presentation](RALVEN_BMRI_Supporting_Report_5.0.1.pptx): 14 content slides, plus cover, references and appendix
- [Excel input template](RALVEN_Input_Template.xlsx)
- [User guide](User_Guide.md)
- [Outstanding implementation work](Implementation_Status.md)

The supporting presentation and clarifications were prepared after submission. They do not replace the original submitted PDF. In that PDF, the Rp4,162 bear case was labelled with an incorrect market comparison: it implies **+6.7%** versus Rp3,900. The detailed note also explains the multi-period DDM formula and separates DDM values from blended scenarios.

## Run locally

Install Node.js 24 or later. Clone or download this repository, then run from its root:

```sh
node setup.mjs
cd application
node server.mjs
```

Open the local URL printed by the server. `setup.mjs` verifies the SHA-256 of `RALVEN_Application_5.3.1.zip` and extracts the complete application into `application/`. It refuses to overwrite modified files. Calculation modules and tests are also directly browsable in that folder on GitHub. No paid service or Python installation is required to run the bundled Node application.

```sh
node --test tests/*.test.mjs
node build.mjs
node scripts/validate-artifact.mjs
```

The release has 161 passing regression tests. The Excel formula chain is separately checked against the application calculation engine. No repository write automation is installed.

## Functionality

Ticker lookup and documented Excel import feed separate inputs, analyst assumptions, deterministic calculations and outputs. Models include corporate FCFF DCF, bank DDM, relative valuation and a labelled residual-income fallback where eligible. The platform explains method eligibility and weights, compares value with observed price, and generates scenario matrices, driver tornado charts and seeded Monte Carlo distributions. It supports English/Indonesian, light/dark themes, Excel formulas, PDF reports and saved research workspaces.

For BMRI, DDM discounts five annual common-equity distributions and a terminal distribution at cost of equity. Corporate FCFF/WACC and the enterprise-to-equity debt bridge are not used for this bank model. Relative valuation uses eligible bank P/E and P/B observations. Forecasts, payout, terminal ROE and peer economic comparability require analyst review.

## Data and limitations

Sources include IDX consolidated XBRL filings, issuer reports and Yahoo Finance observations. Source dates, original amounts, currency, units and evidence status remain visible. Compatible definitions and periods are reconciled; conflicting observations are not averaged. TTM flows use prior annual plus current YTD minus comparable prior YTD.

The bundled directory contains 962 records; supported primary archives cover 924. This does **not** mean complete financial statements for every issuer. Missing notes, leases, D&A, unavailable denominators and inapplicable sector fields remain distinguished. There are 676 supported fundamental analyses with scenario, sensitivity, tornado and simulation output. Technical-only signals and WAIT outcomes are labelled when fundamental evidence is inadequate. A recommendation is not forced by filling missing data with zeros.

Refresh depends on public-source connectivity and may encounter access restrictions or rate limits. The standalone server uses local persistence; hosted snapshots use the configured R2 storage. Archived case links remain dated and must not be described as live market data. Monte Carlo inputs are analyst settings, not empirically calibrated investment probabilities.

AI assisted software development and documentation. Financial calculations are deterministic. See the source modules, formula workbook, evidence appendix and implementation-status document for calculation boundaries and remaining audit work.

## Submission history

The `submission-baseline-2026-10-25` branch and original `RALVEN_Submission_v5.zip` preserve the earlier submission materials. Older BBCA reports and presentation are supporting application examples, not the selected BMRI submission case. Later commits identify subsequent improvements. The repository and website addresses remain the same.

Contact: [yusufzaakaria@gmail.com](mailto:yusufzaakaria@gmail.com) · [LinkedIn](https://www.linkedin.com/in/yusuf-zakaria)
