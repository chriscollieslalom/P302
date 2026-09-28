<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import prototypeStoryData from './data/affordability-story.json'
import officialStoryData from './data/affordability-story-live.json'

type StoryData = {
  meta: {
    status: string
    lastRefreshedLabel?: string
    monthlyBasePeriodLabel?: string
    latestMonthlyPeriodLabel?: string
    sources?: Array<{ tableId: number; tableNumber: string; url: string }>
  }
  chapters: Array<{ id: string; number: string; navTitle: string }>
  figures: {
    priceVsEarnings: {
      labels: string[]
      costs: number[]
      earnings: number[]
      seriesLabels?: string[]
      summary?: string
      sourceNote?: string
    }
    populationHousing: {
      startYear?: number
      endYear?: number
      series: Array<{ label: string; value: number; colorClass: string }>
      summary?: string
      sourceNote?: string
    }
    essentialCosts: Array<{ label: string; value: number; colorClass: string }>
    regionalComparison: Array<{ province: string; housing: number; earnings: number }>
  }
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const isPrototypeEdition = ref(new URLSearchParams(window.location.search).get('edition') === 'prototype')
const storyData = computed<StoryData>(() =>
  (isPrototypeEdition.value ? prototypeStoryData : officialStoryData) as StoryData,
)
const activeChapter = ref('chapter-1')
let chapterObserver: IntersectionObserver | undefined

const priceVsEarningsData = computed(() => {
  const figure = storyData.value.figures.priceVsEarnings
  const labels = figure.seriesLabels ?? ['Illustrative cost index', 'Illustrative earnings index']

  return {
    labels: figure.labels,
    datasets: [
      {
        label: labels[0],
        data: figure.costs,
        borderColor: '#ed7756',
        backgroundColor: 'rgba(237, 119, 86, 0.12)',
        pointBackgroundColor: '#ed7756',
        borderWidth: 3,
        pointRadius: 3,
        tension: 0.35,
      },
      {
        label: labels[1],
        data: figure.earnings,
        borderColor: '#3d9d87',
        backgroundColor: 'rgba(61, 157, 135, 0.12)',
        pointBackgroundColor: '#3d9d87',
        borderWidth: 3,
        pointRadius: 3,
        tension: 0.35,
      },
    ],
  }
})

const lineOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'bottom',
      align: 'start',
      labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 22, color: '#33413c' },
    },
    tooltip: { enabled: true },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#58645e' } },
    y: { min: 95, max: 150, grid: { color: 'rgba(30, 50, 42, 0.09)' }, ticks: { color: '#58645e' } },
  },
}

function editionHref(prototype: boolean) {
  const url = new URL(window.location.href)
  if (prototype) url.searchParams.set('edition', 'prototype')
  else url.searchParams.delete('edition')
  return `${url.pathname}${url.search}${url.hash}`
}

function sourceForTable(tableId: number) {
  return storyData.value.meta.sources?.find((source) => source.tableId === tableId)
}

function indexBarWidth(value: number) {
  return isPrototypeEdition.value
    ? Math.min(100, value)
    : Math.min(100, Math.max(0, ((value - 90) / 80) * 100))
}

function categoryBarWidth(value: number) {
  return isPrototypeEdition.value
    ? Math.min(100, (value - 90) * 2)
    : Math.min(100, Math.max(0, ((value - 90) / 60) * 100))
}

function regionalBarWidth(value: number) {
  return isPrototypeEdition.value
    ? Math.min(100, value)
    : Math.min(100, Math.max(0, ((value - 90) / 70) * 100))
}

function regionalChartLabel() {
  if (isPrototypeEdition.value) {
    return 'Fictional regional comparison of housing cost and earnings indexes; not official data.'
  }

  return storyData.value.figures.regionalComparison
    .map((region) => `${region.province}: shelter CPI index ${region.housing}, average hourly wage index ${region.earnings}`)
    .join('; ')
}

onMounted(() => {
  chapterObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activeChapter.value = entry.target.id
      }
    },
    { rootMargin: '-24% 0px -66% 0px' },
  )

  document.querySelectorAll<HTMLElement>('[data-story-chapter]').forEach((chapter) => {
    chapterObserver?.observe(chapter)
  })
})

onUnmounted(() => chapterObserver?.disconnect())
</script>

<template>
  <VApp>
    <div class="story-page" id="top">
      <header class="masthead">
        <a class="wordmark" href="#top" aria-label="The Affordability Gap, home">
          <span class="wordmark-symbol" aria-hidden="true">AG</span>
          <span>The Affordability Gap</span>
        </a>
        <div class="masthead-meta">
          <span>Canada / Data story</span>
          <div class="edition-picker" role="group" aria-label="Story data edition">
            <a :href="editionHref(false)" :aria-current="!isPrototypeEdition ? 'page' : undefined">Official snapshot</a>
            <a :href="editionHref(true)" :aria-current="isPrototypeEdition ? 'page' : undefined">Prototype</a>
          </div>
          <span class="masthead-index">P302 <span aria-hidden="true">/</span> 2026</span>
        </div>
      </header>

      <main>
        <section class="hero" aria-labelledby="story-title">
          <div class="hero-inner">
            <div class="hero-copy">
              <p class="overline"><span class="overline-rule"></span> A five-part story about the cost of living</p>
              <h1 id="story-title">The<br />Affordability<br /><span>Gap</span></h1>
              <p class="hero-deck">Why housing, population growth, inflation and wages are connected, and why the pressure is not the same everywhere.</p>
              <a class="start-link" href="#chapter-1">Start the story <span aria-hidden="true">↓</span></a>
            </div>

            <figure class="hero-figure">
              <div class="figure-topline">
                <span>Purchasing power, in perspective</span>
                <span class="figure-number">01 / 05</span>
              </div>
              <div class="hero-chart" role="img" :aria-label="isPrototypeEdition ? 'Illustrative line chart comparing fictional cost and earnings indexes; not official data.' : storyData.figures.priceVsEarnings.summary">
                <Line :data="priceVsEarningsData" :options="lineOptions" />
              </div>
              <figcaption>
                <span class="prototype-dot" :class="{ 'source-dot': !isPrototypeEdition }" aria-hidden="true"></span>
                {{ storyData.figures.priceVsEarnings.sourceNote ?? 'Illustrative series only. Not official observations.' }}
              </figcaption>
              <div v-if="!isPrototypeEdition" class="source-links" aria-label="Chart sources">
                <a :href="sourceForTable(18100004)?.url" target="_blank" rel="noreferrer">CPI table 18-10-0004-01 ↗</a>
                <a :href="sourceForTable(14100063)?.url" target="_blank" rel="noreferrer">Wages table 14-10-0063-01 ↗</a>
              </div>
            </figure>
          </div>
          <div class="hero-footnote">
            <span>THE QUESTION</span>
            <p>When essentials cost more, what forces are changing together?</p>
            <a href="#chapter-1" aria-label="Continue to chapter one">↓</a>
          </div>
        </section>

        <div class="prototype-notice" role="note">
          <span class="notice-mark" aria-hidden="true">i</span>
          <p><strong>{{ isPrototypeEdition ? 'Prototype edition.' : 'Official source snapshot.' }}</strong> {{ storyData.meta.status }} <span v-if="storyData.meta.lastRefreshedLabel">{{ storyData.meta.lastRefreshedLabel }}.</span></p>
          <a href="#method-note">About this prototype</a>
        </div>

        <div class="story-layout">
          <nav class="chapter-nav" aria-label="Story chapters">
            <p class="nav-heading">In this story</p>
            <ol>
              <li v-for="chapter in storyData.chapters" :key="chapter.id">
                <a :href="`#${chapter.id}`" :class="{ active: activeChapter === chapter.id }">
                  <span class="nav-number">{{ chapter.number }}</span>
                  <span>{{ chapter.navTitle }}</span>
                </a>
              </li>
            </ol>
            <div class="nav-progress" aria-hidden="true"><span :style="{ width: `${Number(activeChapter.slice(-1)) * 20}%` }"></span></div>
            <p class="nav-caption">A story in five chapters</p>
          </nav>

          <div class="chapters">
            <article id="chapter-1" class="chapter" data-story-chapter aria-labelledby="chapter-1-title">
              <div class="chapter-heading">
                <p class="chapter-kicker"><span>01</span> / The pressure</p>
                <h2 id="chapter-1-title">Canada feels<br />more expensive.</h2>
                <p class="chapter-lede">A slower rise in prices does not take prices back to where they were. That distinction is easy to miss, and it matters to every household budgeting for essentials.</p>
              </div>
              <div class="chapter-body">
                <p v-if="!isPrototypeEdition" class="data-summary">{{ storyData.figures.priceVsEarnings.summary }}</p>
                <p>Inflation describes how quickly prices change. The price level describes what things cost. When inflation eases, prices may still be rising, just more slowly. The accumulated change stays in the household budget.</p>
                <p>To understand affordability, we need to look beyond a single month or a single rate. The cost of essentials, what people earn, and the place they live all shape the experience.</p>
                <div class="pull-quote"><span aria-hidden="true">“</span><p>A slower climb is still a climb. The starting point has changed.</p></div>
                <p class="chapter-transition"><span>Next</span> One part of the picture is how many people need a place to live, and how quickly homes are added.</p>
              </div>
            </article>

            <article id="chapter-2" class="chapter" data-story-chapter aria-labelledby="chapter-2-title">
              <div class="chapter-heading">
                <p class="chapter-kicker"><span>02</span> / People and homes</p>
                <h2 id="chapter-2-title">People and housing<br />move at different speeds.</h2>
                <p class="chapter-lede">Population and housing supply are connected, but they are not interchangeable counts. Timing, location, household size and the kind of homes being built all matter.</p>
              </div>
              <div class="chapter-body">
                <p>Population is a count of residents; housing starts count units entering construction. The two measures can put demographic change beside building activity, but starts are not finished homes and the comparison does not measure whether supply meets local needs.</p>
                <figure class="mini-chart">
                  <div class="mini-chart-heading">
                    <div><span class="chart-index">FIG. 02</span><h3>{{ isPrototypeEdition ? 'Two measures, one shared baseline' : 'Population and housing starts, indexed' }}</h3></div>
                    <span class="chart-unit">{{ isPrototypeEdition ? 'Illustrative index / 2016 = 100' : `Index / ${storyData.figures.populationHousing.startYear} = 100` }}</span>
                  </div>
                  <div class="index-chart" role="img" :aria-label="isPrototypeEdition ? 'Fictional indexed example comparing population and housing; not official data.' : storyData.figures.populationHousing.summary">
                    <div class="index-axis"><span>90</span><span>110</span><span>130</span><span>150</span><span>170</span></div>
                    <div v-for="series in storyData.figures.populationHousing.series" :key="series.label" class="index-row">
                      <span class="index-label"><i :class="series.colorClass"></i>{{ series.label }}</span>
                      <div class="index-track"><span :class="series.colorClass" :style="{ width: `${indexBarWidth(series.value)}%` }"></span></div>
                      <strong>{{ series.value }}</strong>
                    </div>
                    <div class="index-years"><span>{{ storyData.figures.populationHousing.startYear ?? 2016 }}</span><span>{{ storyData.figures.populationHousing.endYear ?? 2026 }}</span></div>
                  </div>
                  <figcaption><span class="prototype-dot" :class="{ 'source-dot': !isPrototypeEdition }" aria-hidden="true"></span>{{ storyData.figures.populationHousing.sourceNote ?? 'Fictional demonstration values. Compare validated, compatible series before drawing conclusions.' }}</figcaption>
                  <div v-if="!isPrototypeEdition" class="source-links" aria-label="Chart sources">
                    <a :href="sourceForTable(17100009)?.url" target="_blank" rel="noreferrer">Population table 17-10-0009-01 ↗</a>
                    <a :href="sourceForTable(34100135)?.url" target="_blank" rel="noreferrer">Housing table 34-10-0135-01 ↗</a>
                  </div>
                </figure>
                <p v-if="!isPrototypeEdition" class="data-summary">{{ storyData.figures.populationHousing.summary }}</p>
                <p class="chapter-transition"><span>Next</span> Even when earnings rise, the essentials people buy can rise at a different pace.</p>
              </div>
            </article>

            <article id="chapter-3" class="chapter" data-story-chapter aria-labelledby="chapter-3-title">
              <div class="chapter-heading">
                <p class="chapter-kicker"><span>03</span> / Prices and pay</p>
                <h2 id="chapter-3-title">Inflation added<br />another pressure.</h2>
                <p class="chapter-lede">The average price index can hide very different changes in shelter, food and other essentials. Pay growth is another part of the equation, not a guaranteed offset.</p>
              </div>
              <div class="chapter-body">
                <p>Comparing wage growth with price growth can help describe changes in purchasing power. But the comparison only works when the populations, time periods and measures line up. A national average also cannot tell us how costs are distributed across households.</p>
                <figure class="mini-chart">
                  <div class="mini-chart-heading">
                    <div><span class="chart-index">FIG. 03</span><h3>Essential costs do not move in lockstep</h3></div>
                    <span class="chart-unit">Index / {{ storyData.meta.monthlyBasePeriodLabel ?? '2016' }} = 100</span>
                  </div>
                  <div class="category-chart" role="img" :aria-label="isPrototypeEdition ? 'Fictional indexed example comparing all-items, food, and shelter prices.' : `Statistics Canada CPI indexes for all items, food, and shelter; ${storyData.figures.priceVsEarnings.sourceNote}`">
                    <div v-for="item in storyData.figures.essentialCosts" :key="item.label" class="category-row">
                      <span>{{ item.label }}</span>
                      <div class="category-track"><span :class="item.colorClass" :style="{ width: `${categoryBarWidth(item.value)}%` }"></span></div>
                      <strong>{{ item.value }}</strong>
                    </div>
                    <div class="category-axis"><span>90</span><span>110</span><span>130</span><span>150</span></div>
                  </div>
                  <figcaption><span class="prototype-dot" :class="{ 'source-dot': !isPrototypeEdition }" aria-hidden="true"></span>{{ isPrototypeEdition ? 'Fictional demonstration values. Actual household spending patterns differ.' : 'Official CPI component indexes rebased to the same month in 2016. These are price indexes, not household budgets.' }}</figcaption>
                  <div v-if="!isPrototypeEdition" class="source-links" aria-label="Chart source">
                    <a :href="sourceForTable(18100004)?.url" target="_blank" rel="noreferrer">CPI table 18-10-0004-01 ↗</a>
                  </div>
                </figure>
                <div class="definition-note"><strong>Keep the terms straight</strong><span>Price level: what something costs. Inflation: how quickly that price changes. Real wage growth: earnings growth adjusted for price changes.</span></div>
                <p class="chapter-transition"><span>Next</span> Those pressures show up differently from one province to another.</p>
              </div>
            </article>

            <article id="chapter-4" class="chapter" data-story-chapter aria-labelledby="chapter-4-title">
              <div class="chapter-heading">
                <p class="chapter-kicker"><span>04</span> / Regional differences</p>
                <h2 id="chapter-4-title">Canada is not<br />one story.</h2>
                <p class="chapter-lede">National numbers are useful for scale. They can also smooth over the different combinations of housing costs, population change and earnings found across provinces.</p>
              </div>
              <div class="chapter-body">
                <p>A fair comparison needs the same measures and the same time window. It also needs room for the differences within each province: a provincial average is not a portrait of every city, rural community or household.</p>
                <figure class="mini-chart">
                  <div class="mini-chart-heading">
                    <div><span class="chart-index">FIG. 04</span><h3>{{ isPrototypeEdition ? 'One country, different starting points' : 'Shelter prices and hourly wages' }}</h3></div>
                    <span class="chart-unit">{{ isPrototypeEdition ? 'Illustrative regional index' : `Index / ${storyData.meta.monthlyBasePeriodLabel} = 100` }}</span>
                  </div>
                  <div class="region-chart" role="img" :aria-label="regionalChartLabel()">
                    <div class="region-legend"><span><i class="legend-housing"></i>{{ isPrototypeEdition ? 'Housing cost' : 'Shelter CPI' }}</span><span><i class="legend-earnings"></i>{{ isPrototypeEdition ? 'Earnings' : 'Avg hourly wage' }}</span></div>
                    <div v-for="region in storyData.figures.regionalComparison" :key="region.province" class="region-row">
                      <strong>{{ region.province }}</strong>
                      <div class="region-bars">
                        <span class="legend-housing" :style="{ width: `${regionalBarWidth(region.housing)}%` }"></span>
                        <span class="legend-earnings" :style="{ width: `${regionalBarWidth(region.earnings)}%` }"></span>
                      </div>
                      <div class="region-values" aria-hidden="true"><span>{{ region.housing.toFixed(1) }}</span><span>{{ region.earnings.toFixed(1) }}</span></div>
                    </div>
                  </div>
                  <figcaption><span class="prototype-dot" :class="{ 'source-dot': !isPrototypeEdition }" aria-hidden="true"></span>{{ isPrototypeEdition ? 'Fictional demonstration values. Geography and period must be aligned for a real comparison.' : `Statistics Canada shelter CPI and average hourly wage indexes by province, not adjusted for seasonality; ${storyData.meta.monthlyBasePeriodLabel} to ${storyData.meta.latestMonthlyPeriodLabel}.` }}</figcaption>
                  <div v-if="!isPrototypeEdition" class="source-links" aria-label="Regional chart sources">
                    <a :href="sourceForTable(18100004)?.url" target="_blank" rel="noreferrer">CPI table 18-10-0004-01 ↗</a>
                    <a :href="sourceForTable(14100063)?.url" target="_blank" rel="noreferrer">Wages table 14-10-0063-01 ↗</a>
                  </div>
                </figure>
                <p class="chapter-transition"><span>Next</span> So which measures help us tell whether the gap is narrowing or widening?</p>
              </div>
            </article>

            <article id="chapter-5" class="chapter final-chapter" data-story-chapter aria-labelledby="chapter-5-title">
              <div class="chapter-heading">
                <p class="chapter-kicker"><span>05</span> / Looking ahead</p>
                <h2 id="chapter-5-title">What should we<br />watch next?</h2>
                <p class="chapter-lede">No single number can summarize affordability. A small set of well-defined indicators can show how the pressures are changing together.</p>
              </div>
              <div class="chapter-body">
                <ol class="watch-list">
                  <li><span>01</span><div><h3>Homes completed</h3><p>Track finished homes alongside population and household formation, not just construction starts.</p></div><span class="watch-arrow" aria-hidden="true">↗</span></li>
                  <li><span>02</span><div><h3>Essential prices</h3><p>Separate shelter and food from the all-items index, and keep price levels distinct from inflation.</p></div><span class="watch-arrow" aria-hidden="true">↗</span></li>
                  <li><span>03</span><div><h3>Earnings after inflation</h3><p>Compare wage changes with a compatible price measure to understand purchasing power.</p></div><span class="watch-arrow" aria-hidden="true">↗</span></li>
                  <li><span>04</span><div><h3>Provincial differences</h3><p>Use consistent periods and definitions, then look beneath provincial averages.</p></div><span class="watch-arrow" aria-hidden="true">↗</span></li>
                </ol>
                <div class="closing-note"><span class="closing-mark" aria-hidden="true">The point</span><p>Affordability is shaped by several forces at once. The useful question is not which single number explains it, but how the pieces move together, and for whom.</p></div>
              </div>
            </article>

            <section id="method-note" class="method-note" aria-labelledby="method-title">
              <p class="chapter-kicker">About this story</p>
              <h2 id="method-title">Evidence before certainty.</h2>
              <p v-if="isPrototypeEdition">This edition keeps the original fictional demonstration values as a rollback baseline. They are not observations, estimates, forecasts or official statistics.</p>
              <p v-else>This edition is a local snapshot retrieved from official Statistics Canada tables, including CMHC housing starts published through Statistics Canada. The browser makes no live request; run the data refresh command to retrieve a newer snapshot. The measures are descriptive, not proof of causation, and reference periods differ by source.</p>
              <a href="#top">Back to the beginning ↑</a>
            </section>
          </div>
        </div>
      </main>

      <footer class="story-footer">
        <a class="footer-brand" href="#top">The Affordability Gap</a>
        <span>Independent educational prototype</span>
        <span>Not an official Government of Canada product</span>
      </footer>
    </div>
  </VApp>
</template>