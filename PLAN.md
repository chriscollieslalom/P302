# The Affordability Gap: Implementation Plan

## Project type

Protogen P302 interactive data story.

## Product summary

The Affordability Gap is a responsive, chapter-based data story exploring how housing, population growth, inflation, wages, and regional differences interact to shape affordability pressures in Canada.

The experience should make a clear, evidence-led argument without reducing a complex issue to a single cause or a wall of dashboard metrics.

## Core question

Why do affordability pressures feel different today than they did ten years ago?

## Audience

Canadian citizens, journalists, policy analysts, researchers, and public-sector leaders.

## Story goal

Help readers understand how population growth, housing supply, inflation, and wage growth connect, how these pressures vary by province, and which measures help explain what happens next.

## Narrative structure

1. **Canada feels more expensive.** Establish the lived experience and show how the cost of a representative basket or household essentials changed over time.
2. **People and homebuilding move at different speeds.** Compare population estimates with housing starts, explaining that one is a population stock and the other a construction flow. Do not equate starts with completed homes.
3. **Inflation added pressure.** Show how broad price changes, essential categories, and wage growth affect purchasing power; distinguish price levels from inflation rates.
4. **Canada is not one story.** Compare provincial experiences using consistent measures and periods, and make variation visible without implying every household experiences the provincial average.
5. **What Canadians should watch next.** Bring the evidence together and identify indicators that can help readers follow affordability pressures over time.

The sequence builds one argument. Each chapter should have a headline, a short explanatory passage, a focused visual, source context, and a clear transition to the next question.

## Product principles

- Narrative understanding over data volume
- Multiple contributing forces over single-cause explanations
- Evidence and caveats over artificial precision
- Clear definitions and comparable time periods
- Local snapshots before browser-side data integrations
- Accessibility and mobile reading from the beginning
- One complete story before feature expansion
- No dependency or abstraction without a demonstrated need

## Primary experience

The reader enters at the opening chapter, follows the story through its five chapters, and can use in-page chapter navigation to understand progress and revisit evidence. Charts and annotations support the prose rather than compete with it.

Readers can inspect source, geography, unit, frequency, and reference period near each official-data visualization. Fictional prototype values remain visibly identified as illustrative.

## Evidence and data strategy

The first complete version uses a locally stored official snapshot from Statistics Canada tables, including CMHC housing data distributed through Statistics Canada. The previous fictional dataset remains available as a separate prototype edition for comparison and rollback. Browser components read local JSON only; `npm run data:update` refreshes the official snapshot while online.

Before a measure is used, document its definition, source series or table, geography, unit, frequency, seasonal-adjustment status where relevant, reference period, comparison method, and interpretation. The updater records table, vector, coordinate, and period metadata. Keep missing and suppressed observations distinct from zero. Do not invent values or imply unsupported causation.

## Initial story measures

The first sourced edition uses:

- Monthly, not seasonally adjusted CPI for all items, food, and shelter
- Monthly average hourly wage rates for all industries, both full- and part-time employees, all genders, age 15+
- Quarterly population estimates
- Quarterly, unadjusted total housing starts, summed by calendar year for the population/building-activity comparison
- Provincial shelter CPI and average hourly wage series for regional context

Exact table IDs, dimensions, transformations, and limitations are documented in `docs/DATA-DICTIONARY.md`.

## Technical stack

Retain the existing Vue 3, Vite, TypeScript, Vuetify, Chart.js, and vue-chartjs stack where it supports the story. Use the existing font setup unless the implementation demonstrates a clear need to change it. Do not add routing, state libraries, test frameworks, or other dependencies without a concrete requirement.

The story is initially a single-page application. Native anchors and in-page navigation are sufficient unless the experience later requires separate routes.

## Application architecture

Vue presentation layer → story data and typed content model → local official/prototype snapshots → explicit refresh script.

Keep source and transformation concerns out of presentation components. Normalize data before it reaches visual components, and preserve metadata needed for source notes and caveats.

Only create files with a concrete responsibility. Do not retain dashboard-specific services, filters, thresholds, or components when they are no longer used by the story.

## Data and interpretation requirements

- Label all illustrative values as prototype data.
- Identify official data as a locally cached snapshot, not a live browser feed.
- Show the observation period separately from publication or retrieval dates.
- Preserve units, geography, frequency, and source metadata.
- Keep price level, inflation rate, nominal wage growth, and real wage growth conceptually distinct.
- Do not describe an average hourly wage series as a real wage or the earnings path of a fixed worker.
- Do not equate housing starts with completions, occupied homes, or housing adequacy.
- Compare measures only when their periods and definitions are compatible.
- State when a comparison is descriptive and does not establish causation.
- Treat missing, suppressed, unavailable, and stale values explicitly.
- Provide a concise text summary for each important visualization.

## Visual direction

Use a data-journalism visual language: editorial headlines, readable long-form text, restrained but varied colour, annotations tied to data, and graphics with a clear explanatory purpose. Minimize KPI cards and avoid an operational dashboard layout.

Motion should support chapter progression or reveal relationships, respect reduced-motion preferences, and never be required to understand the story. See `docs/VISUAL-DIRECTION.md`.

## Accessibility and responsive behaviour

- Use semantic chapter headings and landmarks.
- Make chapter navigation and interactive graphics keyboard accessible.
- Provide text alternatives or nearby summaries for charts.
- Preserve readable line lengths and contrast.
- Support narrow screens without horizontal page scrolling.
- Respect `prefers-reduced-motion`.
- Keep source notes legible and close to the evidence they qualify.

## Completion criteria

- The five-chapter story is navigable and readable on mobile and desktop.
- The official snapshot refreshes from documented public tables and builds locally without runtime data requests.
- The fictional baseline remains one action away for comparison and rollback.
- The narrative communicates the connection among housing, population growth, inflation, and wages without asserting a single cause.
- Regional differences are shown using comparable, explained measures.
- Every displayed measure has visible source context and a reference period.
- Prototype data is unmistakable and no illustrative number appears to be a live official statistic.
- Missing or unavailable evidence does not become zero or disappear silently.
- The production build completes successfully.