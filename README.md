# RALVEN — Indonesian Equity Valuation

A functioning valuation web application for the **Digital Business Valuation midterm project**.

**[Open the public application](https://ralven-equity-terminal.airycoot8.chatgpt.site)** · **[Download the full source and submission package](https://github.com/yusufzaakaria/RALVEN/raw/refs/heads/main/RALVEN_Submission_v5.zip)**

## Submission files

| File | Contents |
|---|---|
| [Full application and submission ZIP](RALVEN_Submission_v5.zip) | Runnable source, original logo/assets, saved financial evidence, calculation engine, tests and supporting deliverables |
| [Example Excel valuation model](RALVEN_BBCA_Model.xlsx) | Linked calculation formulas, assumptions, annual forecast paths and validation guards |
| [Excel input template](RALVEN_Input_Template.xlsx) | Structured company, historical, assumption and peer inputs |
| [English valuation report](RALVEN_BBCA_2026-10-25_en_v5.pdf) | Method results, forecasts, sensitivity, Monte Carlo and source appendices |
| [Indonesian valuation report](RALVEN_BBCA_2026-10-25_id_v5.pdf) | Indonesian report for the same example |
| [Valuation and model presentation](RALVEN_Valuation_and_Model_Report_v5.pptx) | 14 content slides plus cover, references and appendix |
| [User guide](User_Guide.md) | Setup, inputs, updates, calculations, exports and operating instructions |
| [Implementation status](Implementation_Status.md) | Completed audit repairs, remaining work and material limitations |

The source is supplied inside the ZIP. Extract it before running; the extracted application root contains package.json, server.mjs, src/, public/ and tests/. The submission/ folder contains the supporting model/report files.

## Run locally

Install **Node.js 24 or newer**, extract RALVEN_Submission_v5.zip, then run from the extracted application folder:

    node server.mjs

Open **http://127.0.0.1:4173/**. No npm install is required for the normal application. Browser export libraries are vendored.

PowerShell example after downloading the ZIP:

    Expand-Archive -LiteralPath .\RALVEN_Submission_v5.zip -DestinationPath .\application
    Set-Location .\application
    node server.mjs

To verify calculations or build the hosted Worker, run inside that same folder:

    node --test tests/*.test.mjs
    node build.mjs
    node scripts/validate-artifact.mjs

Network access is needed for new public-source requests. Saved source snapshots support dated/offline inspection. No paid data subscription is bundled.

## Valuation and research functions

- Observed market value and enterprise-to-common-equity reconciliation.
- Corporate FCFF DCF, financial-equity DDM, eligible peer P/E, P/B, EV/EBITDA and EV/Sales; documented residual-income fallback.
- Transparent method eligibility and weighting; BUY/HOLD/SELL thresholds; separate technical signals and WAIT outcomes.
- Explicit rolling next-twelve-month forecasts, five editable annual driver paths, assumption provenance and named scenarios.
- Peer selection controls, financial-quality charts, valuation football field, applicable sensitivity matrices, tornado charts and seeded Monte Carlo.
- Source reconciliation and original statement explorer; missing, partial, annual-only and inapplicable values remain distinct.
- Supplemental analyst-input SOTP, finite-life mining and bank common-capital capacity tools.
- Formula-based Excel exports, bilingual PDF reports and portable JSON workspaces.
- English/Indonesian, light/dark themes, compact mode, dated market ticker/sparklines and contact links.

## Data coverage and interpretation

Release **5.0.0**, prepared **25 October 2026**. Market and financial observations retain their own dates.

The saved directory contains **962 IDX issuers**. The primary archive covers **924 issuers**, **1,804 filings** and **419,625 numeric non-dimensional facts**. A targeted retry recovered no additional supported primary statements for the remaining 38 issuers.

The saved audit found **683 eligible fundamental or conditional valuations**; all 683 have calculated sensitivity, tornado and Monte Carlo output. Other records retain explicitly labelled technical signals or WAIT where essential evidence is unavailable. An outcome for every ticker does **not** mean complete financial statements for every ticker.

Default forecasts, simulation sigmas, correlations and method weights are disclosed analyst assumptions. Simulation describes conditional model uncertainty, not probabilities of future market prices. Missing facts are not invented or silently converted to zero.

## Validation and source structure

The local suite passed **105 regression tests**. Independent spreadsheet recalculation matched corporate DCF, bank DDM, relative and residual-income cases, including edited annual paths. Invalid payout inputs withheld all four recommendations. Source snapshots were persisted and read back from the hosted application.

In the extracted source:

| Path | Purpose |
|---|---|
| src/ | Inputs, validation, valuation, sensitivity, simulation and workbook logic |
| public/ | Front end, original logo, fonts, export libraries and saved data |
| tests/ | Calculation and source-boundary regression tests |
| server.mjs / server-v5.mjs | Local application server |
| build.mjs / build-v5.mjs | Hosted Worker build |
| USER_GUIDE_5.md / RELEASE_5.md | Operating guide and implementation status |

Validation does not certify every external disclosure or forecast. Unattended market-wide refresh, empirical calibration, additional sector models and full point-in-time fundamental backtesting remain documented work.

## Updates and academic disclosure

GitHub commit history records actual upload and later modification times. This repository and the live website may receive clearly documented improvements after the links were submitted. A later update is not represented as having existed at an earlier submission time; course policy determines which version is assessed.

AI assisted software development and documentation. Runtime financial facts are retrieved or imported; deterministic code produces the calculations and model decisions.

Public-source references: [IDX](https://www.idx.id/), [Yahoo Finance](https://finance.yahoo.com/), [IDX financial-statement retrieval reference](https://github.com/celeebi/IDX_GetFinancialStatement), and [Damodaran financial-service valuation](https://pages.stern.nyu.edu/~adamodar/pdfiles/country/finsvce.pdf).

**Yusuf Zakaria** · [yusufzaakaria@gmail.com](mailto:yusufzaakaria@gmail.com) · [LinkedIn](https://www.linkedin.com/in/yusuf-zakaria)
