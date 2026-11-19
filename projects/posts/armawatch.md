---
title: ArmaWatch
seo_title: "ArmaWatch: a modern, mobile-friendly map of Australia's weapons industry"
dek: "A mobile-friendly rebuild of Wage Peace's Australian weapons-industry map: 127 sites, clustered mapping, filters, live summaries and CSV export for research and journalism."
order: 13
code: CIV·13
pill: Delivery
built_with: [React, TypeScript, MapLibre GL, Tailwind CSS, Vite]
links:
  - { label: "Open ArmaWatch", href: "https://armawatch.vercel.app/" }
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/ArmaWatch" }
# Facts: ArmaWatch README. Prepared as a handover for Wage Peace; do not claim
# it has been adopted on their site.
---

## The brief

Wage Peace publishes a map of the companies and facilities that make up Australia's weapons industry, used by researchers, journalists and campaigners. ArmaWatch rebuilds it as a fast, modern, mobile-friendly map application, keeping every piece of the original data and everything the original could do.

## What changed

- **A modern map.** MapLibre GL with clustering, smooth fly-to and colour-coded companies. No Google Maps API key is needed.
- **Search and filters** by facility type and program, with a live counter.
- **A company panel** for each site: facility, address, details, source, a link to Street View, sharing, and a "take action" link back to Wage Peace.
- **Live summaries**: sites by program, and header totals for sites, prime contractors and states.
- **My location**: how many weapons sites are within 25 km of the viewer.
- **Download data**: the currently filtered companies as a CSV, for researchers and journalists.

## Built to hand over

The application was prepared as a handover for Wage Peace, so it was designed for someone else to maintain:

- **The data is one file.** All 127 sites live in a single GeoJSON file with plain fields: name, program, facility, address, coordinates, details and source. Adding or removing a company means editing that file, with no code changes.
- **It drops into the existing page.** The new map mounts into the same container the old one used, so the page's address and everything around it stay the same. Publishing means uploading the built files.
- **The full source is included**, in React and TypeScript, for future changes.

## Data

All locations come from Wage Peace's original map. Basemap © CARTO and © OpenStreetMap contributors.
