<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
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
import storyData from './data/affordability-story.json'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const activeChapter = ref('chapter-1')
let chapterObserver: IntersectionObserver | undefined

const priceVsEarningsData = {
  labels: storyData.figures.priceVsEarnings.labels,
  datasets: [
    {
      label: 'Illustrative cost index',
      data: storyData.figures.priceVsEarnings.costs,
      borderColor: '#ed7756',
      backgroundColor: 'rgba(237, 119, 86, 0.12)',
      pointBackgroundColor: '#ed7756',
      borderWidth: 3,
      pointRadius: 3,
      tension: 0.35,
    },
    {
      label: 'Illustrative earnings index',
      data: storyData.figures.priceVsEarnings.earnings,
      borderColor: '#3d9d87',
      backgroundColor: 'rgba(61, 157, 135, 0.12)',
      pointBackgroundColor: '#3d9d87',
      borderWidth: 3,
      pointRadius: 3,
      tension: 0.35,
    },
  ],
}

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
    y: { min: 95, max: 140, grid: { color: 'rgba(30, 50, 42, 0.09)' }, ticks: { color: '#58645e' } },
  },
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
              <div class="hero-chart" role="img" aria-label="Illustrative line chart comparing a fictional cost index and earnings index. Both start at 100; the example cost index rises faster. These are not official data.">
                <Line :data="priceVsEarningsData" :options="lineOptions" />
              </div>
              <figcaption>
                <span class="prototype-dot" aria-hidden="true"></span>
                Illustrative series only. Not official observations.
              </figcaption>
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
          <p><strong>Prototype story.</strong> Charts use fictional demonstration values while source measures are being defined. They are not current Canadian statistics.</p>
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
                <p>Inflation describes how quickly prices change. The price level describes what things cost. When inflation eases, prices may still be rising, just more slowly. The accumulated change stays in the household budget.</p>
                <p>To understand affordability, we need to look beyond a single month or a single rate. The cost of essentials, what people earn, and the place they live all shape the experience.</p>
                <div class="pull-quote"><span aria-hidden="true">“</span><p>A slower climb is still a climb. The starting point has changed.</p></div>
                <p class="chapter-transition"><span>Next</span> One part of the picture is how many people need a place to live, and how quickly homes are added.</p>
              </div>
            </article>

            <article id="chapter-2" class="chapter" data-story-chapter aria-labelledby="chapter-2-title">
              <div class="chapter-heading">
                <p class="chapter-kicker"><span>02</span> / People and homes</p>
                <h2 id="chapter-2-title">Population grew<br />faster than housing.</h2>
                <p class="chapter-lede">Population and housing supply are connected, but they are not interchangeable counts. Timing, location, household size and the kind of homes being built all matter.</p>
              </div>
              <div class="chapter-body">
                <p>A national comparison can reveal whether the number of homes is keeping pace with the number of people. It cannot, on its own, tell us where homes are available, who can afford them, or whether they meet local needs.</p>
                <figure class="mini-chart">
                  <div class="mini-chart-heading">
                    <div><span class="chart-index">FIG. 02</span><h3>Two measures, one shared baseline</h3></div>
                    <span class="chart-unit">Illustrative index / 2016 = 100</span>
                  </div>
                  <div class="index-chart" role="img" aria-label="Fictional indexed example: population rises from 100 to 127 while completed homes rise from 100 to 119. This is a layout illustration, not official data.">
                    <div class="index-axis"><span>100</span><span>110</span><span>120</span><span>130</span></div>
                    <div v-for="series in storyData.figures.populationHousing.series" :key="series.label" class="index-row">
                      <span class="index-label"><i :class="series.colorClass"></i>{{ series.label }}</span>
                      <div class="index-track"><span :class="series.colorClass" :style="{ width: `${(series.value - 90) * 2.5}%` }"></span></div>
                      <strong>{{ series.value }}</strong>
                    </div>
                    <div class="index-years"><span>2016</span><span>2026</span></div>
                  </div>
                  <figcaption><span class="prototype-dot" aria-hidden="true"></span> Fictional demonstration values. Compare validated, compatible series before drawing conclusions.</figcaption>
                </figure>
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
                    <span class="chart-unit">Illustrative index / 2016 = 100</span>
                  </div>
                  <div class="category-chart" role="img" aria-label="Fictional indexed example of different price changes for all items, food and shelter. Values are for layout demonstration only.">
                    <div v-for="item in storyData.figures.essentialCosts" :key="item.label" class="category-row">
                      <span>{{ item.label }}</span>
                      <div class="category-track"><span :class="item.colorClass" :style="{ width: `${(item.value - 90) * 2}%` }"></span></div>
                      <strong>{{ item.value }}</strong>
                    </div>
                    <div class="category-axis"><span>100</span><span>120</span><span>140</span></div>
                  </div>
                  <figcaption><span class="prototype-dot" aria-hidden="true"></span> Fictional demonstration values. Actual household spending patterns differ.</figcaption>
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
                    <div><span class="chart-index">FIG. 04</span><h3>One country, different starting points</h3></div>
                    <span class="chart-unit">Illustrative regional index</span>
                  </div>
                  <div class="region-chart" role="img" aria-label="Fictional regional comparison of a housing cost index and earnings index in five provinces. This is not official data.">
                    <div class="region-legend"><span><i class="legend-housing"></i>Housing cost</span><span><i class="legend-earnings"></i>Earnings</span></div>
                    <div v-for="region in storyData.figures.regionalComparison" :key="region.province" class="region-row">
                      <strong>{{ region.province }}</strong>
                      <div class="region-bars">
                        <span class="legend-housing" :style="{ width: `${region.housing}%` }"></span>
                        <span class="legend-earnings" :style="{ width: `${region.earnings}%` }"></span>
                      </div>
                    </div>
                  </div>
                  <figcaption><span class="prototype-dot" aria-hidden="true"></span> Fictional demonstration values. Geography and period must be aligned for a real comparison.</figcaption>
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
              <p>This first interface pass uses fictional demonstration values to show how the story and graphics may work. These values are not observations, estimates, forecasts or official statistics. Source series, definitions and comparable reference periods must be validated before the charts can support factual conclusions.</p>
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