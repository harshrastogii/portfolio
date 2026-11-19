---
title: ReachNT
seo_title: "ReachNT: repair triage for remote Northern Territory public housing"
dek: "Remote repairs ranked by need, with neighbouring communities sharing one trip. Across a synthetic year, 9 in 10 urgent remote repairs were fixed within 3 days instead of 62."
order: 1
pill: Live
live: true
context: "CDU IT Code Fair 2026 · Team of two"
built_with: [Python, OR-Tools CP-SAT, H3, scikit-learn, MapLibre GL]
links:
  - { label: "Open ReachNT", href: "https://reachnt.vercel.app/" }
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/reachnt" }
cover: { src: "/assets/reachnt-cover.webp", compact: "/assets/reachnt-4x3-cover.webp", alt: "ReachNT's repair queue and trip map for remote Northern Territory communities" }
# Figures: reachnt README, "Results (one synthetic year, whole NT)" and
# "How good is the AI?" (report Appendix G). All repair requests are synthetic.
---

## The question

How do you help a housing maintenance coordinator get urgent repairs done across remote Northern Territory communities, without "efficiency" quietly pushing remote tenants to the back of the queue?

The cheapest plan is to fix what is cheap to reach. In the Territory that means town jobs first and remote ones last. ReachNT was built for the CDU IT Code Fair 2026 Artificial Intelligence Challenge to show there is a better trade.

## What it does

ReachNT ranks repairs by need alone, then plans the trips:

- **Read the report.** Phrase rules plus a TF-IDF and logistic regression model suggest the fault and its urgency. Anything unsure, conflicting or possibly dangerous goes to a person.
- **Rank by need.** The NT repair category sets the clock. Points are added for harm, health hardware, who lives in the house (someone on dialysis, a baby, a frail elder), crowding, repeat reports and time waited. How the tenant reported, and in how many words, does not change their place.
- **Share trips.** Uber's H3 hexagon grid finds neighbouring communities close enough for one crew to serve on the same run, so the drive or charter is paid once.
- **Plan the week.** OR-Tools CP-SAT chooses trips under crew hours, road closures and airstrips. It proved 99.5% of 26,018 weekly plans optimal, and the median plan takes 8 ms.
- **Explain the wait.** Every week a job waits, the reason is logged, and the tenant's answer is built from that log.

## What it found

One synthetic year across the whole NT:

| Plan | Cost per repair | 9 in 10 urgent remote repairs fixed within | Days households lived with a fault |
|---|---|---|---|
| Cheapest jobs first | $561 | 62 days | 233,100 |
| Most urgent first, one community per trip | $897 | 3 days | 74,600 |
| **ReachNT**: most urgent first, shared trips | **$821** | **3 days** | **61,700** |

Across five random years, ReachNT cut fault-days by 74 to 77% against cheapest-first, for 45 to 49% more per repair. Shared trips saved $67 to $76 per repair in every year.

The language model on its own is only moderate on wording it never saw (ROC-AUC 0.84), and its confidence doesn't match its accuracy, so tenants never see a confidence score. The whole system still catches 99.3% of dangerous reports, because it sends 42% of them to a person.

## The portal

The live portal has coordinator, tradesperson, tenant and housing-officer views. It works offline, saves run sheets as PDFs and syncs when signal returns. It reads the NT Road Report and Bureau of Meteorology observations to prompt about closures, heavy rain and heat for vulnerable households.

## Limits

- Every repair request is synthetic, because no public NT work-order data exists. The communities, house counts, crew hubs, road closures, airstrips and costs are real or sourced.
- No community has reviewed ReachNT. Community-level results are illustrations, not findings about any place.
- Real use would need co-design with tenants, Aboriginal Housing NT and the land councils first.
