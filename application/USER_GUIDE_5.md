# RALVEN 5 operating guide

BMRI is the submitted course case. Open the application with `?case=BMRI-2026-10-25` to reproduce its dated inputs and simulation settings, or `?ticker=BMRI` to open the currently saved issuer snapshot. The archived case is labelled explicitly; refreshing it queries newer sources and changes the research basis.

Run with Node.js 24 or newer: `node server.mjs` from this folder, then open `http://127.0.0.1:4173/`. No npm install is needed for the normal application; browser export libraries are vendored. Network access is required for new public-source queries. Saved snapshots support offline inspection. No paid data subscription is bundled.

1. Enter a four-character IDX ticker. Opening a company loads its saved evidence; **Refresh data** requests new public market/filing data. Inspect quote and financial dates separately.
2. In **Data**, review required gaps, original statements and conflicting definitions. A missing value, verified zero and sector-inapplicable field have different meanings. Download the input template from **Export**, document replacement inputs and upload it. Files remain in the browser.
3. In **Valuation**, review eligible methods, weights, equity reconciliation and football field. In **Forecast**, edit operating/payout assumptions. Forecast years are rolling anniversary periods from the valuation date, not claimed fiscal-year guidance.
4. In **Peers**, include/exclude candidates and inspect dates, source status and economic differences. Inclusion does not override source/date/denominator screens; at least three eligible observations are required for a used multiple.
5. **Research lab** offers assumption sources, five annual driver paths, named scenarios, editable simulation settings, supplemental sector cases, snapshot history, notes and device-local watchlists. Changes require recalculation. Supplemental sector outputs are explicitly separate from the automatic recommendation.
6. **Sensitivity** shows only supported fundamental analysis. Monte Carlo represents conditional model uncertainty. Parameters are analyst assumptions; P10/P90 are not probabilities of future traded prices.
7. **Export** downloads a formula workbook, PDF, portable JSON workspace or coverage CSV. Excel source-policy and peer membership reflect export time; refresh/reimport to rescreen them. Driver Paths references the Assumptions sheet unless overridden. Invalid editable inputs produce WAIT rather than a spurious recommendation.
8. Restore JSON using **Choose file**. The original valuation date, forecast paths, simulation seed/count and scenario metadata are retained. Restored source claims become user supplied until refreshed against providers. Keep the JSON with the matching report/workbook.

BUY means upside at least the chosen positive threshold (default 15%); SELL means downside at least the chosen negative threshold (default -15%); HOLD falls between. Technical signals use separate price rules. WAIT means essential evidence/model requirements are unresolved and is not HOLD. An outcome for all directory records does not mean all issuers have complete financial statements or an investment-grade recommendation.

Contact: [yusufzaakaria@gmail.com](mailto:yusufzaakaria@gmail.com) · [Yusuf Zakaria on LinkedIn](https://www.linkedin.com/in/yusuf-zakaria).


## Method coverage in version 5.1

Open Valuation or Integrity for independent intrinsic, relative and cash-flow DCF assessments. BOTH means two available valuation methods, not necessarily cash-flow DCF. ALTERNATIVE_INTRINSIC_AND_RELATIVE means residual income plus peers: the course cash-flow DCF remains incomplete. Inspect DCF requirements and Data for the exact source gaps. Residual-income/relative blends use equal conditional classroom weights and five-year clean-surplus ROE fade; review these assumptions before relying on an indication.

Screener coverage and exported CSV expose both method coverage and DCF comparison status. Excel and PDF include the same distinction. Missing source values remain blank; source-supported NCI reconciliation does not certify absent debt or preferred claims. See RELEASE_5_1.md for implemented and remaining stages.

## Cash-funded operating recovery in version 5.2

In Data or Forecast, expand **Cash-funded recovery** for an operating company. Review the original filing and debt-service disclosures, then enter all six operating drivers for each of five years, unrestricted cash allocated, minimum cash reserve, and annual after-tax financing interest, principal and other obligations. Enter zero only when reviewed absence supports zero. Provide the source URL, review date and rationale, and confirm the no-new-financing and analyst-review statements before applying. Existing source, quote, unit and claim checks still apply.

The annual cash budget must remain above the reserve and the last two forecast years must have positive EBIT and FCFF. A blocked active plan produces WAIT. It can be corrected or removed. Negative EBIT receives no immediate tax credit. The model does not add new debt, issue shares, calculate dilution, recognize unverified tax losses or check intrayear liquidity peaks. Review constant WACC, original capital-claim values and terminal normalization separately.

Year-specific recovery paths override shared operating defaults. Edit them in the recovery table; discount and terminal assumptions remain in Valuation. Plans are stored on this device, tied to the current source period/date/snapshot. Re-review after source changes. Named scenarios and workspace JSON retain plans, paths and simulation settings; manually imported source claims remain provisional.

Excel templates include an optional Recovery Inputs sheet with review flag 0 unless intentionally activated. Set flags to 1 only after review, complete all cash inputs and replace the six annual operating-driver links with explicit reviewed decimal values in Driver Paths (0.05 = 5%). Import to recalculate. Exported models include the linked Recovery Funding cash budget; invalid funding produces WAIT. Peer selection and source policy are frozen at export and need reimport after source changes. Simulation and tornado values are labelled snapshots.

Rejected funding/terminal scenarios remain unavailable. A supported scenario range may omit a bear/bull case and is not a confidence interval. Monte Carlo reports attempted, accepted and rejected draws, including recovery/funding rejections; its accepted distribution is conditional on the chosen recovery assumptions. Use the fictional `?case=RECOVERY-DEMO` example to inspect behavior without altering a real issuer. See RELEASE_5_2.md for validation and remaining work.

## Period-matched evidence and note review in version 5.3

Refresh now requests provider-reported TTM flows and dated quarter-end balances alongside annual statements and IDX filings. Each observation keeps its own period, native currency/amount, source and retrieval time. Yahoo annual and periodic data share one origin. The provider's publication timestamp may be unknown; source agreement is not independent analyst verification. Refreshing statements does not make an old quote current.

In **Data**, choose the filing in Source Statement Explorer, then use **Review filing notes** or search **Find a filing note**. Selected financing, capital and depreciation excerpts retain their tag, context and reporting period. Excerpts may be truncated or point onward to a PDF. Full dimensional/segment schedules and other notes still require the original filing. No note amount is automatically inserted into the valuation. Excel exports include Source Filing Notes and Rejected Legacy Inputs; PDF exports index the available supporting note excerpts.

**UNVERIFIED DEFAULT** means an older adapter explicitly assumed zero when a claim was absent. That raw assumption has been rejected. It can be replaced only by compatible documented evidence; do not re-enter zero merely to activate DCF. A missing value, source-supported numeric zero, partial subtotal and inapplicable metric remain different states.

Quarterly flows are never multiplied by four. Reported TTM flows are labelled separately from IDX annual + current YTD - prior comparable YTD calculations. Annual figures are not relabelled to a newer balance date. Normalized EBITDA and depreciation-only figures do not establish reported EBITDA or full D&A. Material conflicts and a debt total below known primary borrowing components require review.

The dated all-issuer supplemental refresh audit is available at `/data/source-refresh.json`; the updated data/chart gaps remain at `/data/completeness.csv`. These files document availability, not completion of a company-by-company analyst review. See RELEASE_5_3.md for measured changes and remaining work.
