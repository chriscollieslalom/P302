import { writeFile } from 'node:fs/promises'

const apiBase = 'https://www150.statcan.gc.ca/t1/wds/rest'
const outputPath = new URL('../src/data/affordability-story-live.json', import.meta.url)
const tableIds = [18100004, 17100009, 14100063, 18100205, 34100135, 36100587, 98100252]
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
    const details = await response.text()
    throw new Error(`${method} failed with HTTP ${response.status}: ${details.slice(0, 500)}`)
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
const newHousingPrices = cubes.get(18100205)
const housing = cubes.get(34100135)
const householdAccounts = cubes.get(36100587)
const shelterBurdenTable = cubes.get(98100252)
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
  addSeries(specs, newHousingPrices, geography, `new-housing:${geography}`, {
    'New housing price indexes': 'Total (house and land)',
  }, 150)
  addSeries(specs, householdAccounts, geography, `disposable-income:${geography}`, {
    Statistics: 'Value per household',
    Characteristics: 'All households',
    'Income, consumption and savings': 'Household disposable income',
  }, 35)
}

const censusDimensions = {
  'Household total income groups (14)': 'Total - Total income of household',
  'Household type including census family structure (16)': 'Total - Household type including census family structure',
  'Housing suitability (3)': 'Total - Housing suitability',
  'Dwelling condition (3)': 'Total - Dwelling condition',
  'Statistics (3C)': 'Number of private households',
}

for (const geography of ['Canada', ...provinces]) {
  for (const [tenure, tenureLabel] of [['owner', 'Owner'], ['renter', 'Renter']]) {
    for (const [ratio, ratioLabel] of [['all', 'Total - Shelter-cost-to-income ratio'], ['30plus', 'Spending 30% or more of income on shelter costs']]) {
      addSeries(specs, shelterBurdenTable, geography, `shelter-burden:${geography}:${tenure}:${ratio}`, {
        ...censusDimensions,
        'Shelter-cost-to-income ratio (5)': ratioLabel,
        'Tenure (3)': tenureLabel,
      }, 1)
    }
  }
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
const startsPerThousandStart = round((startsStart / populationStart) * 1000, 2)
const startsPerThousandEnd = round((startsEnd / populationEnd) * 1000, 2)
const startsAtPopulationPace = Math.round(startsStart * (populationEnd / populationStart))
const startsAbovePopulationPace = startsEnd - startsAtPopulationPace
const populationHousing = {
  startYear,
  endYear,
  series: [
    { label: 'Population estimate (July 1)', value: toIndex(populationEnd, populationStart), colorClass: 'population-color' },
    { label: 'Housing starts (calendar-year total)', value: toIndex(startsEnd, startsStart), colorClass: 'housing-color' },
  ],
  startsPerThousand: [startsPerThousandStart, startsPerThousandEnd],
  startsAtPopulationPace,
  startsAbovePopulationPace,
  actualEndStarts: startsEnd,
  summary: `From ${startYear} to ${endYear}, population grew ${round(((populationEnd / populationStart) - 1) * 100)}% and annual housing starts grew ${round(((startsEnd / startsStart) - 1) * 100)}. Starts rose from ${startsPerThousandStart} to ${startsPerThousandEnd} per 1,000 residents. If starts had only grown with population, ${endYear} would have had about ${startsAtPopulationPace.toLocaleString('en-CA')} starts; the actual total was ${startsEnd.toLocaleString('en-CA')}, about ${startsAbovePopulationPace.toLocaleString('en-CA')} above that benchmark. This simple benchmark is not an estimate of homes needed.`,
  sourceNote: `Statistics Canada tables 17-10-0009-01 and 34-10-0135-01. Population is a July 1 stock estimate; housing starts are unadjusted total units started during each calendar year. Starts are not completions or occupied homes. Matching starts growth to population alone does not account for household size, existing shortages, demolitions, location, or unit type.`,
}

const newHousingPoints = getSeries(records, 18100205, 'new-housing:Canada')
const disposableIncomePoints = getSeries(records, 36100587, 'disposable-income:Canada')
const annualYears = disposableIncomePoints
  .map((point) => Number(point.refPer.slice(0, 4)))
  .filter((year) => year >= 2016 && newHousingPoints.some((point) => point.refPer === `${year}-12-01`))
  .sort((left, right) => left - right)
const annualIncome = (year) => pointAt(disposableIncomePoints, `${year}-01-01`, `household disposable income for ${year}`)
const annualNewHousing = (year) => pointAt(newHousingPoints, `${year}-12-01`, `new housing price index for ${year}`)
const annualAllItems = (year) => pointAt(getSeries(records, 18100004, 'cpi:Canada:All-items'), `${year}-12-01`, `all-items CPI for ${year}`)
const annualShelter = (year) => pointAt(getSeries(records, 18100004, 'cpi:Canada:Shelter'), `${year}-12-01`, `shelter CPI for ${year}`)
const incomeBase = annualIncome(annualYears[0])
const housingBase = annualNewHousing(annualYears[0])
const allItemsBase = annualAllItems(annualYears[0])
const shelterBase = annualShelter(annualYears[0])
const housingIncomeRatio = annualYears.map((year) => round(
  toIndex(annualNewHousing(year), housingBase) / toIndex(annualIncome(year), incomeBase) * 100,
))
const shelterIncomeRatio = annualYears.map((year) => round(
  toIndex(annualShelter(year), shelterBase) / toIndex(annualIncome(year), incomeBase) * 100,
))
const allItemsIncomeRatio = annualYears.map((year) => round(
  toIndex(annualAllItems(year), allItemsBase) / toIndex(annualIncome(year), incomeBase) * 100,
))
const ratioPeak = Math.max(...housingIncomeRatio)
const ratioPeakYear = annualYears[housingIncomeRatio.indexOf(ratioPeak)]
const householdIncomeGrowth = round(((annualIncome(annualYears.at(-1)) / incomeBase) - 1) * 100)
const newHousingGrowth = round(((annualNewHousing(annualYears.at(-1)) / housingBase) - 1) * 100)
const shelterCpiGrowth = round(((annualShelter(annualYears.at(-1)) / shelterBase) - 1) * 100)
const housingIncomeComparison = {
  labels: annualYears.map(String),
  newHousingToIncome: housingIncomeRatio,
  shelterToIncome: shelterIncomeRatio,
  allItemsToIncome: allItemsIncomeRatio,
  ratioPeakYear,
  ratioPeak,
  latestYear: annualYears.at(-1),
  householdIncomeGrowth,
  newHousingGrowth,
  shelterCpiGrowth,
  summary: `From ${annualYears[0]} to ${annualYears.at(-1)}, nominal disposable income per household rose ${householdIncomeGrowth}%, the new housing price index rose ${newHousingGrowth}%, and shelter CPI rose ${shelterCpiGrowth}%. The new-housing-price growth ratio peaked at ${ratioPeak} in ${ratioPeakYear}, then eased. This is a national growth comparison, not a direct home-price-to-income affordability measure.`,
  sourceNote: `Statistics Canada tables 18-10-0205-01, 36-10-0587-01, and 18-10-0004-01. December all-items, shelter, and new-housing indexes are compared with annual nominal disposable income per household. In this growth-ratio chart, 100 means price and income grew at the same rate since 2016; above 100 means the selected price index grew faster. This is not the share of income spent on housing.`,
}

const shelterBurdenByTenure = {
  referencePeriod: '2021 Census',
  threshold: '30% or more of household income spent on shelter costs',
  provinces: ['Canada', ...provinces].map((geography) => {
    const shareAtThreshold = (tenure) => {
      const allHouseholds = getSeries(records, 98100252, `shelter-burden:${geography}:${tenure}:all`)
      const burdenedHouseholds = getSeries(records, 98100252, `shelter-burden:${geography}:${tenure}:30plus`)
      const denominator = allHouseholds.at(-1).value
      const numerator = burdenedHouseholds.at(-1).value

      if (denominator <= 0 || numerator < 0 || numerator > denominator) {
        throw new Error(`Invalid 2021 shelter-cost share for ${geography}, ${tenure}`)
      }

      return round((numerator / denominator) * 100)
    }

    return {
      province: geography === 'British Columbia' ? 'B.C.' : geography,
      owners: shareAtThreshold('owner'),
      renters: shareAtThreshold('renter'),
    }
  }),
  summary: 'The 2021 Census measured the share of owner and renter households spending 30% or more of household income on shelter. The threshold is a common indicator, not a complete definition of affordability.',
  sourceNote: 'Statistics Canada 2021 Census table 98-10-0252-01. Cross-sectional household share by province and tenure; not a current time series.',
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
    housingIncomeComparison,
    populationHousing,
    essentialCosts,
    shelterBurdenByTenure,
    regionalComparison,
  },
}

await writeFile(outputPath, `${JSON.stringify(liveData, null, 2)}\n`)
console.log(`Updated ${outputPath.pathname}`)
console.log(`Monthly comparison: ${priceVsEarnings.basePeriod} to ${priceVsEarnings.latestPeriod}`)
console.log(`Population and starts comparison: ${startYear} to ${endYear}`)
console.log(`Source tables: ${tableIds.join(', ')}`)