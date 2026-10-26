# RALVEN 5.3.1 — period-matched source repair

Released 26 October 2026, after submission. This stage improves actual data retrieval and rejects unsupported historical defaults. It does not claim complete statements or validated intrinsic/relative values for every issuer.

Version 5.3.1 also restores direct Data-menu access on narrow screens. This navigation correction preserves the 5.3 source rules and calculation logic.

## Data retrieved and exposed

- Queried supplemental Yahoo financial records for all 962 directory issuers. 650 returned 31,890 explicit dated observations; 312 returned none of the requested quarterly/TTM fields. No transport failures were recorded in this run. Quotes and original IDX filing dates were not refreshed or relabelled.
- Added provider-reported TTM flows and dated quarter-end balances to the source adapter and packaged evidence. These are aggregator records, not IDX statements. Annual and periodic Yahoo observations count as the same origin. Primary compatible facts retain priority, and material disagreements remain conflicts.
- Provider TTM is accepted only when explicitly labelled TTM. Quarter-end balances retain their dates. Quarterly flows are not multiplied by four, annual balances are not carried forward, normalized EBITDA is not silently substituted for reported EBITDA, and reconciled depreciation is not treated as full D&A.
- Extracted 5,407 selected financing, capital and depreciation text excerpts from compatible cached IDX instances, covering 726 issuers. Data offers filing selection, note search and source/context/period labels. Excel includes Source Filing Notes; PDF includes a supporting-note index when exported through the application. Truncation is labelled. Numeric statement archives remain available for 924 issuers.
- Refresh attempts and issuer-level outcomes are downloadable in `public/data/source-refresh.json`. Text notes do not automatically become numeric valuation inputs, verified zeros or recommendations. The original PDFs and dimensional schedules still require review.

## Material correctness fixes

Earlier adapters assumed zero for absent preferred/minority claims. That behavior is removed from the optional Python adapter. Saved records explicitly documenting such assumptions are quarantined: the rejected raw value, period and reason remain inspectable, while a compatible independently reported replacement may still be used. Missing remains missing.

An observed debt total below compatible primary borrowing components is flagged as a conflict. Missing EBIT is not coerced to zero to backsolve a D&A assumption from EBITDA. Older stored latest snapshots are reprocessed through the current source rules; superseded stored summaries cannot overwrite the current screen. Exact dated snapshots and the original submitted BMRI case remain preserved.

## Measured gap changes

Same 962-record audit, same 26 October valuation date; these are selected-basis field gaps, not a claim that every remaining value is independently verified:

| Input | Missing before | Missing after |
|---|---:|---:|
| Debt | 333 | 157 |
| EBITDA | 737 | 316 |
| Capex | 821 | 372 |
| EBIT | 71 | 54 |
| Preferred claims | 771 | 850 |
| Full D&A | 848 | 848 |

Preferred gaps increase because unsupported assumed zeros were removed. Depreciation-only disclosures remain distinct from full D&A. Do not repair these gaps by entering unverified zero.

## Coverage and validation

The current package records 475 two-method assessments: 69 DCF + relative and 406 accounting-based residual income + relative. It also records 169 relative-only, 41 intrinsic-only and 277 incomplete assessments. DCF coverage is lower than 5.2 after rejecting unsupported/default or conflicting inputs. Availability remains separate from actionability; residual income is not labelled cash-flow DCF.

The screen records 40 source-reconciled valuation indications, 636 conditional valuations, 152 technical indications and 134 WAIT outcomes. 676 supported fundamental analyses pass sensitivity-center, tornado and seeded 100-draw simulation checks. Unsupported charts retain explicit reasons. Market-price freshness remains based on the original quote dates, not the statement retrieval time.

161 automated tests pass, including the original BMRI result/seed controls, provider-period/definition/origin checks, explicit-zero versus missing, legacy-default quarantine, debt components, safe note extraction, stored snapshot handling and existing recovery-model checks. Seven independently recalculated spreadsheet cases continue to match the engine and sensitivity centers. The production build validates cached CPIN delivery, same-period supplemental debt, missing preferred claims, note availability and worker routes with providers offline.

## What remains

1. Verify outstanding preferred/share-class claims, full D&A, lease/funding classification, PDF-only and dimensional disclosures. The new source-note access supports review; it does not complete it automatically.
2. Reconcile material source differences and unavailable/stale market quotes. An outcome for every directory record is not an investment-grade rating for every company.
3. Review issuer-specific operating forecasts, recovery funding, capital assumptions, peers and terminal states. Complete source data alone does not validate a forecast.
4. Integrate supported mining, holding-company and capital/solvency-aware sector models. Existing supplemental sector tools do not silently drive automatic recommendations.

The original submitted BMRI PDF, archived BMRI inputs/results, older deliverables and submission-baseline branch remain preserved. See `USER_GUIDE_5.md` for operation and `RELEASE_5_2.md` for recovery-model limits.

Source scope reference: [IDX XBRL taxonomy and notes](https://www.idx.id/en/listed-companies/xbrl/). Provider records remain separately identified in the evidence register.
