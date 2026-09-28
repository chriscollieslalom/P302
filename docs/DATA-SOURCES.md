# Data Sources

## Implemented sources

### Statistics Canada

The application uses public Statistics Canada Web Data Service (WDS) methods to retrieve metadata and selected time series:

- [Consumer Price Index, monthly, not seasonally adjusted](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401), table 18-10-0004-01
- [Population estimates, quarterly](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1710000901), table 17-10-0009-01
- [Employee wages by industry, monthly, unadjusted for seasonality](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410006301), table 14-10-0063-01
- [CMHC housing starts, under construction and completions, all areas, quarterly](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3410013501), table 34-10-0135-01

The housing table is produced by CMHC and distributed through Statistics Canada. The current story uses housing starts, not completions; the selected completion aggregate returned unavailable observations.

### WDS API

The refresh script uses the official [WDS User Guide](https://www.statcan.gc.ca/en/developers/wds/user-guide) methods `getCubeMetadata` and `getDataFromCubePidCoordAndLatestNPeriods`. It resolves dimension-member coordinates from table metadata, requests only the selected series, rejects failed responses and missing required comparison periods, and writes a local JSON snapshot.

## Refresh and runtime behavior

Run `npm run data:update` while online to refresh `src/data/affordability-story-live.json`. The script records retrieval time, table titles, release/reference periods, coordinates, vector IDs, and series date ranges. It writes the output only after all required observations validate, so a failed refresh does not replace the last good snapshot.

The browser reads the stored JSON and makes no external data requests. The official snapshot is the default edition. The preserved fictional dataset is selectable in the header as **Prototype** for comparison or rollback.

## Interpretation and data quality

- Reference periods are figure-specific; do not treat the snapshot date as the observation date.
- CPI and wage series are not seasonally adjusted; comparisons use the same month.
- Population is a stock, housing starts are a construction flow, and neither is a direct measure of housing adequacy.
- Average hourly wages are composition-sensitive and not representative of every worker or household.
- Never replace missing, suppressed, or unavailable values with zero.
- Update this documentation and `DATA-DICTIONARY.md` whenever selected tables, dimensions, or transformations change.