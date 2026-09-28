# The Affordability Gap

The Affordability Gap is an independent Protogen P302 interactive data story about how housing, population growth, inflation, wages, and regional differences interact to shape affordability pressures in Canada.

The experience unfolds in five chapters. It is a narrative data story, not a dashboard, and uses clearly identified local prototype data before any live sources are connected.

This educational prototype is not an official Government of Canada product and does not provide policy advice.

## Technology

- Vue 3
- Vite
- TypeScript
- Vuetify 3
- Chart.js and vue-chartjs
- Inter

## Local development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Project documentation

- `BRIEF.md`: Audience, story goal, and experience requirements
- `PLAN.md`: Narrative, data, technical, and delivery plan
- `docs/STORY-OUTLINE.md`: Chapter sequence and intended argument
- `docs/VISUAL-DIRECTION.md`: Editorial visual principles
- `docs/DATA-DICTIONARY.md`: Measure definitions and validation requirements
- `docs/DATA-SOURCES.md`: Candidate providers and integration guidance

## Data editions

The app opens with a locally stored snapshot of official Statistics Canada data, including CMHC housing-start data distributed through Statistics Canada. The **Prototype** control in the header switches back to the preserved fictional baseline. Neither edition makes data requests from the browser.

Refresh the official snapshot while online:

```bash
npm run data:update
```

The update script validates table metadata and observations before replacing `src/data/affordability-story-live.json`. The page displays the snapshot retrieval date and each figure's reference period. See `docs/DATA-SOURCES.md` and `docs/DATA-DICTIONARY.md` for definitions and limitations.