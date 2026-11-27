---
title: TerraIQ
seo_title: "TerraIQ: a long-term memory for Northern Territory weather stations"
dek: "A Territory-wide weather memory built from 44 BOM stations, holding what the public feed drops after 72 hours. It collects and checks itself on a schedule, with no server to run."
order: 5
code: NT·05
pill: Live
live: true
built_with: [Python, SQLite, GitHub Actions, BOM observations]
links:
  - { label: "Open TerraIQ", href: "https://terraiq-nt.vercel.app/" }
# Facts: the TerraIQ collector README; 44 stations from the live site; the
# fire-score test, fuel-age result and incident-feed decision from Harsh's
# LinkedIn project write-up (checked 26 Nov 2026).
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

## From archive to a question worth asking

The archive now holds more than 40,000 observations. The turning point was changing the question from "what's the temperature?" to "what should someone know right now?" TerraIQ combines heat, dryness and wind into a composite fire-weather score that isn't published anywhere else, and lays it over roughly 10,000 satellite fire detections from NAFI, the fire service run by Charles Darwin University.

## Does the fire score mean anything?

It was tested against 6,575 days of NAFI fire records around Lajamanu.

- Across the whole record it looked useful, but most of that was the calendar. **Compared only with days in the same month, it fell to 0.52 to 0.56**, where 0.50 is a coin toss, and it was weakest in the dry-season months that hold most fires.
- **Fuel age did predict fire.** In the months a patch burned, its fuel was 15.3 months older on average, in 105 of 107 patches.

So the score is defensible for ranking wet-season days and not beyond that, and the site says so.

## What it chose not to do

The NT's official bushfire incident feed carries one line: "Please do not use, scrape or re-publish this file." The integration was already built. It was switched off, and the agency was asked for permission instead.

## Why keep it

Three days of history can answer "what is happening now", but not "is this unusual for this station in this month", which is the question fire, rainfall and anomaly work actually needs. Keeping every observation turns a live feed into a record that can answer it.

The data is Commonwealth of Australia copyright, so anything derived from it is checked against the Bureau's terms before it is published.
