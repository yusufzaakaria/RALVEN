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
