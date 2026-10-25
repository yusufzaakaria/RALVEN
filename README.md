# RALVEN — Indonesian Equity Valuation

Functional web application for the Digital Business Valuation midterm project by Yusuf Zakaria. The submitted company case is **BMRI — PT Bank Mandiri (Persero) Tbk**.

- [Public application](https://ralven-equity-terminal.airycoot8.chatgpt.site)
- [Reproduce the archived BMRI case](https://ralven-equity-terminal.airycoot8.chatgpt.site/?case=BMRI-2026-10-25)
- [Open BMRI using the current saved snapshot](https://ralven-equity-terminal.airycoot8.chatgpt.site/?ticker=BMRI)
- [BMRI model and report clarifications](BMRI_Deliverable_Alignment.md)

## Current release: 5.2.0

Reviewed cash-funded recovery for operating companies, released after submission on 26 October 2026. [Changes, validation and remaining work](Remediation_Progress.md).

Negative early FCFF can be valued with five explicit annual operating paths and a reviewed cash budget. Existing unrestricted cash must cover deficits, financing payments and a reserve; both final forecast years must have positive EBIT and FCFF. Missing inputs are not replaced by zero. Underfunded or unreviewed active plans produce WAIT. New debt, equity issuance, dilution, tax-loss benefits and intrayear liquidity are outside this model. Web, scenario, simulation, Excel and PDF gates are coordinated.

The [synthetic recovery example](https://ralven-equity-terminal.airycoot8.chatgpt.site/?case=RECOVERY-DEMO) uses fictional subject and peer inputs for model inspection, not an issuer recommendation. Enable reviewed recovery for a real operating issuer in Data or Forecast only after inspecting its disclosures.

144 automated tests pass. Seven independent spreadsheet cases reconcile to the engine, including recovery using EV/Sales or EV/EBITDA; invalid funding produces WAIT. Archived BMRI figures remain reproducible.

The dated package still records 474 two-method assessments: 71 cash-flow DCF + relative and 403 residual-income + relative. Recovery plans are not auto-created to inflate coverage. These counts are not complete financial data, new market-wide retrieval or analyst certification. The original submitted BMRI PDF is not replaced; the supporting BMRI workbook/report/presentation below retain their dated case context. Prior source ZIPs and the submission-baseline branch remain preserved.

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

Open the local URL printed by the server. `setup.mjs` verifies the SHA-256 of `RALVEN_Application_5.2.0.zip` and extracts the complete application into `application/`. It refuses to overwrite modified files. Calculation modules and tests are also directly browsable in that folder on GitHub. No paid service or Python installation is required to run the bundled Node application.

```sh
node --test tests/*.test.mjs
node build.mjs
node scripts/validate-artifact.mjs
```

The release has 144 passing regression tests. The Excel formula chain is separately checked against the application calculation engine. No repository write automation is installed.

## Functionality

Ticker lookup and documented Excel import feed separate inputs, analyst assumptions, deterministic calculations and outputs. Models include corporate FCFF DCF, bank DDM, relative valuation and a labelled residual-income fallback where eligible. The platform explains method eligibility and weights, compares value with observed price, and generates scenario matrices, driver tornado charts and seeded Monte Carlo distributions. It supports English/Indonesian, light/dark themes, Excel formulas, PDF reports and saved research workspaces.

For BMRI, DDM discounts five annual common-equity distributions and a terminal distribution at cost of equity. Corporate FCFF/WACC and the enterprise-to-equity debt bridge are not used for this bank model. Relative valuation uses eligible bank P/E and P/B observations. Forecasts, payout, terminal ROE and peer economic comparability require analyst review.

## Data and limitations

Sources include IDX consolidated XBRL filings, issuer reports and Yahoo Finance observations. Source dates, original amounts, currency, units and evidence status remain visible. Compatible definitions and periods are reconciled; conflicting observations are not averaged. TTM flows use prior annual plus current YTD minus comparable prior YTD.

The bundled directory contains 962 records; supported primary archives cover 924. This does **not** mean complete financial statements for every issuer. Missing notes, leases, D&A, unavailable denominators and inapplicable sector fields remain distinguished. There are 684 eligible fundamental valuations with scenario, sensitivity, tornado and simulation output. Technical-only signals and WAIT outcomes are labelled when fundamental evidence is inadequate. A recommendation is not forced by filling missing data with zeros.

Refresh depends on public-source connectivity and may encounter access restrictions or rate limits. The standalone server uses local persistence; hosted snapshots use the configured R2 storage. Archived case links remain dated and must not be described as live market data. Monte Carlo inputs are analyst settings, not empirically calibrated investment probabilities.

AI assisted software development and documentation. Financial calculations are deterministic. See the source modules, formula workbook, evidence appendix and implementation-status document for calculation boundaries and remaining audit work.

## Submission history

The `submission-baseline-2026-10-25` branch and original `RALVEN_Submission_v5.zip` preserve the earlier submission materials. Older BBCA reports and presentation are supporting application examples, not the selected BMRI submission case. Later commits identify subsequent improvements. The repository and website addresses remain the same.

Contact: [yusufzaakaria@gmail.com](mailto:yusufzaakaria@gmail.com) · [LinkedIn](https://www.linkedin.com/in/yusuf-zakaria)
