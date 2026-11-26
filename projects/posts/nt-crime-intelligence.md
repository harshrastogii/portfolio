---
title: NT Crime Intelligence
seo_title: "NT Crime Intelligence: Northern Territory crime per capita, 2008–2026"
dek: "Switching from raw counts to per capita completely reorders which communities are most affected. How you frame the data decides who gets served by it."
order: 10
code: NT·10
pill: Live
live: true
built_with: [Python, Plotly Dash, GitHub Actions, Hugging Face Spaces]
links:
  - { label: "Open the dashboard", href: "https://harshrastogii-nt-crime-dashboard.hf.space/" }
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/nt-crime-dashboard" }
# Facts: nt-crime-dashboard README, "The headline finding" and "The dataset".
---

## The question

Where in the Northern Territory does crime hit hardest? The answer depends on how you count.

## What it found

Ranked by **raw offence counts**, Darwin looks like the Territory's crime centre. It has the largest population, so it has the most offences. Ranked **per 1,000 residents**, the picture inverts: **Tennant Creek's rate is roughly 5 times Darwin's across 2008 to 2026, and about 7 times since December 2023.**

Resourcing decisions made on raw volume alone systematically under-serve smaller remote communities. So the dashboard opens in per-capita mode, and a plain-English summary says so up front.

## The dashboard

It began as a Power BI report that answered the data's questions rather than a decision-maker's. The rebuild in Python and Plotly Dash adds:

- a ranked "where crime hits hardest" chart beside a map of crime intensity;
- year-on-year change by region, in the format the NT Government uses to report progress;
- alcohol and domestic-violence involvement by location, the two factors tied to current alcohol-supply policy;
- click any place to focus every chart on it.

## A clean public dataset

Behind the dashboard is a dataset published under CC BY 4.0: **every month of recorded crime in the Territory from January 2008 to August 2026**, 224 consecutive months, 56,848 rows, 572,532 recorded offences and 27 locations.

Putting it together was harder than it looks:

- Every monthly file on the government portal is cumulative, so stacking downloads counts old months many times over.
- Filenames don't sort by date, and the file named "November 2023" held no November 2023 data. Files are chosen by reading their contents, never their names.
- NT Police changed recording systems between November and December 2023, and the government advises against comparing across that change. Every row carries a tag for its era.

Two more problems surfaced in the data itself:

- **Around twenty remote localities were hidden under a single "NT Balance" label**, which are exactly the communities policy attention is focused on. Restructuring brought East Arnhem, the Tiwi Islands and West Arnhem back into view.
- **Two years held only partial data.** Plotted as full years, they produced a rise and fall that never happened. Correcting it changed the trend story entirely.

A GitHub Action checks the portal daily. If a new month appears, it rebuilds and validates the dataset, and publishes only if every check passes. If a month disappears, totals move too far or an unknown category appears, it stops and publishes nothing.

## Limits

- Per-capita rates are indicative. Population figures are the 2021 Census, applied only from December 2023 onward and only for locations with a defensible match. Historical rows are left blank rather than divided by the wrong population.
- Map points for the "NT Balance" areas are approximate.
