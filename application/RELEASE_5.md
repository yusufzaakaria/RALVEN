# RALVEN 5.0.1 — 25 October 2026

The 5.0.1 patch adds an explicitly dated BMRI case, ticker deep links, bank-specific workbook labels and removal of unused corporate FCFF projections from bank exports. Financial calculations are unchanged. All 11 checked BMRI headline values reproduce the original 5.0.0 case within displayed rounding. The full regression suite now has 108 passing tests.

Archived case: append `?case=BMRI-2026-10-25` to the application URL. Append `?ticker=BMRI` for the currently saved BMRI source snapshot. The archived case keeps 25 October 2026 valuation assumptions, a 23 October quote, and TTM income ended 30 June. Refreshing data creates a different research basis.

This release implements the audited round-trip, timing, validation and interface repairs. Financial availability remains constrained by public disclosures. It does not certify complete statements for every IDX issuer.

## Implemented

- Left-to-right market ticker: 16 curated liquid/representative names plus the selected company, observed daily changes, dated one-month sparklines, pause on hover/focus and reduced-motion support. Prices are dated observations, not streaming quotes.
- Original RALVEN loading logo; professional typography; compact/comfortable density; accessible focus states; author email and LinkedIn footer.
- Separate Valuation, Forecast, Data, Peers and Research Lab views. Method football field, historical quality charts, peer scatter/quartiles, applicable sensitivities, tornado and Monte Carlo charts, chart SVG download and table alternatives.
- Data remediation workbench with required inputs, evidence dates, source conflicts and next actions. Missing, annual-only, partial and inapplicable disclosures remain distinct.
- Versioned Excel peer revenue, editable year-by-year drivers, linked formulas and recommendation guards. Shared PDF renderer with source appendices, safe formula glyphs, footers and English/Indonesian text. Workspace restores forecast paths and all simulation controls.
- Explicit rolling next-twelve-month forecasts anchored to valuation date; documented common assumptions and analyst rationale; saved named scenarios; peer inclusion/exclusion without bypassing eligibility.
- Business-model registry distinguishes banks, insurers, financing, investment, holdings, manufacturers and extractors. Supplemental analyst-input SOTP, finite-life mine and bank common-capital capacity tools are separate from automatic ratings.
- Adjusted provider histories, corporate-action diagnostics and neutral flat-price RSI. Cost-aware walk-forward price-rule diagnostic; it is not a historical fundamental backtest.
- On-demand per-issuer evidence, bounded caches, coalesced/cooldown refresh, screener/archive refresh propagation, exact public/src static roots, runtime health, source snapshot persistence when hosted storage is available, paginated summary updates and source history.
- 102 original/upgraded regression tests passed before final service cases; independent spreadsheet recalculation matched FCFF, DDM, relative and residual-income outputs with annual paths. Invalid payout withheld all four recommendations. Final validation receipts accompany the submission.

## Verified data scope

The directory refreshed on 25 October contains 962 issuers. The saved primary archive covers 924 issuers / 1,804 filings / 419,625 numeric non-dimensional facts. A new targeted retry recovered no additional primary statements for the remaining 38 issuers. A raw fact archive excludes many segment/note/PDF-only disclosures and is not a complete normalized financial database.

The refreshed engine produces 308 source-checked and 375 conditional valuations. All 683 eligible valuations have calculated sensitivity, tornado and Monte Carlo output. Other outcomes remain technical-only or WAIT as appropriate. Figures are saved-snapshot counts, not a live market-wide refresh.

## Remaining audit work and limits

1. Recover and reconcile missing public facts, leases, D&A, reserves and note disclosures using documented issuer/IDX sources. Availability cannot be guaranteed by code. Do not convert unexplained missing values into zero.
2. Replace common forecast defaults with reviewed issuer models and empirical simulation calibration. Current sigmas/correlations are editable analyst settings, not calibrated investment probabilities.
3. Expand supported sector models to insurer solvency, property NAV and credit-loss dynamics. Supplemental bank/SOTP/mine cases currently require explicit analyst inputs and do not silently alter automatic ratings.
4. Add historical average FX/constant-currency presentation and more currency-native models. Current foreign-input valuation is a disclosed fixed-spot IDR scenario and remains conditional.
5. Build an unattended durable market-wide filing queue and controlled notifications. Current source refresh and watchlist checks are user initiated. No scheduled emails or external messages are sent.
6. Add additive fair-value change attribution, full point-in-time fundamental validation and multi-user review approvals. Current change ledger records field differences; notes, scenarios and watchlists are device-local, with portable JSON export.
7. Extend browser automation into committed provider-failure, download/import, mobile and cross-browser tests. Calculation/artifact command checks are included; manual browser verification is documented separately.

These items remain part of the original audit scope. They are recorded as outstanding rather than marked complete by the presence of a chart or a BUY/SELL label.
