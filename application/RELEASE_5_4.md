# RALVEN 5.4.0

Release finalized 27 October 2026. Original submitted BMRI materials remain unchanged.

## Source repair
Processed 1,804 cached IDX filings, retaining original dates. Found 395 selected preferred-stock closing rows and added 267 observations across historic/current periods for 130 issuers, without extraction errors. On the selected financial basis, 84 issuers gain a preferred-stock input: missing preferred inputs decrease from 850 to 766.

Only explicit preferred-stock closing zero qualifies, with consolidated equity, parent equity and common stock matching the face statement for the same entity, currency and date within reported rounding tolerances. Nil, openings, movements, ambiguous contexts, extra dimensions and positive nominal balances cannot establish zero claims. Original issuer source groups remain; opposing face values remain conflicts.

Data exposes closing balance, context and three controls. Excel includes Capital Schedule Checks with residual formulas; PDF evidence includes controls. Download /data/capital-audit.json for the extraction audit. This narrow numeric extraction does not automatically interpret other notes.

## Method eligibility
Each intrinsic method passes its own input-conflict check before selection. A populated but conflicted DCF cannot displace an eligible residual-income model. Relative valuation excludes conflicted subject denominators and enterprise-to-equity bridges as well as conflicted peers. Excel preserves exclusions when recalculated; its source policy is frozen at export and needs refresh after evidence changes.

Unrelated conflicts stay visible without blocking methods that do not use those inputs. This does not resolve the conflict or certify the issuer. Residual income retains clean-surplus, book-quality and forecast assumptions and is not cash-flow DCF.

## Coverage
Same 26 October valuation-date audit:

| Assessment | 5.3.1 | 5.4.0 |
|---|---:|---:|
| DCF + relative | 69 | 76 |
| Residual income + relative | 406 | 391 |
| Total two-method | 475 | 467 |
| Relative only | 169 | 166 |
| Intrinsic only | 41 | 41 |
| Incomplete | 277 | 288 |

Coverage can decrease when disputed methods are excluded. There are 962 directory issuers, numeric primary archives for 924, and full D&A remains missing for 848 on the selected basis. Existing 5,407 note excerpts for 726 issuers remain.

674 supported fundamental analyses pass sensitivity-center, tornado and seeded simulation checks; 288 retain explicit unavailable reasons. Assurance distinguishes 41 fundamental, 633 indicative, 163 technical and 125 unrated assessments. Technical signals are not intrinsic valuations. Quotes retain observed dates.

## Validation and remaining work
177 tests pass, including preserved BMRI controls, schedule identity/zero checks, method eligibility and exports. Ten independently recalculated Excel cases match engine values and sensitivity centers. Production artifact checks pass. Browser review verifies ICBP capital controls while retaining its disputed EBIT warning.

Remaining: verify unresolved claims and full D&A in notes/PDFs; reconcile conflicts; review issuer forecasts, recovery funding and peers; add supported mining, holding-company and solvency-aware models. Complete all-issuer data and investment-grade recommendations are not claimed.

Source scope: https://www.idx.id/en/listed-companies/xbrl/ . See USER_GUIDE_5.md and earlier release notes.
