# RALVEN 5.2.0 — reviewed operating recovery

Released 26 October 2026, after the original submission. This is the next bounded stage of the intrinsic/relative remediation. It does not assert complete financial statements, dual-method valuations, or investment recommendations for every IDX issuer.

## What changed

- Operating companies can use FCFF with negative early cash flows only through an explicit analyst-reviewed five-year recovery plan. Both final years require positive EBIT and FCFF.
- The analyst supplies all six annual operating drivers, unrestricted cash allocated, a liquidity reserve, and five years of after-tax financing interest, principal and other cash obligations. Blank obligations never become zero. Principal cannot exceed disclosed financing debt.
- Annual closing cash must fund deficits, obligations and the reserve. No new borrowing, equity issuance or dilution is supported. Financing cash payments constrain liquidity and are not deducted a second time from FCFF equity value. Constant WACC and current capital-claim values remain conditional assumptions.
- Negative EBIT creates no immediate cash tax credit. No tax-loss carryforward benefit is invented. A separate jurisdiction-specific tax schedule would be needed to recognize such benefits.
- An active unreviewed, stale or underfunded recovery plan withholds the action (WAIT), including when a relative fallback value exists. Removing the plan restores ordinary method-selection rules.
- EV/Sales can accompany an eligible operating recovery when trailing earnings and EBITDA are nonpositive. At least three eligible positive peer observations are required; EV/Sales is capped below 30x. A sales multiple is a conditional pricing cross-check, not evidence that future profitability will recover.
- Scenarios, sensitivity matrices, tornado values and Monte Carlo apply the recovery/funding gates. Invalid stresses remain unavailable. Monte Carlo exposes recovery/funding rejections; accepted draws are conditional and not investment probabilities.
- Data and Forecast contain a recovery editor and liquidity schedule. Excel adds literal Recovery Inputs and formula-based Recovery Funding sheets, linked eligibility/rating guards and sensitivity checks. PDF includes the cash budget, source/rationale, limits, scenario omissions and simulation rejections.
- Optional recovery inputs and annual paths round-trip through the Excel template. Exported boolean formula results retain valid XLSX cell types. Source classifications, peer membership, simulation and tornado remain export-time snapshots where labelled.

Review binds to the financial period, valuation date and source snapshot. User-entered review assertions are not independent source certification. Device-local plans are not uploaded as shared issuer facts. Excel source changes require reimport and review.

## Validation

144 automated tests pass, including archived BMRI values and simulation, funded/unfunded recovery, missing claims, review-basis changes, tax treatment, scenario shocks, sensitivity/Monte Carlo reconciliation, Excel import and the actual browser XLSX writer. Seven independent spreadsheet cases recalculate to the engine, covering FCFF, DDM, relative, residual, residual/relative blend and recovery with EV/Sales or EV/EBITDA. Funding reductions and blank annual drivers produce WAIT and blank sensitivity outputs. English and Indonesian report funding pages and browser controls were reviewed.

The [synthetic recovery example](https://ralven-equity-terminal.airycoot8.chatgpt.site/?case=RECOVERY-DEMO) uses fictional subject and peer data solely to inspect model behavior. It is not an IDX issuer analysis. Its tests are in `tests/recovery*.mjs`.

## Coverage and remaining work

The dated 962-issuer package still records 474 dual-method assessments: 71 cash-flow DCF + relative and 403 accounting-based residual income + relative; 168 relative-only, 42 intrinsic-only and 278 incomplete. Source-primary coverage remains 924/962. These counts distinguish availability from actionability and do not represent a new market-wide data retrieval. Recovery plans are intentionally not auto-created to inflate coverage.

Remaining stages:

1. Retrieve and review missing debt, leases, preferred claims, notes, D&A and compatible TTM evidence. Preserve missing/nil as missing and original source lineage.
2. Prepare issuer-specific recovery forecasts and cash obligations where reliable disclosures permit; extend to explicit refinancing/dilution, tax-loss schedules and intrayear liquidity only with supporting data.
3. Integrate supported mine-life/closure, holding-asset DCF and capital/solvency-aware financial-sector models. Research Lab sector cases remain supplemental until that integration is validated.
4. Review issuer forecasts, peer economics, terminal normalization, residual clean-surplus/fade assumptions and simulation calibration. A technically calculable value is not a validated analyst conclusion.

The original submitted BMRI PDF, archived BMRI assumptions/results and `submission-baseline-2026-10-25` remain preserved. Later code/reports are versioned rather than backdated. Prior release notes: `RELEASE_5_1.md`.

Methodology reference: [Damodaran, cash-flow DCF](https://pages.stern.nyu.edu/~adamodar/pdfiles/dcfcf.pdf). The implementation's cash-funding limits and review rules are explicitly documented model policy.
