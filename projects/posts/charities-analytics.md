---
title: Australian Charities Analytics
seo_title: "What predicts a charity's board size? Regression on the ACNC Charity Register"
dek: "Descriptive, predictive and diagnostic analysis of the ACNC Charity Register, from research-question design through to a finished visualisation pipeline."
order: 15
code: DA·15
pill: PRT564
context: "PRT564 · Analysis lead in a team of four"
built_with: [Python, OLS, Ridge and Lasso regression, Jupyter]
links:
  - { label: "Code on GitHub", href: "https://github.com/harshrastogii/PRT564-Group2-CharityAnalysis" }
# Facts: PRT564-Group2-CharityAnalysis README. Group project; Harsh's role was
# Analysis Lead.
---

## The question

Which operational and geographic factors best predict a charity's governance capacity, measured by the number of people on its board? And do Northern Territory charities differ from the national picture?

## The data

- **The ACNC Charity Register**: 65,114 charities and 69 variables, including purposes, beneficiaries, where they operate and governance structure.
- **The 2023 Annual Information Statement**: 53,323 records with finances and staffing.

The two were joined on ABN with a left join, deliberately. Smaller and newer charities are more likely to miss their annual statement, so an inner join would have biased the sample towards large, well-resourced charities.

## The approach

New features were built from the register: how many states a charity operates in, how many purposes and beneficiary groups it declares, its size, and whether it is headquartered in the NT.

Three regression models were run side by side, to triangulate rather than cherry-pick: ordinary least squares, Ridge and Lasso, each with 10-fold cross-validation and statistical tests comparing their errors.

## What it found

- **Size dominates.** Larger charities have larger boards; size is by far the strongest predictor.
- **NT charities have bigger boards**: 5.73 people on average against 5.11 nationally, a statistically significant difference (564 NT charities against 57,283 elsewhere).
- The NT has 867 registered charities, 1.5% of the national sector, and **76% of them serve Aboriginal and Torres Strait Islander communities**.
- OLS and Ridge are indistinguishable; Lasso is significantly worse, and shrinks 18 of 27 features to zero.

## Limits

- **The models explain little** (R² of 0.107). Board size depends on things the public register doesn't record, such as a charity's age, constitution and history.
- A count model (Poisson or negative binomial) would suit a whole-number target better than linear regression; that is flagged as future work.
- Financial variables were joined but left out of the regression, because including them would have dropped about 14,000 charities without annual statements and biased the sample.
- The NT sample is small, which limits NT-specific analysis.

This was a group project for PRT564 Data Analytics and Visualisation; my role was analysis lead.
