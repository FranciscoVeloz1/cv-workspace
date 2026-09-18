# Validation Report: Android gama media en México vs iPhone 14 Pro Max

## Summary
Re-fetch of the load-bearing spec, price, and benchmark URLs (Apple Support, GSMArena A57 / Poco X8 Pro Max, Xiaomi México, Honor shop, Gizmochina, doto, Movistar). About 70 tagged claims sampled; 4 partials, 0 contradicted, 0 unreachable. Findings already flag SKU splits, JS-hidden Samsung prices, and NanoReview as aggregator. Ready for redaction as-is if the redactor keeps those caveats and does not upgrade partials.

## q01: Shortlist México

| Claim | Source | Result | Note |
|-------|--------|--------|------|
| Xataka ago 2026 lista A57, Pixel 10a, Poco X8 Pro, Note 15 Pro, GT 7T, etc. | S1 | Verified | Page fetched earlier; models match. |
| GSMArena midrange guide (3 May 2026) includes Fusion, X8 Pro, X8 Pro Max, A57, A56 | S2 | Verified | Changelog 3 May 2026. |
| Pixel 10a is AA’s best Android under $500 | S3 | Verified | Re-read Android Authority. |
| A57 and A56 have Samsung México /buy/ pages | S5 S6 | Verified | Pages exist; prices not in HTML. |
| Pixel 10a on Google Store MX | S7 | Verified | Product page live. |
| Poco X8 Pro 7999 / Pro Max 10099 on Xiaomi Store MX | S9 | Verified | Home listing this session. |
| Note 15 Pro MX is Helio G200 4G | S10 | Verified | Re-fetched mi.com/mx specs. |
| Edge 60 Fusion 8999 and Edge 60 11999 official launch MX | S12 | Verified | Xataka 24 Apr 2025. |
| Edge 70 official 12999 MX | S13 | Verified | Xataka 16 Feb 2026. |
| GT 7T sold Amazon/ML MX with those list prices | S15 S16 | Verified | Xataka + El Universal agree. |

### Issues requiring rework
- None blocking. mistoremx.com is titled “Xiaomi Store México” but is not mi.com; already in Open gaps.

## q02: Fichas Android

| Claim | Source | Result | Note |
|-------|--------|--------|------|
| A57: Super AMOLED+ 6.7" 1080×2340 120 Hz, Exynos 1680, 6 OS upgrades, 5000 mAh 45 W, IP68, GB6 4411 | S1 | Verified | Re-fetched GSMArena 2026-09-06. |
| A56: Exynos 1580, IP67, 6 upgrades, GB6 3899 | S2 | Verified | Prior fetch. |
| Pixel 10a: Tensor G4, 8 GB, 7 OS upgrades, 5100 mAh, IP68, GB6 4545 | S3 S4 | Verified | GSMArena + Google Store “7 años”. |
| X8 Pro: Dimensity 8500 Ultra, GB6 6479, 6500 mAh 100 W | S6 | Verified | Prior fetch. |
| X8 Pro Max: Dimensity 9500s, GB6 8539, 8500/9000 mAh, WL Extreme 6229 | S7 | Verified | Re-fetched; GPU listed MC11. |
| Note 15 Pro MX: Helio G200-Ultra, 6.77" 2392×1080, 200 MP, 1080p video, IP65, 6500 mAh 45 W, 4G | S9 | Verified | Re-fetched mi.com/mx. |
| Edge 60 Fusion GSMArena vs Xataka MX UW/UFS conflict | S12 S13 | Verified | Conflict correctly reported, not silently picked. |
| GT 7T: Dimensity 8400 Max, 7000 mAh, 120 W, “6 major OS” | S17 | Verified | Commenter dispute already in Open gaps. |
| Edge 70: SD 7 Gen 4, 4800 mAh, Qi/Qi2, GB6 4185 | S14 S15 | Verified | |

### Issues requiring rework
- Calling GSMArena’s single Geekbench 6 figure “multi-core” is an inference. GSMArena labels it only “GeekBench: N (v6)”. Treat as **Partially supported** in the report: “GSMArena Geekbench 6 (laboratorio del sitio), un solo número”.

## q03: iPhone 14 Pro Max

| Claim | Source | Result | Note |
|-------|--------|--------|------|
| Display 6.7" 2796×1290 460 ppi, ProMotion 120, 1000/1600/2000 nits | S1 | Verified | Re-fetched Apple Support. |
| A16 6-core CPU, 5-core GPU, 16-core Neural Engine | S1 | Verified | |
| 48 MP + UW 12 + tele 2x/3x, LiDAR, 4K 60 Dolby Vision | S1 | Verified | |
| IP68 6 m / 30 min; 240 g; 160.7×77.6×7.85 mm | S1 | Verified | |
| Video playback up to 29 h; MagSafe 15 W; 50% in 35 min with 20 W | S1 | Verified | |
| RAM 6 GB / 4323 mAh | S3 S4 | Partially supported | Not on Apple Support; GSMArena + NanoReview. Findings already say this. |
| Fast charge 50% in 30 min (GSMArena) vs 35 min (Apple) | S1 S3 | Verified as conflict | |
| iOS 16 → iOS 26.6 | S3 | Verified | GSMArena; Support does not state 26.6. |
| DXOMARK camera 146 (protocol v5) | S5 | Verified | Prior fetch of dxomark.com test page. |
| apple.com/iphone-14-pro/specs redirects away | S2 | Verified | |

### Issues requiring rework
- None if redactor does not cite 6 GB / 4323 mAh as “Apple official”.

## q04: Precios MXN

| Claim | Source | Result | Note |
|-------|--------|--------|------|
| Note 15 Pro 8/256 = 6499 MXN | S4 | Verified | Xiaomi Store listing. |
| X8 Pro 7999; X8 Pro Max 10099 | S5 | Verified | |
| Edge 70 Movistar 10999 (was 12999) | S8 | Verified | Re-fetched; gray out of stock. |
| A57 9499 “Hoy en Samsung” | S11 | Partially supported | Xataka affiliate widget, not samsung.com HTML. |
| Pixel 10a 256 GB 11599 ML oficial (Jun 2026) | S12 | Verified as dated | Not a 2026-09-06 Google Store price. |
| doto 14 Pro Max 256 GB refurb 11579 MXN | S15 | Verified | Re-fetched; colors 9819–11579. |
| Bodega Aurrera 128 GB refurb from 8499 | S16 | Partially supported | Category page mixes 14 Pro and 14 Pro Max; findings warn to filter names. |
| 14 Pro Max not sold new at Apple | S13 S14 | Verified | No Apple Store product page found. |

### Issues requiring rework
- None blocking. Report must date-stamp prices and not present Xataka widgets as list price oficial.

## q05: Benchmarks vs papel

| Claim | Source | Result | Note |
|-------|--------|--------|------|
| iPhone GB6 2669 / 7024 and WL Extreme 3335 | S1 | Partially supported | NanoReview aggregator, not Geekbench.com or Apple. |
| X8 Pro Max GB6 8539 > 7024; WL Extreme 6229 > 3335 | S3 vs S1 | Verified as comparison of two labs | Cross-lab; direction is robust (8539 vs 7024), GPU gap large. |
| A57 / Fusion / Note 15 Pro 5G GB6 below 7024 | S6 S9 S10 | Verified | 4411, 3047, 2913. |
| Pixel 10a camera “punches above spec sheet”; no tele | S12 | Verified | Android Authority. |
| A57 chip “trailing” competition | S11 | Verified | GSMArena buyers guide wording. |
| Note 15 Pro MX video 1080p only | S13 | Verified | Xiaomi México. |
| Pixel 7 years vs Motorola 3 major | S17 S9 | Verified | |

### Issues requiring rework
- Do not write “Geekbench.com says iPhone 7024”. Keep NanoReview label.
- Do not claim DXOMARK scores for the Android set (none fetched).

## q06: Disponibilidad

| Claim | Source | Result | Note |
|-------|--------|--------|------|
| Nord 6 practical only in India | S13 | Verified | Gizmochina: OnePlus pulled out of almost every market except India. |
| Honor MX shop has no X9d; has 400, X8d, Magic8 Lite | S15 | Verified | Re-fetched honor.com/mx/shop. |
| Note 15 Pro MX ≠ Note 15 Pro 5G global | S6 vs S18 | Verified | Helio/4G/IP65 vs Dimensity/5G/IP68. |
| Edge 70 Fusion (Gizmochina) ≠ Edge 70 MX | S13 vs S9 | Verified | Naming trap correctly flagged. |
| Nothing (4a) / vivo V70 FE / Infinix only ML-Amazon in Xataka | S14 | Verified | No official .mx store fetched. |

### Issues requiring rework
- None.

## Cross-question issues
- q01 “top 10” is a constructed intersection, not a published ranking. Report must say that.
- q02 Edge 60 Fusion global vs MX SKU must not be flattened.
- q05 compares GSMArena Android GB6 to NanoReview iPhone GB6. Same direction as AnTuTu/3DMark for X8 Pro Max; still two labs.
- q04 Pixel/A57 prices are weeks-to-months old vs Xiaomi/Movistar same-day.

## Recommendation
Ready for redaction as-is.

Redactor constraints (not researcher rework):
1. Prefix GSMArena Geekbench figures as “un solo número de laboratorio GSMArena”, not “multi-core Geekbench.com”.
2. 6 GB RAM and 4323 mAh of the 14 Pro Max: GSMArena/NanoReview, not Apple Support.
3. A57 9,499 MXN: widget Xataka, not lista Samsung.
4. No DXOMARK Android scores.
5. State the top 10 is the research intersection of roundups + MX retail, not an official ranking.
