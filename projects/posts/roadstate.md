---
title: RoadState
seo_title: "RoadState: Northern Territory road access, not congestion"
dek: "The Territory's real road problem is seasonal access, not congestion: 78% of traffic sits in Darwin, and 66% of the year's closures begin in the wet."
order: 9
code: NT·09
pill: Live
live: true
built_with: [Next.js, Visx, Python, NT Annual Traffic Report]
links:
  - { label: "Open RoadState", href: "https://roadstate.harshrastogii.com" }
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/RoadState" }
# Facts: the live RoadState report and its README. The 78% and 66% figures
# are the report's own headline numbers (NT Annual Traffic Report 2023).
---

## The question

Talk about roads usually means congestion. Is that the Territory's problem?

RoadState is an interactive report built from the NT Government's *Annual Traffic Report 2023*. Its answer is no: outside Darwin the Territory barely has a traffic problem. What disrupts travel is the wet season, which cuts roads on a predictable November to March cycle.

## What it found

- **78% of the Territory's counted traffic sits in Darwin.** Its busiest road, Bagot Road, carries 33,398 vehicles a day. Everywhere else, volumes are low.
- **66% of the year's 499 road closures and restrictions began in the wet season.** The disruption isn't random; it arrives on a schedule.

So the network outside Darwin isn't busy, but it is seasonally fragile, and because closures cluster on the same roads each wet, access risk can be forecast.

## The same finding, read five ways

The report translates one result for the people who act on it:

- **Travellers** driving the Territory between November and March can time trips or choose routes around roads that historically flood and stay cut.
- **Remote residents** on long-affected access roads can stock essentials and medical supplies before the wet closes them in.
- **Councils and road authorities** can put drainage and sealing budget on the worst roads before December, not after.
- **Emergency services** can stage crews by season, where cut-offs and busy corridors concentrate rescues and crash risk.
- **Freight and tourism operators** can route supply runs and tours around predictable closure windows.

## How it's built

A Python pipeline cleans the report's tables into one JSON file. The site is a static Next.js report with Visx charts, with no backend, and every chart carries a plain-English reading underneath.

RoadState is an independent civic-data project, not affiliated with or endorsed by the NT Government. The data is published under CC BY.
