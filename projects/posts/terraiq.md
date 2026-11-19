---
title: TerraIQ
seo_title: "TerraIQ: a long-term memory for Northern Territory weather stations"
dek: "A Territory-wide weather memory built from 44 BOM stations, holding what the public feed drops after 72 hours. It collects and checks itself on a schedule, with no server to run."
order: 4
code: NT·04
pill: Live
live: true
built_with: [Python, SQLite, GitHub Actions, BOM observations]
links:
  - { label: "Open TerraIQ", href: "https://terraiq-nt.vercel.app/" }
# Facts: the TerraIQ collector README; 44 stations from the live site.
---

## The question

The Bureau of Meteorology publishes observations from the Territory's automatic weather stations every 10 minutes, but its public pages keep only the last 72 hours. Anything older is gone. TerraIQ keeps it, so the Territory has a weather history it can query rather than a three-day window.

## How it works

A collector runs on a schedule on GitHub Actions. There is no server, no Raspberry Pi and no running cost.

1. It fetches each station's feed, about 72 hours of 10-minute observations.
2. It inserts only new rows, keyed on station and time. Duplicates from the overlapping window are discarded, and a missed or late run is backfilled automatically next time, because the 72-hour overlap still holds what it missed.
3. It runs health checks and marks every station healthy, stale or failed. A station is stale when its newest observation is older than its own expected delay.
4. If anything is stale or failed, it posts an alert.

The live site puts all 44 stations on one map.

## Being a good citizen of a public feed

A collector that polls a government feed has to behave, or it gets blocked. TerraIQ follows five rules:

- **Poll slowly.** The 72-hour overlap means a slower cadence loses nothing, and faster polling only looks abusive.
- **Cap concurrency.** A bounded pool of six workers is the rate limit. It replaced a fixed sleep between stations, which was billed as idle time.
- **Rely on the overlap** instead of re-requesting.
- **One collector touches BOM.** Every dashboard reads the database, never the feed.
- **Know what the feed rejects.** A placeholder contact address in the request header gets a 403, which was found and documented rather than guessed at.

## Why keep it

Three days of history can answer "what is happening now", but not "is this unusual for this station in this month", which is the question fire, rainfall and anomaly work actually needs. Keeping every observation turns a live feed into a record that can answer it.

The data is Commonwealth of Australia copyright, so anything derived from it is checked against the Bureau's terms before it is published.
