---
title: Avian Observatory
seo_title: "Avian Observatory: identifying Northern Territory birds from audio"
dek: "Pointed at Territory audio, BirdNET confidently answers Bicknell's Thrush, a bird of the north-eastern US. A model for 449 local species is right 80.6% of the time on 537 recordings from 2026, against 65.7% for BirdNET."
order: 7
code: NT·07
pill: Research
context: "PRT840 IT thesis · Master of Data Science"
built_with: [Python, Perch 2.0, FastAPI, Next.js, PostgreSQL]
links:
  - { label: "Open Avian Observatory", href: "https://avianobservatory.vercel.app/" }
# 80.6% (95% range 77.1 to 83.8%) is the live 449-species model's single
# pre-registered test on 537 clean recordings uploaded in 2026
# (deploy/live_model/space/README.md); BirdNET got 65.7% on the same species
# list. Not the 92.7% as a result (segment-level, leaked); it appears below
# only as the leakage lesson. No field-audio claim until verified.
# Online uploads: commit 6d2967e. Behaviour findings: commit 4ea4b1a.
---

## The question

BirdNET is the global standard for identifying birds from sound, but its training leans heavily on the Northern Hemisphere. Pointed at Northern Territory audio, it confidently names birds that have never been here: Bicknell's Thrush, a bird of the north-eastern United States, or a Diamond Dove heard as a New Zealand Bellbird.

Avian Observatory began as a master's thesis and asks two things: can a model built for the Territory do better, and once birds are identified, what can the recordings tell us about when and where they call?

## The model

The live model pairs Google's Perch 2.0 sound embeddings, unchanged, with the project's own 5 MB classifier for **449 Territory species**. The classifier refuses to run unless its files match the version that was tested.

It was scored once, in a pre-registered test, on 537 clean recordings uploaded in 2026, which no model could have heard during training:

| Model | Right first time |
|---|---|
| **Avian Observatory (449 species)** | **80.6%** (95% range 77.1 to 83.8%) |
| BirdNET, on the same species list | 65.7% |

Anyone can now upload a recording on the public site and get an answer from the same model. The online version was checked against the scored run: all 537 answers identical.

## The leakage lesson

An earlier model scored 92.7%, and it was wrong to believe it. It had been evaluated on short segments cut from recordings that also supplied training segments, so it was partly recognising recordings it had already heard. Split properly by recording, the same approach scored 66.6%. Every evaluation since splits at the recording level, and the 92.7% is never quoted as a result.

## What the recordings say

23,386 Australian recordings of the same 449 species, each converted to local sunrise time, become a record of behaviour:

- From call times alone, **10 of 11 known night birds** come out as nocturnal without being told which they are.
- Helmeted Friarbird's dawn result holds (1.75 times, p = 0.002).
- An apparent link between Barking Owl calls and the moon disappears once repeat visits by the same recordist are collapsed (p goes from 0.014 to 0.137). It was a sampling effect, not biology.
- Apparent weather associations fall from 207 to 18 as month, latitude and place are held fixed; most of what remains is range.

## Limits

- The model has been tested on clean uploaded recordings, not on noisy field audio from unattended recorders.
- The behaviour findings come from when people record, which is not the same as when birds call; the corrections above exist for that reason.
