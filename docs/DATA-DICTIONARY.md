# Data Dictionary

Define every measure and the claim it supports before implementation. Exact source tables, series identifiers, periods, units, and transformations must be validated against provider documentation and preserved in the local snapshot.

## Required fields

For every measure, record:

- Metric ID and display name
- Definition and intended story claim
- Source organization, dataset, table, series or vector identifier, and URL
- Geography and population represented
- Unit, scalar factor, and display format
- Frequency and seasonal-adjustment status where applicable
- Reference-period meaning and publication/update timing
- Comparison method and any transformation
- Known limitations, missing-value treatment, and prototype/live status

Use `To be validated` for unresolved details. Do not infer exact identifiers or frequencies from a broad dataset description.

## Implemented source measures

### Consumer Price Index

- Table: [18-10-0004-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401), *Consumer Price Index, monthly, not seasonally adjusted*.
- Geography: Canada for all-items, food, and shelter; all ten provinces for the shelter comparison.
- Unit: CPI index points, originally on the table's published index base.
- Frequency: Monthly; not seasonally adjusted.
- Transformation: For story charts, each series is rebased to 100 in August 2016. The charted change is cumulative movement in the index, not an inflation rate and not an amount a household paid.
- Current snapshot period: August 2016 to August 2026.
- Limitations: CPI is an average price measure with a defined basket. It does not describe every household's spending or housing costs.

### Average hourly wage rate

- Table: [14-10-0063-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410006301), *Employee wages by industry, monthly, unadjusted for seasonality*.
- Selected dimensions: Average hourly wage rate; both full- and part-time employees; total employees, all industries; total gender; age 15 years and over.
- Geography: Canada and all ten provinces.
- Unit: Canadian dollars per hour.
- Frequency: Monthly; unadjusted for seasonality.
- Transformation: Rebased to 100 in the same month as the CPI series for index comparisons. Raw hourly wage values are not presented as real wages.
- Limitations: A change in the average can reflect workforce composition as well as individual wage changes. It is not the wage path of a fixed worker or a measure of household income.

### Population estimates

- Table: [17-10-0009-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1710000901), *Population estimates, quarterly*.
- Geography: Canada.
- Unit: Persons.
- Frequency: Quarterly; the chapter comparison uses July 1 estimates for 2016 and 2025.
- Interpretation: Population is a stock estimate. Population change is not identical to household formation or housing demand.

### New housing price index

- Table: [18-10-0205-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810020501), *New housing price index, monthly*.
- Selected dimension: Total (house and land); Canada.
- Unit: Index points.
- Frequency: Monthly; December observations are used for annual comparisons.
- Transformation: Rebased to December 2016 = 100 before comparison with income growth.
- Limitation: This tracks new residential houses, not the full resale market or the price of every home available to households.

### Household disposable income per household

- Table: [36-10-0587-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3610058701), *Distributions of household economic accounts, income, consumption and saving, by characteristic, annual*.
- Selected dimensions: Value per household; all households; household disposable income; Canada.
- Unit: Canadian dollars per household.
- Frequency: Annual; current source series through 2025.
- Limitation: This is a national average across households, not the income of a typical homebuyer, renter, or fixed household.

### Shelter-cost-to-income burden by tenure

- Table: [98-10-0252-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=9810025201), *Shelter-cost-to-income ratio by tenure: Canada, provinces and territories, census metropolitan areas and census agglomerations*.
- Reference period: 2021 Census.
- Geography: Canada and provinces; the source also contains CMAs and CAs.
- Measure: Number of private households spending 30% or more of household income on shelter, divided by all private households of the same tenure and geography.
- Tenure: Owner and renter households are calculated separately.
- Interpretation: This is a direct household-cost share, unlike the price-growth indexes above. The 30% threshold is a common indicator, not a complete or universal definition of affordability.
- Limitation: This is a 2021 cross-section, not a current or annual trend.

### Housing starts

- Table: [34-10-0135-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3410013501), *Canada Mortgage and Housing Corporation, housing starts, under construction and completions, all areas, quarterly*.
- Selected dimensions: Housing starts; total units; unadjusted; Canada.
- Unit: Housing units started.
- Frequency: Quarterly; summed into complete calendar-year totals for the story comparison.
- Interpretation: Starts are units entering construction, not completions, occupied homes, or a direct measure of available housing. The chapter compares indexed population stock with indexed annual starts and explicitly notes they are different measures.

### Derived comparisons

- Income-relative chart: December shelter CPI and new-housing price index compared with annual household disposable income per household, rebased to 2016 = 100. The plotted ratio index is 100 when price and income growth match; values above 100 mean the selected price index grew faster since the baseline. This is not a direct price-to-income level or shelter-cost share.
- National price/pay comparison: all-items CPI and average hourly wages; same-month annual samples from August 2016 through August 2026, both indexed to August 2016 = 100. Average hourly wages are not household disposable income.
- Essential prices chart: all-items, food, and shelter CPI; rebased to August 2016 = 100.
- People/building-activity chart: July 1 population estimates and calendar-year housing starts, 2016 and 2025 comparison, each indexed to 2016 = 100. Also reports annual starts per 1,000 residents and compares 2025 starts with a simple scenario in which starts only grew at the population rate. This is not an estimate of homes needed.
- Provincial chart: shelter CPI and average hourly wages in ten provinces, rebased to August 2016 = 100.
- Regional burden chart: 2021 Census share of owner and renter households spending at least 30% of income on shelter, by Canada/province.
- No derived chart establishes causation or measures affordability for an individual household.

The refresh script records exact WDS coordinates, vector IDs, and observed date ranges in `src/data/affordability-story-live.json`.

## Missing and revised values

- Preserve missing, suppressed, unavailable, and not-yet-published values as distinct states when the source permits.
- Never substitute zero or silently carry forward the previous value.
- Record revisions and the retrieval date separately from the reference period.
- Explain exclusions or breaks in series that affect comparisons.

## Presentation rules

- Keep raw numeric values separate from formatted labels.
- Show the unit and reference period near the visualization.
- Identify prototype data wherever it appears; do not label illustrative values as current facts.
- Include source attribution and a direct source link when available.
- Add a concise accessible text summary for each important chart.