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

## Candidate story measures

### Consumer prices

- Metric ID: `consumer-prices`
- Intended use: Establish how the overall price level and selected essentials changed.
- Candidate source: Statistics Canada Consumer Price Index tables.
- Geography: Canada; selected provinces only where definitions and periods are comparable.
- Unit and frequency: To be validated for each selected series.
- Interpretation: A change in the price index is not the same as the inflation rate. Explain the base period and comparison window.
- Source series and transformation: To be validated before use.

### Shelter and food prices

- Metric IDs: `shelter-prices`, `food-prices`
- Intended use: Show how essential price categories contribute context to the household affordability story.
- Candidate source: Statistics Canada CPI component tables.
- Geography, unit, frequency, seasonal adjustment, and exact components: To be validated.
- Interpretation: Do not imply that a national category change describes every household's expenses.

### Population growth

- Metric ID: `population-growth`
- Intended use: Provide demographic context for the housing-supply comparison.
- Candidate source: Statistics Canada population estimates.
- Geography: Canada and provinces/territories where comparable.
- Unit, frequency, reference period, and whether to use level or percentage change: To be validated.
- Interpretation: Population change represents a broad total; it is not a direct measure of housing demand or household formation.

### Housing supply

- Metric ID: `housing-supply`
- Intended use: Compare a defined measure of new housing supply with population change.
- Candidate source: CMHC housing starts/completions data or a validated Statistics Canada dataset.
- Geography: Canada and provinces/territories only where definitions and coverage align.
- Unit, frequency, seasonal adjustment, and selected supply measure: To be validated.
- Interpretation: Starts, completions, and housing stock are different measures. Do not treat them as interchangeable or equate starts with available homes.

### Wages and purchasing power

- Metric IDs: `wage-growth`, `real-wage-growth`
- Intended use: Compare nominal earnings growth with consumer price changes to discuss purchasing power.
- Candidate source: Statistics Canada earnings or wage series and a compatible CPI series.
- Geography, population covered, unit, frequency, and seasonal adjustment: To be validated.
- Transformation: If real wage growth is calculated, document the exact formula, period alignment, and limitations. Do not mix unaligned wage and CPI periods.

### Provincial comparison

- Metric ID: `provincial-affordability-context`
- Intended use: Show how selected population, housing, price, and wage measures vary by province.
- Source and measure: To be selected from the definitions above.
- Requirement: Use a consistent time window, geography, and definition; disclose gaps and differences in release timing.
- Interpretation: Provincial averages do not represent every community or household.

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