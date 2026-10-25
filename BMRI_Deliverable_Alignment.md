# BMRI submission: deliverable alignment and technical clarifications

Reviewed on 25 October 2026. The original submitted PDF is preserved unchanged. This note and the supporting files were prepared afterward; they are not represented as the original submitted slides.

## Scope

The submitted PDF contains 15 pages: one cover and 14 content slides. This falls within the required 12–15 content slides. All 11 requested subject areas are present. The PDF is predominantly rasterized, so it is not an editable PowerPoint source. A separate editable supporting PowerPoint is provided with 14 content slides, plus a cover, references and an appendix.

| Requirement | Submitted pages | Supporting evidence |
|---|---|---|
| Company overview and valuation purpose | 1–2 | BMRI profile and valuation context |
| Sources, date and historical performance | 3 | Dated source snapshot and report source appendix |
| Business drivers and forecast assumptions | 4 | Workbook Assumptions, Driver Paths and Assumption Register |
| Model structure and update workflow | 5 | Executable application, source modules and user guide |
| Observed market value | 6 | Price × shares calculation and market-cap reference |
| Discounted-cash-flow methodology/results | 7 | Five-year dividend discount model and terminal distribution |
| Relative valuation | 8 | Eligible bank P/E and P/B peer calculations |
| Approach selection and weighting | 9 | 50% DDM / 50% eligible relative valuation |
| Scenario and sensitivity analysis | 10 | Formula workbook, tornado, sensitivity and seeded simulation |
| Reconciliation and recommendation | 11–12, 15 | Method values, weighted contributions and decision thresholds |
| Validation, limits and AI disclosure | 13–14 | Source checks, calculation tests and technical limitations |

For a bank, DDM discounts cash distributions to common equity at cost of equity. It is a discounted-cash-flow approach to equity. It does not use corporate FCFF, WACC or a corporate net-debt bridge. The course's acceptance of that sector-specific approach remains an instructor decision.

## Reproduced figures

The engine reproduced all 11 checked headline figures within displayed rounding from the archived input basis: price, shares, DDM value, relative value, weighted value, upside, bear/bull values and Monte Carlo P10/P50/P90. No assumptions were adjusted to force agreement.

| Measure | Recalculated result |
|---|---:|
| Valuation date | 25 October 2026 |
| Quote date | 23 October 2026 |
| Income basis | TTM ended 30 June 2026 |
| Price | IDR 3,900/share |
| Shares | 92.4 billion |
| DDM value | IDR 6,446.916576/share |
| Relative value | IDR 4,049.692339/share |
| Weights | 50% / 50% |
| Weighted fair value | IDR 5,248.304458/share |
| Model upside | 34.571909% |
| Bear / bull | IDR 4,162.108753 / 6,576.007457 |
| Simulation | 5,000 attempted and accepted; seed 271828 |
| P10 / P50 / P90 | IDR 4,554.381845 / 5,264.208032 / 6,106.364630 |
| Source snapshot | rv5-d6d3731642bdf004 |

The archived example is a dated model result, not a claim that later refreshed data must produce the same value. Source-support labels concern the inputs used by the method, not the accuracy of forecasts or the completeness of all financial statements.

## Clarifications for a future revision or oral defense

1. **Page 7: full DDM equation.** The displayed P0 = D1/(Ke − g) is the single-stage Gordon equation. RALVEN's actual model is:
   - NI(t) = NI(t−1) × (1 + earnings growth(t)).
   - Dividend(t) = NI(t) × payout(t).
   - Terminal dividend = NI(5) × (1+g) × (1−g/terminal ROE).
   - Equity value = sum of five discounted dividends + discounted terminal value.
   - Terminal value = terminal dividend / (Ke−g); divide common equity value by shares.
   The Gordon expression belongs to the terminal calculation, not the full five-year valuation.
2. **Page 7: upside and ranges.** IDR 6,447 is the DDM leg. Its upside over IDR 3,900 is approximately 65.3%. The 34.6% figure belongs to the blended value. The IDR 4,162–6,576 range is the blended scenario envelope, not a standalone DDM range.
3. **Page 10: bear percentage.** IDR 4,162 / IDR 3,900 − 1 is approximately **+6.7%**, not −26.8%. Base and bull upside are approximately +34.6% and +68.6%.
4. **Pages 3 and 8: period labels.** Book equity is a balance at 30 June 2026, not a TTM flow. A 30 June TTM denominator date should be called the basis end date, not necessarily the financial year end.
5. **Exact versus displayed rates.** The base cost of equity is 12.35% (6.5% + 0.9 × 6.5%), displayed as 12.4%. The engine and workbook retain full precision.
6. **Missing detail and editable format.** The supporting workbook and reports add the forecast schedule, terminal retention/payout mechanics, source locators, assumptions and appendices. The supporting PPTX contains editable tables/charts rather than presenting the raster PDF as an editable source file.

## How to reproduce

Use the dated BMRI workspace/model supplied here and the archived BMRI case link documented in the repository. Keep the source snapshot, valuation date, peer membership, assumptions and simulation seed together. Refreshing market or filing data creates a different research basis.

Restored user-uploaded JSON claims remain user supplied until refreshed against providers. A first-party archived case is explicitly labelled as dated evidence, not as a fresh data query.

## Remaining material limitations

Shared forecast defaults and simulation parameters are analyst settings. Regulatory capital, credit costs and dividend restrictions require issuer-specific review. A 50/50 blend is a disclosed course-model policy, not statistically optimized weighting. The current public archive does not contain complete primary financial statements for every IDX issuer. Missing disclosures remain flagged.
