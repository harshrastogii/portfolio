---
title: Underlink
seo_title: "Underlink: the single radio relays remote NT mobile service depends on"
dek: "A coverage map shows a signal, not what it depends on. 18 of 23 places on a radio chain rely on at least one relay with no other licensed path."
order: 3
pill: Live
live: true
context: "CDU IT Code Fair 2026 · Team of two"
built_with: [Python, NetworkX, ACMA licence register, Static web app]
links:
  - { label: "Open Underlink", href: "https://underlink-nt.vercel.app/" }
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/underlink-nt" }
cover: { src: "/assets/underlink-cover.webp", compact: "/assets/underlink-4x3-cover.webp", alt: "Underlink's map of radio relay chains to remote Northern Territory communities" }
# Figures: underlink-nt README, "What the numbers say" (outputs/public/numbers.json).
---

## The question

A coverage map answers one question: is there signal? It doesn't say what that signal depends on.

Many remote Northern Territory towers reach the wider network over a chain of licensed radio relays, up to six links long. If one relay in the chain fails and there is no other path, the community loses mobile service even when its own tower is fine. Underlink, built for the CDU IT Code Fair 2026 Data Innovation Challenge, finds those relays from public data.

## How it works

1. **Build the graph.** Every Telstra point-to-point licence in the ACMA radio register is an edge between two sites. A site within 10 km of a fibre town counts as fibre-connected.
2. **Find each place's site.** The nearest licensed radio site within 10 km stands in for the tower serving the place.
3. **Find single-path relays.** Every fibre-connected site is joined to one source, and the dominator tree is computed from it. A relay that dominates a place's site lies on every path from that site to fibre.

Four other measures sit beside the chain analysis and are never merged into one score: cyclone replays, published backup power, repair windows by month, and what still works nearby.

## What it found

Across the 116 larger places in the NT Government's remote communities list:

- Telstra's licensed radio links in the NT form a graph of 358 sites and 313 links in 51 separate pieces. Most of it is trees, and in a tree every relay is a single point of failure for everything beyond it.
- **18 of the 23 places that reach fibre over a radio chain depend on at least one single-path relay.** 12 depend on three or more. About 7,100 people live in those 18 places.
- 16 of those 18 sit inside Telstra's predicted 4G footprint, which is why a coverage map looks reassuring.
- Replaying five past cyclones would have cut 22 paths to fibre. In 4 of those the storm never came within 100 km of the place or its tower; a relay upstream was in its path.
- The median time to restore the slowest element on a chain is 0.9 days in July and 30.8 days in January, when wet-season access closes roads.

Across the 9 sensitivity runs on the distance assumptions, the share of radio-chain places with a single-path relay stays between 78% and 84%.

## Privacy

Underlink studies relays and paths, never people. The public web app shows counts for two land council groups only, suppresses people counts under 10, and uses a made-up network for its "break a link" demo. Relay locations and per-place chains stay in a restricted tier that is never published, and tests check that no public file leaks them.

## Limits

- Only licensed radio is visible. Fibre routes, satellite backhaul and unlicensed links are not, so a relay called single-path may have a bypass.
- The nearest site may not be the serving site; an ACCC cross-check confirms a Telstra mobile site at the end of 16 of the 18 flagged chains.
- Replays show exposure, not events, and repair days are assumptions shown as a breakdown, not a prediction.
- No community has reviewed any output.
