---
title: Gradaroo
seo_title: "Gradaroo: an AI career platform for Australian students and graduates"
dek: "An AI career platform for Australian students and graduates: live jobs from job boards and employers' own careers pages, who hires from each of 40 universities, resume and cover-letter tools, local events, and Roo, a voice assistant."
order: 14
code: ML·14
pill: Live
live: true
context: "CDU IT Code Fair 2026"
built_with: [Next.js, TypeScript, Supabase, Google Gemini, Resend, Vercel]
links:
  - { label: "Open Gradaroo", href: "https://gradaroo.com.au" }
# Facts: gradaroo-next README and its November 2026 commits. Keep figures that
# change daily (job and event counts) off this page.
---

## The problem

Students and graduates in Australia, international students especially, face several hurdles at once. They don't know which employers hire from their university. Their resume isn't in the format Australian employers expect. Every application needs its own cover letter. And the advice they need is spread across a dozen sites.

Gradaroo puts it in one place, free for students, from "where do I start?" to "applied". It began as an entry in the CDU IT Code Fair 2026 and has kept growing.

## What it does

- **Jobs.** Search any role and place in Australia, from job boards and from employers' own careers pages, with each job shown once even when it's listed on several sites. Or pick one of **40 universities** and see the jobs open now at the employers its graduates commonly work for.
- **Roo, the assistant.** Talk or type. Roo searches live jobs, explains any feature and opens the right page.
- **Resume Builder and Converter.** Answer plain questions to build an Australian-format resume from scratch, or convert an existing one. Neither adds anything that isn't true.
- **Cover letters** written for a specific job from the student's own resume, checked to fit one page.
- **What's on**: networking nights, workshops and meetups gathered every morning from sites across Australia.
- **Portals for universities and employers**, showing graduate outcomes and talent insights from anonymous, aggregated data only.

## AI that is checked, not trusted

- **No invented content.** AI output is validated by code, not trusted: invented numbers and placeholders are removed from cover letters, and a page-fit check guarantees one page.
- **Reliability.** Every AI call has a time limit and moves to another model when one is busy or out of quota, so a request finishes before the server would cut it off.
- **Security.** API keys never reach the browser. The voice assistant gets a single-use token locked to its model, and it can only call four declared tools, one of which asks the student's permission first.
- **Privacy.** Resume text for job matching is read in the browser. Employer insights appear only for groups of at least 10 students, rounded to the nearest 5, enforced in the database.

## How it's built

Next.js and TypeScript on Vercel; Supabase for the database, sign-in, two-factor authentication and storage, with row-level security on every table; Google Gemini for AI, with a backup provider; Resend for email. An automated test suite covers the AI checks, Roo's routing and permissions, and provider fallback, with no network needed.
