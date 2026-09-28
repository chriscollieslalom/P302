# Data Sources

## Approach

Prototype data first. The complete story must work locally before external requests are introduced. Label all illustrative values clearly and never imply they are current official statistics.

Select a source for the specific measure and claim in the story. Verify the dataset and underlying resource, not only a catalogue description. Record the source URL and metadata in `DATA-DICTIONARY.md` before implementation.

## Candidate providers

### Statistics Canada

Potential source for consumer prices and CPI components, population estimates, wages and earnings, and comparable regional statistics. Validate table or vector identifiers, dimensions, geography, units, frequency, adjustment status, revision behaviour, and API response before use.

### Canada Mortgage and Housing Corporation

Potential source for housing starts, completions, and related housing-market measures. Confirm the measure definition, geographic coverage, units, frequency, seasonal-adjustment status, and whether a measure represents starts, completions, or existing stock.

### Bank of Canada

Use only if the narrative needs a monetary or financial context measure. It is not a substitute for household affordability, housing supply, or wage data. Validate the exact series and metadata before integration.

### Government of Canada Open Data

Use the catalogue to discover federal datasets. Inspect the actual resource, format, access method, licence, update cadence, and underlying data provider before relying on it.

## Integration requirements

- Keep network requests out of Vue presentation components.
- Retrieve only observations needed by the story.
- Preserve source, reference period, geography, unit, and retrieval metadata.
- Normalize provider responses before presentation.
- Handle loading, empty, unavailable, suppressed, revised, and error cases explicitly.
- Never replace missing observations with zero.
- Use local fallback only when it is clearly identified as prototype data.
- Avoid unnecessary repeat requests and do not expose credentials in browser code.

## Source validation gate

Before connecting a source, document the exact series or resource and verify its definition, dimensions, unit, geography, frequency, period, adjustment status, missing-value behaviour, terms, and transformation. Review sample observations manually and record the mapping in `DATA-DICTIONARY.md`.

Do not add a live integration until the local story works and its narrative claims are supported by defined measures.