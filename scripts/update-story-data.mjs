import { writeFile } from 'node:fs/promises'

const apiBase = 'https://www150.statcan.gc.ca/t1/wds/rest'
const outputPath = new URL('../src/data/affordability-story-live.json', import.meta.url)
const tableIds = [18100004, 17100009, 14100063, 34100135]
const provinces = [
  'Newfoundland and Labrador',
  'Prince Edward Island',
  'Nova Scotia',
  'New Brunswick',
  'Quebec',
  'Ontario',
  'Manitoba',
  'Saskatchewan',
  'Alberta',
  'British Columbia',
]

async function post(method, payload) {
  const response = await fetch(`${apiBase}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`${method} failed with HTTP ${response.status}`)
  }

  const result = await response.json()

  if (Array.isArray(result)) {
    const failure = result.find((item) => item.status !== 'SUCCESS')
    if (failure) throw new Error(`${method} failed: ${JSON.stringify(failure)}`)
    return result.map((item) => item.object)
  }

  if (result.status !== 'SUCCESS') {
    throw new Error(`${method} failed: ${JSON.stringify(result)}`)
  }

  return result.object
}

function memberId(cube, dimensionName, memberName) {
  const dimension = cube.dimension.find((item) => item.dimensionNameEn === dimensionName)
  const member = dimension?.member.find((item) => item.memberNameEn === memberName)

  if (!member) {
    throw new Error(`Missing ${dimensionName} member "${memberName}" in table ${cube.productId}`)
  }

  return member.memberId
}

function makeCoordinate(cube, geography, selections = {}) {
  const members = cube.dimension.map((dimension) => {
    if (dimension.dimensionNameEn === 'Geography') {
      return memberId(cube, dimension.dimensionNameEn, geography)
    }

    const selection = selections[dimension.dimensionNameEn]
    return selection ? memberId(cube, dimension.dimensionNameEn, selection) : 0
  })

  return [...members, ...Array(10 - members.length).fill(0)].join('.')
}

function addSeries(specs, cube, geography, key, selections, latestN) {
  specs.push({
    productId: Number(cube.productId),
    key,
    geography,
    coordinate: makeCoordinate(cube, geography, selections),
    latestN,
  })
}

function round(value, places = 1) {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

function getSeries(records, productId, key) {
  const record = records.get(key)
  if (!record || record.productId !== productId) {
    throw new Error(`No observations returned for ${key}`)
  }

  const validPoints = record.vectorDataPoint.filter(
    (point) => point.statusCode === 0 && typeof point.value === 'number' && Number.isFinite(point.value),
  )

  if (!validPoints.length) throw new Error(`No valid observations available for ${key}`)
  return validPoints.sort((left, right) => left.refPer.localeCompare(right.refPer))
}

function pointAt(points, referencePeriod, key) {
  const point = points.find((item) => item.refPer === referencePeriod)
  if (!point) throw new Error(`Missing ${referencePeriod} observation for ${key}`)
  return point.value
}

function toIndex(value, baseline) {
  return round((value / baseline) * 100)
}

function monthLabel(referencePeriod) {
  const date = new Date(`${referencePeriod}T00:00:00Z`)
  return new Intl.DateTimeFormat('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date)
}

const metadata = await post('getCubeMetadata', tableIds.map((productId) => ({ productId })))
const cubes = new Map(metadata.map((cube) => [Number(cube.productId), cube]))

for (const productId of tableIds) {
  if (!cubes.has(productId)) throw new Error(`Metadata missing for table ${productId}`)
}

const cpi = cubes.get(18100004)
const population = cubes.get(17100009)
const wages = cubes.get(14100063)
const housing = cubes.get(34100135)
const specs = []

for (const product of ['All-items', 'Food', 'Shelter']) {
  addSeries(specs, cpi, 'Canada', `cpi:Canada:${product}`, { 'Products and product groups': product }, 150)
}

for (const province of provinces) {
  addSeries(specs, cpi, province, `cpi:${province}:Shelter`, { 'Products and product groups': 'Shelter' }, 150)
}

const wageSelections = {
  Wages: 'Average hourly wage rate',
  'Type of work': 'Both full- and part-time employees',
  'North American Industry Classification System (NAICS)': 'Total employees, all industries',
  Gender: 'Total - Gender',
  'Age group': '15 years and over',
}

for (const geography of ['Canada', ...provinces]) {
  addSeries(specs, wages, geography, `wages:${geography}`, wageSelections, 150)
}

for (const geography of ['Canada']) {
  addSeries(specs, population, geography, `population:${geography}`, {}, 50)
  addSeries(specs, housing, geography, `starts:${geography}`, {
    'Housing estimates': 'Housing starts',
    'Type of unit': 'Total units',
    'Seasonal adjustment': 'Unadjusted',
  }, 50)
}

const records = new Map()

for (let offset = 0; offset < specs.length; offset += 4) {
  const batch = specs.slice(offset, offset + 4)
  const results = await post(
    'getDataFromCubePidCoordAndLatestNPeriods',
    batch.map(({ productId, coordinate, latestN }) => ({ productId, coordinate, latestN })),
  )

  for (const result of results) {
    if (result.responseStatusCode !== 0) {
      throw new Error(`WDS rejected ${result.productId}/${result.coordinate}`)
    }

    const spec = batch.find(
      (item) => item.productId === result.productId && item.coordinate === result.coordinate,
    )

    if (!spec) throw new Error(`Unexpected WDS series ${result.productId}/${result.coordinate}`)
    records.set(spec.key, result)
  }
}

const allItems = getSeries(records, 18100004, 'cpi:Canada:All-items')
const nationalWages = getSeries(records, 14100063, 'wages:Canada')
const wageDates = new Set(nationalWages.map((point) => point.refPer))
const monthlyCommonDates = allItems.map((point) => point.refPer).filter((date) => wageDates.has(date))
const latestMonth = monthlyCommonDates.at(-1)

if (!latestMonth) throw new Error('No shared CPI and wage reference period')

const latestMonthNumber = latestMonth.slice(5, 7)
const latestYear = Number(latestMonth.slice(0, 4))
const sampleYears = [2016, 2018, 2020, 2022, 2024].filter((year) => year < latestYear)
if (!sampleYears.includes(latestYear)) sampleYears.push(latestYear)

const sampledDates = sampleYears.map((year) => `${year}-${latestMonthNumber}-01`)
const wageBaseline = pointAt(nationalWages, sampledDates[0], 'Canadian average hourly wage')
const cpiBaseline = pointAt(allItems, sampledDates[0], 'Canadian all-items CPI')
const priceVsEarnings = {
  labels: sampleYears.map(String),
  costs: sampledDates.map((date) => toIndex(pointAt(allItems, date, 'Canadian all-items CPI'), cpiBaseline)),
  earnings: sampledDates.map((date) => toIndex(pointAt(nationalWages, date, 'Canadian average hourly wage'), wageBaseline)),
  seriesLabels: ['All-items CPI', 'Average hourly wage'],
  basePeriod: sampledDates[0],
  latestPeriod: sampledDates.at(-1),
  sourceNote: `Statistics Canada tables 18-10-0004-01 and 14-10-0063-01; monthly, not seasonally adjusted; indexed to ${monthLabel(sampledDates[0])} = 100. Latest shared period: ${monthLabel(latestMonth)}.`,
}

const essentialCosts = ['All-items', 'Food', 'Shelter'].map((product, index) => {
  const points = getSeries(records, 18100004, `cpi:Canada:${product}`)
  const base = pointAt(points, sampledDates[0], `Canadian ${product} CPI`)
  const latest = pointAt(points, latestMonth, `Canadian ${product} CPI`)
  const labels = ['All items', 'Food', 'Shelter']
  const colorClasses = ['essential-overall', 'essential-food', 'essential-shelter']

  return { label: labels[index], value: toIndex(latest, base), colorClass: colorClasses[index] }
})

const populationPoints = getSeries(records, 17100009, 'population:Canada')
const housingStartPoints = getSeries(records, 34100135, 'starts:Canada')
const startsByYear = new Map()

for (const point of housingStartPoints) {
  const year = Number(point.refPer.slice(0, 4))
  startsByYear.set(year, (startsByYear.get(year) ?? 0) + point.value)
}

const completeYears = [...startsByYear.keys()]
  .filter((year) => [0, 1, 2, 3].every((quarter) => {
    const month = String(1 + quarter * 3).padStart(2, '0')
    return housingStartPoints.some((point) => point.refPer === `${year}-${month}-01`)
  }))
  .sort((left, right) => left - right)
const startYear = completeYears.find((year) => year >= 2016)
const endYear = completeYears.at(-1)

if (!startYear || !endYear || endYear <= startYear) {
  throw new Error('Could not find two complete, comparable housing-start years')
}

const populationForYear = (year) => pointAt(populationPoints, `${year}-07-01`, `population estimate for ${year}`)
const populationStart = populationForYear(startYear)
const populationEnd = populationForYear(endYear)
const startsStart = startsByYear.get(startYear)
const startsEnd = startsByYear.get(endYear)
const populationHousing = {
  startYear,
  endYear,
  series: [
    { label: 'Population estimate (July 1)', value: toIndex(populationEnd, populationStart), colorClass: 'population-color' },
    { label: 'Housing starts (calendar-year total)', value: toIndex(startsEnd, startsStart), colorClass: 'housing-color' },
  ],
  summary: `From ${startYear} to ${endYear}, the July 1 population estimate changed ${round(((populationEnd / populationStart) - 1) * 100)}%; annual housing starts changed ${round(((startsEnd / startsStart) - 1) * 100)}%. Starts are not completions or occupied homes.`,
  sourceNote: `Statistics Canada tables 17-10-0009-01 and 34-10-0135-01. Population is a July 1 stock estimate; housing starts are unadjusted total units started during each calendar year. Both are indexed to ${startYear} = 100, but are different measures and do not establish housing adequacy.`,
}

const latestMonthlyRegion = monthlyCommonDates.at(-1)
const regionalComparison = provinces.map((province) => {
  const shelter = getSeries(records, 18100004, `cpi:${province}:Shelter`)
  const hourlyWage = getSeries(records, 14100063, `wages:${province}`)
  const baselineDate = `${sampleYears[0]}-${latestMonthNumber}-01`
  const shelterBase = pointAt(shelter, baselineDate, `${province} shelter CPI`)
  const wageBase = pointAt(hourlyWage, baselineDate, `${province} hourly wage`)

  return {
    province: province === 'British Columbia' ? 'B.C.' : province,
    housing: toIndex(pointAt(shelter, latestMonthlyRegion, `${province} shelter CPI`), shelterBase),
    earnings: toIndex(pointAt(hourlyWage, latestMonthlyRegion, `${province} hourly wage`), wageBase),
  }
})

const sourceRecords = tableIds.map((productId) => {
  const cube = cubes.get(productId)
  return {
    organization: productId === 34100135 ? 'Canada Mortgage and Housing Corporation via Statistics Canada' : 'Statistics Canada',
    tableId: productId,
    tableNumber: `${String(productId).slice(0, 2)}-${String(productId).slice(2, 4)}-${String(productId).slice(4)}-01`,
    title: cube.cubeTitleEn,
    url: `https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=${productId}01`,
    frequencyCode: cube.frequencyCode,
    latestReferencePeriod: cube.cubeEndDate,
    releaseTime: cube.releaseTime,
    series: specs.filter((spec) => spec.productId === productId).map((spec) => {
      const points = getSeries(records, productId, spec.key)
      return {
        key: spec.key,
        geography: spec.geography,
        coordinate: spec.coordinate,
        vectorId: records.get(spec.key).vectorId,
        firstReferencePeriod: points[0].refPer,
        latestReferencePeriod: points.at(-1).refPer,
      }
    }),
  }
})

const lastRefreshed = new Date().toISOString()
const liveData = {
  meta: {
    title: 'The Affordability Gap',
    edition: 'official',
    status: 'Official Statistics Canada and CMHC source snapshot; reference periods vary by figure.',
    fetchedAt: lastRefreshed,
    lastRefreshedLabel: `Source snapshot retrieved ${lastRefreshed.slice(0, 10)}`,
    monthlyBasePeriodLabel: monthLabel(sampledDates[0]),
    latestMonthlyPeriodLabel: monthLabel(latestMonth),
    sources: sourceRecords,
  },
  chapters: [
    { id: 'chapter-1', number: '01', navTitle: 'The pressure' },
    { id: 'chapter-2', number: '02', navTitle: 'People and homes' },
    { id: 'chapter-3', number: '03', navTitle: 'Prices and pay' },
    { id: 'chapter-4', number: '04', navTitle: 'Regional differences' },
    { id: 'chapter-5', number: '05', navTitle: 'Looking ahead' },
  ],
  figures: {
    priceVsEarnings: {
      ...priceVsEarnings,
      summary: `From ${monthLabel(sampledDates[0])} to ${monthLabel(sampledDates.at(-1))}, Canada's all-items CPI rose ${round(priceVsEarnings.costs.at(-1) - 100)}%; average hourly wages rose ${round(priceVsEarnings.earnings.at(-1) - 100)}%. These national averages do not describe every household or worker.`,
    },
    populationHousing,
    essentialCosts,
    regionalComparison,
  },
}

await writeFile(outputPath, `${JSON.stringify(liveData, null, 2)}\n`)
console.log(`Updated ${outputPath.pathname}`)
console.log(`Monthly comparison: ${priceVsEarnings.basePeriod} to ${priceVsEarnings.latestPeriod}`)
console.log(`Population and starts comparison: ${startYear} to ${endYear}`)
console.log(`Source tables: ${tableIds.join(', ')}`)