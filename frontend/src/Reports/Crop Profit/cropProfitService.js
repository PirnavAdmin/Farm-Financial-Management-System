import api from '../../services/api.js'
import {
  BENCHMARK_CROP_PNL_RECORDS,
  buildCropPnlFromRecords,
  normalizeApiCropPnlRow,
} from './cropProfitData.js'

function readLocalArray(keys) {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {
      // ignore invalid JSON in storage
    }
  }
  return []
}

function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload
  const inner = payload?.data ?? payload
  if (Array.isArray(inner)) return inner
  if (Array.isArray(inner?.crops)) return inner.crops
  if (Array.isArray(inner?.items)) return inner.items
  if (Array.isArray(inner?.records)) return inner.records
  if (Array.isArray(inner?.results)) return inner.results
  if (Array.isArray(inner?.data)) return inner.data
  return []
}

/**
 * Fetches Crop-wise Profit & Loss report data from the unified Crop Profitability
 * and Reports APIs, with resilient client-side aggregation and localStorage fallback.
 */
export async function fetchCropWisePnl(filters = {}) {
  const params = {}
  if (filters.fromDate) params.fromDate = filters.fromDate
  if (filters.toDate) params.toDate = filters.toDate
  if (filters.farm && filters.farm !== 'All') params.farm = filters.farm
  if (filters.season && filters.season !== 'All') params.season = filters.season
  if (filters.crop && filters.crop !== 'All') params.crop = filters.crop

  // 1a. Primary: Dedicated Crop Profitability & Unit Economics API (/api/crop-profitability)
  try {
    const res = await api.get('/api/crop-profitability', {
      params: { ...params, includeInactiveOrEmptyCrops: false },
    })
    const rawRows = unwrapArray(res.data)
    const hasActivity = rawRows.some(
      (r) => r && (Number(r.totalIncome) > 0 || Number(r.totalExpenses) > 0 || Number(r.areaAcres) > 0)
    )
    if (hasActivity) {
      const rows = rawRows.map((row, idx) => normalizeApiCropPnlRow(row, idx))
      return {
        rows,
        source: 'api',
        sourceLabel: 'Live Crop Profitability API',
      }
    }
  } catch {
    // Fall through to ReportsController endpoint
  }

  // 1b. Secondary: Unified Reports Crop-wise P&L endpoint (/api/Reports/crop-profit)
  try {
    const res = await api.get('/api/Reports/crop-profit', { params })
    const rawRows = unwrapArray(res.data)
    if (
      rawRows.length > 0 &&
      rawRows.some((r) => r && (r.expenseBreakdown || r.expensesByCategory || r.incomeBreakdown || r.costPerAcre !== undefined))
    ) {
      const rows = rawRows.map((row, idx) => normalizeApiCropPnlRow(row, idx))
      return {
        rows,
        source: 'api',
        sourceLabel: 'Live AgriMan Reports API',
      }
    }
  } catch {
    // Fall through to multi-endpoint aggregation / local records
  }

  // 2. Secondary: Parallel fetch of module APIs + localStorage fallback
  const [salesRes, incomeRes, expenseRes, seasonRes, cropRes, labourRes] = await Promise.allSettled([
    api.get('/api/Sales', { params: { pageSize: 500 } }),
    api.get('/api/Income'),
    api.get('/api/expenses', { params: { pageSize: 500 } }),
    api.get('/api/CropSeason'),
    api.get('/api/Crop'),
    api.get('/api/LabourAttendance'),
  ])

  const anyApiSucceeded = [salesRes, incomeRes, expenseRes, seasonRes, cropRes, labourRes].some(
    (r) => r.status === 'fulfilled'
  )

  const apiSales = salesRes.status === 'fulfilled' ? unwrapArray(salesRes.value.data) : []
  const apiIncomes = incomeRes.status === 'fulfilled' ? unwrapArray(incomeRes.value.data) : []
  const apiExpenses = expenseRes.status === 'fulfilled' ? unwrapArray(expenseRes.value.data) : []
  const apiSeasons = seasonRes.status === 'fulfilled' ? unwrapArray(seasonRes.value.data) : []
  const apiCrops = cropRes.status === 'fulfilled' ? unwrapArray(cropRes.value.data) : []
  const apiLabour = labourRes.status === 'fulfilled' ? unwrapArray(labourRes.value.data) : []

  const localSales = readLocalArray(['agriman-sales-sales'])
  const localIncomes = readLocalArray(['agriman-finance-income-records', 'agriman-finance-income'])
  const localExpenses = readLocalArray(['agriman-finance-expenses-records', 'agriman-finance-expenses'])
  const localSeasons = readLocalArray(['agriman_crop_seasons'])
  const localCrops = readLocalArray(['agriman_crops'])

  const sales = apiSales.length > 0 ? apiSales : localSales
  const incomes = apiIncomes.length > 0 ? apiIncomes : localIncomes
  const expenses = apiExpenses.length > 0 ? apiExpenses : localExpenses
  const cropSeasons = apiSeasons.length > 0 ? apiSeasons : localSeasons
  const crops = apiCrops.length > 0 ? apiCrops : localCrops
  const labourAttendances = apiLabour

  const computedRows = buildCropPnlFromRecords(
    { sales, incomes, expenses, cropSeasons, crops, labourAttendances },
    filters
  )

  const hasFinancialActivity = computedRows.some((r) => r.totalIncome > 0 || r.totalExpenses > 0)
  if (hasFinancialActivity) {
    return {
      rows: computedRows,
      source: anyApiSucceeded ? 'api-aggregated' : 'local',
      sourceLabel: anyApiSucceeded ? 'Live Module APIs' : 'Browser Storage Records',
    }
  }

  // 3. No live transactions recorded yet — return benchmark preview with clear flag
  return {
    rows: BENCHMARK_CROP_PNL_RECORDS,
    source: 'benchmark',
    sourceLabel: 'AgriMan Benchmark Sample (Cotton 10 Acres + Kharif Crops)',
  }
}

export function getBenchmarkCropPnl() {
  return {
    rows: BENCHMARK_CROP_PNL_RECORDS,
    source: 'benchmark',
    sourceLabel: 'AgriMan Benchmark Sample (Cotton 10 Acres + Kharif Crops)',
  }
}
