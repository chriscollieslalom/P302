# Data Dictionary

Define every measure and the claim it supports before implementation. Exact source tables, series identifiers, periods, units, and transformations must be validated against the provider's documentation before live data is used.

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

### Housing starts

- Table: [34-10-0135-01](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3410013501), *Canada Mortgage and Housing Corporation, housing starts, under construction and completions, all areas, quarterly*.
- Selected dimensions: Housing starts; total units; unadjusted; Canada.
- Unit: Housing units started.
- Frequency: Quarterly; summed into complete calendar-year totals for the story comparison.
- Interpretation: Starts are units entering construction, not completions, occupied homes, or a direct measure of available housing. The chapter compares indexed population stock with indexed annual starts and explicitly notes they are different measures.

### Derived comparisons

- National price/pay chart: all-items CPI and average hourly wages; same-month annual samples from August 2016 through August 2026, both indexed to August 2016 = 100.
- Essential prices chart: all-items, food, and shelter CPI; rebased to August 2016 = 100.
- People/building-activity chart: July 1 population estimates and calendar-year housing starts, 2016 and 2025 comparison, each indexed to 2016 = 100.
- Provincial chart: shelter CPI and average hourly wages in ten provinces, rebased to August 2016 = 100.
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