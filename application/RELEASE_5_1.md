# RALVEN 5.1.0 — independent method assessment

Released 26 October 2026. First implementation stage of the intrinsic/relative remediation plan. This does not claim that every issuer has a supported cash-flow DCF.

## Implemented

- Relative success no longer prevents assessment of an eligible residual-income intrinsic candidate. Profitable issuers with sufficient annual earnings/book history can combine conditional residual income and eligible relative pricing when FCFF/DDM is unavailable. Equal 50:50 weights are a disclosed classroom policy, not a calibrated optimum.
- Independent method assessment records intrinsic, relative and cash-flow DCF status, values, weights, gaps and reasons. Accounting-based intrinsic is never labelled cash-flow DCF or claimed to complete the course DCF comparison.
- Residual blends use the same weights in scenarios, sensitivity centers, Monte Carlo, chart contributions, football fields and linked Excel formulas. Excel contains method coverage and separate standalone values.
- Source-supported NCI reconstruction uses consolidated total equity minus parent equity from the same original filing/date/currency/unit. Components and provenance are retained. Nil, missing preferred claims and missing debt never become certified zeros.
- Data remediation lists DCF gaps separately from active-model inputs. Valuation/Integrity show full assessments; the dashboard has a compact indicator; screener and CSV disclose method coverage.
- Packaged screener and issuer lookup share a deterministic, bounded peer evidence universe and valuation date. Unrelated earlier lookups cannot change eligibility. Valuation dates use Asia/Jakarta; source dates remain intact.
- Archived BMRI values remain reproducible. Current refreshed issuer/peer data can change a new analysis; the submission case remains dated.

## Validation

125 regression tests pass. Independent spreadsheet recalculation matches corporate FCFF, bank DDM, relative-only, standalone residual income and residual/relative blend, including annual payout paths, sensitivity centers and invalid-input guards. A browser-downloaded AALI workbook includes both formula chains, method assessment and source facts with no cached formula error cells. Its combined value Rp9,323.536195980834 matches the displayed Rp9,324 for that tested snapshot.

Tests do not certify external disclosures or forecast economics. No native Excel execution certification or calibrated investment probabilities are claimed.

## Packaged coverage

The regenerated 962-issuer package records 474 two-method assessments: 71 cash-flow DCF + relative and 403 accounting-based intrinsic + relative. It records 168 relative-only, 42 intrinsic-only and 278 incomplete assessments. Availability is separate from actionability; conditional/blocked decisions remain labelled. Original directory and financial-source dates are retained. No new market-wide live retrieval is claimed.

## Remaining implementation stages

1. Retrieve and review remaining capital claims, note disclosures, D&A and compatible TTM components. Preferred-claim absence must be verified rather than assumed.
2. Add reviewed recovery and financing schedules before relaxing negative early-FCFF eligibility. Change engine, Excel, stresses and funding checks together.
3. Integrate fully supported mine-life, attributable holding-asset DCF and solvency/capital-aware sector models. Current sector tools remain supplemental analyst cases; unsupported automatic models remain blocked.
4. Replace common forecast and simulation defaults with reviewed issuer assumptions and appropriate calibration. Clean-surplus accounting and residual-income fade assumptions also require review.

This release improves method selection and traceability. It does not present accounting estimates as replacements for missing cash-flow evidence.
