export const CANONICAL_EXPENSE_BUCKETS = [
  'Seeds',
  'Fertilizer',
  'Pesticides',
  'Labour',
  'Diesel',
  'Machinery',
  'Transport',
]

export const EXPENSE_BUCKET_COLORS = {
  Seeds: '#16a34a',
  Fertilizer: '#0d9488',
  Pesticides: '#d97706',
  Labour: '#2563eb',
  Diesel: '#dc2626',
  Machinery: '#7c3aed',
  Transport: '#0284c7',
  Other: '#64748b',
}

export function round2(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export function parseAmount(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function parseAreaAcres(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0
  const match = String(value ?? '').match(/[\d,.]+/)
  if (!match) return 0
  const parsed = Number(match[0].replace(/,/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function dateISO(value) {
  if (!value) return ''
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10)
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
  }
  const match = str.match(/^(\d{1,2}) ([A-Za-z]{3}) (\d{4})$/)
  if (!match) return ''
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(match[2]) + 1
  return month ? `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}` : ''
}

export function toKg(quantity, unit) {
  const q = parseAmount(quantity)
  if (q <= 0) return 0
  const u = String(unit ?? '').trim().toLowerCase()
  if (u === 'kg' || u === 'kgs' || u === 'kilogram' || u === 'kilograms') return q
  if (u === 'quintal' || u === 'quintals' || u === 'qtl' || u === 'qtls') return q * 100
  if (u === 'tonne' || u === 'tonnes' || u === 'ton' || u === 'tons' || u === 'mt') return q * 1000
  if (u === 'gram' || u === 'grams' || u === 'g' || u === 'gm') return q / 1000
  if (u === 'bag' || u === 'bags') return q * 50
  return 0
}

export function parseQuantityWithUnit(value, fallbackUnit = '') {
  if (typeof value === 'number') {
    return { quantity: Number.isFinite(value) ? value : 0, unit: fallbackUnit }
  }
  const str = String(value ?? '').trim()
  if (!str) return { quantity: 0, unit: fallbackUnit }
  const match = str.match(/^([\d,.]+)\s*(.*)$/)
  if (!match) return { quantity: 0, unit: fallbackUnit }
  const quantity = Number(match[1].replace(/,/g, ''))
  const unit = match[2].trim() || fallbackUnit
  return { quantity: Number.isFinite(quantity) ? quantity : 0, unit }
}

export function mapExpenseCategory(rawCategory, description = '') {
  const combined = `${rawCategory ?? ''} ${description ?? ''}`.trim().toLowerCase()
  if (combined.includes('seed') || combined.includes('sapling') || combined.includes('nursery')) return 'Seeds'
  if (
    combined.includes('fertilizer') ||
    combined.includes('fertiliser') ||
    combined.includes('urea') ||
    combined.includes('dap') ||
    combined.includes('potash') ||
    combined.includes('manure') ||
    combined.includes('compost')
  ) {
    return 'Fertilizer'
  }
  if (
    combined.includes('pesticide') ||
    combined.includes('herbicide') ||
    combined.includes('fungicide') ||
    combined.includes('insecticide') ||
    combined.includes('crop protection')
  ) {
    return 'Pesticides'
  }
  if (
    combined.includes('labour') ||
    combined.includes('labor') ||
    combined.includes('wage') ||
    combined.includes('weeding') ||
    combined.includes('harvesting') ||
    combined.includes('worker')
  ) {
    return 'Labour'
  }
  if (combined.includes('diesel') || combined.includes('fuel') || combined.includes('petrol')) return 'Diesel'
  if (
    combined.includes('machinery') ||
    combined.includes('tractor') ||
    combined.includes('rotavator') ||
    combined.includes('harvester') ||
    combined.includes('equipment')
  ) {
    return 'Machinery'
  }
  if (
    combined.includes('transport') ||
    combined.includes('haulage') ||
    combined.includes('freight') ||
    combined.includes('cartage')
  ) {
    return 'Transport'
  }
  const trimmed = String(rawCategory ?? '').trim()
  return trimmed || 'Other'
}

export function formatINR(value, maximumFractionDigits = 0) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const num = Number(value)
  const sign = num < 0 ? '-' : ''
  const absFormatted = Math.abs(num).toLocaleString('en-IN', {
    minimumFractionDigits: maximumFractionDigits > 0 && Math.abs(num % 1) > 0.001 ? 2 : 0,
    maximumFractionDigits,
  })
  return `${sign}₹${absFormatted}`
}

export function formatMetricINR(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const num = Number(value)
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  const hasFraction = Math.abs(abs - Math.round(abs)) > 0.005
  return `${sign}₹${abs.toLocaleString('en-IN', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  })}`
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(decimals)}%`
}

/**
 * Computes all Crop-wise Profit & Loss derived formulas and important metrics.
 */
export function computeCropMetrics({
  totalIncome = 0,
  cropSales = 0,
  totalExpenses = 0,
  areaAcres = 0,
  soldQuantityKg = 0,
  totalQuantityKg = 0,
}) {
  const inc = round2(totalIncome)
  const salesRev = round2(cropSales)
  const exp = round2(totalExpenses)
  const netProfit = round2(inc - exp)
  const area = Number(areaAcres) > 0 ? Number(areaAcres) : 0
  const soldKg = Number(soldQuantityKg) > 0 ? Number(soldQuantityKg) : 0
  const effectiveKg = soldKg > 0 ? soldKg : (Number(totalQuantityKg) > 0 ? Number(totalQuantityKg) : 0)

  const costPerAcre = area > 0 ? round2(exp / area) : null
  const incomePerAcre = area > 0 ? round2(inc / area) : null
  const profitPerAcre = area > 0 ? round2(netProfit / area) : null
  const costPerKg = effectiveKg > 0 ? round2(exp / effectiveKg) : null
  const sellingPricePerKg = soldKg > 0
    ? round2((salesRev > 0 ? salesRev : inc) / soldKg)
    : (effectiveKg > 0 && inc > 0 ? round2(inc / effectiveKg) : null)
  const roiPercent = exp > 0 ? round2((netProfit / exp) * 100) : null
  const profitMarginPercent = inc > 0 ? round2((netProfit / inc) * 100) : 0

  return {
    totalIncome: inc,
    totalExpenses: exp,
    netProfit,
    areaAcres: round2(area),
    soldQuantityKg: round2(soldKg),
    totalQuantityKg: round2(effectiveKg),
    costPerAcre,
    incomePerAcre,
    profitPerAcre,
    costPerKg,
    sellingPricePerKg,
    roiPercent,
    profitMarginPercent,
  }
}

export function normalizeApiCropPnlRow(row, index = 0) {
  const cropName = String(row.crop ?? row.cropName ?? `Crop ${index + 1}`).trim()
  const areaAcres = parseAreaAcres(row.areaAcres ?? row.area ?? row.acres ?? 0)

  const rawIncomeBreakdown = row.incomeBreakdown
  const isIncomeArray = Array.isArray(rawIncomeBreakdown)
  const incomeBreakdownObj = !isIncomeArray && rawIncomeBreakdown && typeof rawIncomeBreakdown === 'object'
    ? rawIncomeBreakdown
    : {}

  const rawExpenseBreakdown = row.expenseBreakdown
  const isExpenseArray = Array.isArray(rawExpenseBreakdown)
  const expenseSource = row.expensesByCategory && typeof row.expensesByCategory === 'object'
    ? row.expensesByCategory
    : (!isExpenseArray && rawExpenseBreakdown && typeof rawExpenseBreakdown === 'object' ? rawExpenseBreakdown : {})

  const totalIncome = round2(row.totalIncome ?? row.revenue ?? row.income ?? 0)
  const cropSales = round2(row.cropSales ?? incomeBreakdownObj.cropSales ?? totalIncome)
  const otherIncome = round2(row.otherIncome ?? incomeBreakdownObj.otherIncome ?? Math.max(0, totalIncome - cropSales))

  const expenseMap = {
    Seeds: round2(expenseSource.seeds ?? 0),
    Fertilizer: round2(expenseSource.fertilizer ?? 0),
    Pesticides: round2(expenseSource.pesticides ?? 0),
    Labour: round2(expenseSource.labour ?? 0),
    Diesel: round2(expenseSource.diesel ?? 0),
    Machinery: round2(expenseSource.machinery ?? 0),
    Transport: round2(expenseSource.transport ?? 0),
  }

  const rawExpenseItemsList = isExpenseArray
    ? rawExpenseBreakdown
    : (Array.isArray(expenseSource.items) ? expenseSource.items : [])

  const extraExpenseItems = rawExpenseItemsList.filter(
    (item) => item && !CANONICAL_EXPENSE_BUCKETS.includes(item.category) && parseAmount(item.amount) > 0
  )
  const otherExpense = round2(
    expenseSource.other ?? extraExpenseItems.reduce((sum, i) => sum + parseAmount(i.amount), 0)
  )

  const bucketSum = Object.values(expenseMap).reduce((s, v) => s + v, 0) + otherExpense
  const totalExpenses = round2(row.totalExpenses ?? row.expenses ?? bucketSum)

  const soldQuantityKg = parseAmount(row.soldQuantityKg ?? 0)
  const totalQuantityKg = parseAmount(row.totalQuantityKg ?? soldQuantityKg)

  const metrics = computeCropMetrics({
    totalIncome,
    cropSales,
    totalExpenses,
    areaAcres,
    soldQuantityKg,
    totalQuantityKg,
  })

  const expenseItems = [
    ...CANONICAL_EXPENSE_BUCKETS.map((category) => ({ category, amount: expenseMap[category] || 0 })),
    ...extraExpenseItems.map((i) => ({ category: i.category, amount: round2(i.amount) })),
  ]
  if (extraExpenseItems.length === 0 && otherExpense > 0) {
    expenseItems.push({ category: 'Other', amount: otherExpense })
  }

  const rawIncomeItemsList = isIncomeArray
    ? rawIncomeBreakdown
    : (Array.isArray(incomeBreakdownObj.items) ? incomeBreakdownObj.items : [])

  const incomeItems = rawIncomeItemsList.length > 0
    ? rawIncomeItemsList.map((i) => ({ category: i.category, amount: round2(i.amount) }))
    : [
        ...(cropSales > 0 ? [{ category: 'Crop Sales', amount: cropSales }] : []),
        ...(otherIncome > 0 ? [{ category: 'Other Income', amount: otherIncome }] : []),
      ]

  const counts = row.counts ?? {
    sales: row.salesCount ?? 0,
    income: row.incomeTransactionCount ?? 0,
    expenses: row.expenseTransactionCount ?? 0,
    labourLogs: row.labourAttendanceCount ?? 0,
  }

  return {
    id: row.cropId ?? row.id ?? `${cropName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`,
    crop: cropName,
    cropCode: row.cropCode ?? '',
    cropType: row.cropType ?? '',
    farms: Array.isArray(row.farms) ? row.farms : (row.farm ? [row.farm] : []),
    seasons: Array.isArray(row.seasons) ? row.seasons : (row.season ? [row.season] : []),
    ...metrics,
    incomeBreakdown: {
      cropSales,
      otherIncome,
      items: incomeItems,
    },
    expenseBreakdown: {
      seeds: expenseMap.Seeds,
      fertilizer: expenseMap.Fertilizer,
      pesticides: expenseMap.Pesticides,
      labour: expenseMap.Labour,
      diesel: expenseMap.Diesel,
      machinery: expenseMap.Machinery,
      transport: expenseMap.Transport,
      other: otherExpense,
      items: expenseItems,
    },
    counts,
  }
}

/**
 * Recomputes per-acre and per-kg metrics when user supplies or overrides Area (Acres) or Weight (Kg).
 */
export function applyMetricOverrides(cropRow, override = {}) {
  const areaAcres = override.areaAcres !== undefined && override.areaAcres !== ''
    ? parseAreaAcres(override.areaAcres)
    : cropRow.areaAcres
  const totalQuantityKg = override.totalQuantityKg !== undefined && override.totalQuantityKg !== ''
    ? parseAmount(override.totalQuantityKg)
    : cropRow.totalQuantityKg
  const soldQuantityKg = override.totalQuantityKg !== undefined && override.totalQuantityKg !== ''
    ? parseAmount(override.totalQuantityKg)
    : cropRow.soldQuantityKg

  const metrics = computeCropMetrics({
    totalIncome: cropRow.totalIncome,
    cropSales: cropRow.incomeBreakdown?.cropSales ?? cropRow.totalIncome,
    totalExpenses: cropRow.totalExpenses,
    areaAcres,
    soldQuantityKg,
    totalQuantityKg,
  })

  return {
    ...cropRow,
    ...metrics,
    hasOverride: (override.areaAcres !== undefined && override.areaAcres !== '') ||
      (override.totalQuantityKg !== undefined && override.totalQuantityKg !== ''),
  }
}

function normalizeCropKey(name) {
  return String(name ?? '').trim().toLowerCase()
}

function matchesDateRange(rawDate, fromDate, toDate) {
  if (!fromDate && !toDate) return true
  const iso = dateISO(rawDate)
  if (!iso) return false
  if (fromDate && iso < fromDate) return false
  if (toDate && iso > toDate) return false
  return true
}

function matchesTextFilter(value, filterValue) {
  if (!filterValue || filterValue === 'All') return true
  return String(value ?? '').toLowerCase().includes(String(filterValue).toLowerCase())
}

/**
 * Aggregates raw Sales, Income, Expenses, CropSeasons, Crops, and LabourAttendances
 * into Crop-wise Profit & Loss rows.
 */
export function buildCropPnlFromRecords(
  {
    sales = [],
    incomes = [],
    expenses = [],
    cropSeasons = [],
    crops = [],
    labourAttendances = [],
  } = {},
  filters = {}
) {
  const { fromDate = '', toDate = '', farm = 'All', season = 'All' } = filters
  const displayNames = new Map()
  const masterMap = new Map()

  const registerName = (rawName) => {
    const cleaned = String(rawName ?? '').trim()
    const key = normalizeCropKey(cleaned)
    if (key && !displayNames.has(key)) displayNames.set(key, cleaned)
    return key
  }

  for (const c of crops) {
    const name = c.cropName ?? c.CropName ?? c.crop ?? c.name
    const key = registerName(name)
    if (key) masterMap.set(key, c)
  }
  for (const cs of cropSeasons) registerName(cs.cropName ?? cs.crop ?? cs.Crop?.CropName)
  for (const s of sales) registerName(s.crop ?? s.Crop)
  for (const i of incomes) registerName(i.crop ?? i.Crop)
  for (const e of expenses) registerName(e.crop ?? e.Crop)
  for (const l of labourAttendances) registerName(l.cropName ?? l.CropName ?? l.crop)

  const rows = []
  for (const [key, displayName] of displayNames.entries()) {
    const master = masterMap.get(key)
    const matchedSeasons = cropSeasons.filter((cs) => {
      const cKey = normalizeCropKey(cs.cropName ?? cs.crop ?? cs.Crop?.CropName)
      if (cKey !== key) return false
      const csFarm = cs.farmName ?? cs.farm ?? cs.Farm?.FarmName ?? ''
      const csSeason = cs.season ?? cs.seasonName ?? cs.SeasonName ?? ''
      return matchesTextFilter(csFarm, farm) && matchesTextFilter(csSeason, season)
    })

    const matchedSales = sales.filter((s) => {
      const cKey = normalizeCropKey(s.crop ?? s.Crop)
      if (cKey !== key) return false
      const sDate = s.salesDate ?? s.SalesDate ?? s['Sales Date'] ?? s.Date
      const sFarm = s.farm ?? s.Farm ?? ''
      return matchesDateRange(sDate, fromDate, toDate) && matchesTextFilter(sFarm, farm)
    })

    const matchedIncomes = incomes.filter((i) => {
      const status = String(i.status ?? i.Status ?? '').toLowerCase()
      if (status === 'cancelled' || status === 'canceled') return false
      const cKey = normalizeCropKey(i.crop ?? i.Crop)
      if (cKey !== key) return false
      const iDate = i.incomeDate ?? i.IncomeDate ?? i['Income Date'] ?? i.Date
      const iFarm = i.farm ?? i.Farm ?? ''
      const iSeason = i.season ?? i.remarks ?? i.Remarks ?? ''
      return (
        matchesDateRange(iDate, fromDate, toDate) &&
        matchesTextFilter(iFarm, farm) &&
        matchesTextFilter(iSeason, season)
      )
    })

    const matchedExpenses = expenses.filter((e) => {
      const status = String(e.status ?? e.Status ?? '').toLowerCase()
      if (status === 'cancelled' || status === 'canceled') return false
      const cKey = normalizeCropKey(e.crop ?? e.Crop)
      if (cKey !== key) return false
      const eDate = e.expenseDate ?? e.ExpenseDate ?? e['Expense Date'] ?? e.Date
      const eFarm = e.farm ?? e.Farm ?? ''
      const eSeason = e.season ?? e.remarks ?? e.Remarks ?? ''
      return (
        matchesDateRange(eDate, fromDate, toDate) &&
        matchesTextFilter(eFarm, farm) &&
        matchesTextFilter(eSeason, season)
      )
    })

    const matchedLabour = labourAttendances.filter((l) => {
      const cKey = normalizeCropKey(l.cropName ?? l.CropName ?? l.crop)
      if (cKey !== key) return false
      const lDate = l.attendanceDate ?? l.AttendanceDate ?? l.date
      const lFarm = l.farmName ?? l.FarmName ?? l.farm ?? ''
      return matchesDateRange(lDate, fromDate, toDate) && matchesTextFilter(lFarm, farm)
    })

    if (
      matchedSeasons.length === 0 &&
      matchedSales.length === 0 &&
      matchedIncomes.length === 0 &&
      matchedExpenses.length === 0 &&
      matchedLabour.length === 0
    ) {
      continue
    }

    let areaAcres = matchedSeasons.reduce(
      (sum, cs) => sum + parseAreaAcres(cs.areaAcres ?? cs.AreaAcres ?? cs.area),
      0
    )
    if (areaAcres === 0 && master) {
      areaAcres = parseAreaAcres(master.cultivatedArea ?? master.areaAcres ?? master.area)
    }

    const farmsSet = new Set(
      [
        ...matchedSeasons.map((cs) => cs.farmName ?? cs.farm ?? cs.Farm?.FarmName),
        ...matchedSales.map((s) => s.farm ?? s.Farm),
        ...matchedIncomes.map((i) => i.farm ?? i.Farm),
        ...matchedExpenses.map((e) => e.farm ?? e.Farm),
      ]
        .map((v) => String(v ?? '').trim())
        .filter(Boolean)
    )
    const seasonsSet = new Set(
      matchedSeasons
        .map((cs) => String(cs.season ?? cs.seasonName ?? cs.SeasonName ?? '').trim())
        .filter(Boolean)
    )

    // Income breakdown
    const incomeByCat = new Map()
    const salesTotal = matchedSales.reduce(
      (sum, s) => sum + parseAmount(s.netAmount ?? s.NetAmount ?? s['Net Amount'] ?? s.amount ?? s.Amount),
      0
    )
    if (salesTotal > 0) incomeByCat.set('Crop Sales', salesTotal)

    let incomeSoldKg = 0
    for (const inc of matchedIncomes) {
      const cat = String(inc.incomeType ?? inc['Income Type'] ?? inc.categoryName ?? 'Crop Sales').trim() || 'Crop Sales'
      const amt = parseAmount(inc.netAmount ?? inc['Net Amount'] ?? inc.amount ?? inc.Amount)
      incomeByCat.set(cat, (incomeByCat.get(cat) || 0) + amt)

      if (Array.isArray(inc.items)) {
        for (const item of inc.items) {
          incomeSoldKg += toKg(item.quantity ?? item.Quantity, item.unit ?? item.Unit)
        }
      } else if (inc.quantity && inc.unit) {
        incomeSoldKg += toKg(inc.quantity, inc.unit)
      }
    }

    let cropSalesTotal = 0
    let totalIncome = 0
    for (const [cat, amt] of incomeByCat.entries()) {
      totalIncome += amt
      if (cat.toLowerCase().includes('crop') || cat.toLowerCase().includes('sale')) {
        cropSalesTotal += amt
      }
    }
    const otherIncomeTotal = round2(totalIncome - cropSalesTotal)

    // Expense breakdown
    const buckets = {
      Seeds: 0,
      Fertilizer: 0,
      Pesticides: 0,
      Labour: 0,
      Diesel: 0,
      Machinery: 0,
      Transport: 0,
    }
    const extraBuckets = new Map()

    for (const exp of matchedExpenses) {
      const cat = exp.expenseCategory ?? exp['Expense Category'] ?? exp.category ?? ''
      const desc = exp.description ?? exp.Description ?? ''
      const amt = parseAmount(exp.amount ?? exp.Amount)
      const mapped = mapExpenseCategory(cat, desc)
      if (Object.prototype.hasOwnProperty.call(buckets, mapped)) {
        buckets[mapped] += amt
      } else {
        extraBuckets.set(mapped, (extraBuckets.get(mapped) || 0) + amt)
      }
    }

    if (buckets.Labour === 0 && matchedLabour.length > 0) {
      buckets.Labour = matchedLabour.reduce(
        (sum, l) => sum + parseAmount(l.amount ?? l.Amount ?? l.calculatedAmount ?? l.CalculatedAmount),
        0
      )
    }

    const otherExpenseTotal = [...extraBuckets.values()].reduce((s, v) => s + v, 0)
    const totalExpenses = Object.values(buckets).reduce((s, v) => s + v, 0) + otherExpenseTotal

    // Sold & Yield Kg
    const salesKg = matchedSales.reduce(
      (sum, s) => sum + toKg(s.quantity ?? s.Quantity, s.unit ?? s.Unit),
      0
    )
    const soldQuantityKg = salesKg + incomeSoldKg
    const yieldQuantityKg = matchedSeasons.reduce((sum, cs) => {
      const { quantity, unit } = parseQuantityWithUnit(
        cs.actualYield ?? cs.ActualYield ?? cs.expectedYield ?? cs.ExpectedYield,
        master?.defaultUnit ?? 'Quintals'
      )
      return sum + toKg(quantity, unit)
    }, 0)

    const metrics = computeCropMetrics({
      totalIncome,
      cropSales: cropSalesTotal,
      totalExpenses,
      areaAcres,
      soldQuantityKg,
      totalQuantityKg: yieldQuantityKg,
    })

    const expenseItems = [
      ...CANONICAL_EXPENSE_BUCKETS.map((cat) => ({ category: cat, amount: round2(buckets[cat]) })),
      ...[...extraBuckets.entries()].map(([cat, amt]) => ({ category: cat, amount: round2(amt) })),
    ]

    const incomeItems = [...incomeByCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({ category, amount: round2(amount) }))

    rows.push({
      id: key.replace(/[^a-z0-9]+/g, '-'),
      crop: displayName,
      cropCode: master?.cropCode ?? master?.CropCode ?? '',
      cropType: master?.cropType ?? master?.CropType ?? '',
      farms: [...farmsSet],
      seasons: [...seasonsSet],
      ...metrics,
      incomeBreakdown: {
        cropSales: round2(cropSalesTotal),
        otherIncome: otherIncomeTotal,
        items: incomeItems,
      },
      expenseBreakdown: {
        seeds: round2(buckets.Seeds),
        fertilizer: round2(buckets.Fertilizer),
        pesticides: round2(buckets.Pesticides),
        labour: round2(buckets.Labour),
        diesel: round2(buckets.Diesel),
        machinery: round2(buckets.Machinery),
        transport: round2(buckets.Transport),
        other: round2(otherExpenseTotal),
        items: expenseItems,
      },
      counts: {
        sales: matchedSales.length,
        income: matchedIncomes.length,
        expenses: matchedExpenses.length,
        labourLogs: matchedLabour.length,
      },
    })
  }

  return rows.sort((a, b) => b.netProfit - a.netProfit)
}

/**
 * Core AgriMan Benchmark Dataset (starting with the canonical Cotton 10 Acres example).
 */
export const BENCHMARK_CROP_PNL_RECORDS = [
  normalizeApiCropPnlRow({
    id: 'cotton-benchmark',
    crop: 'Cotton',
    cropCode: 'CRP-005',
    cropType: 'Commercial',
    areaAcres: 10,
    farms: ['Farm 1 (South Block)'],
    seasons: ['Kharif 2025-26'],
    totalIncome: 850000,
    totalExpenses: 256000,
    soldQuantityKg: 11800,
    totalQuantityKg: 11800,
    incomeBreakdown: {
      cropSales: 850000,
      otherIncome: 0,
      items: [{ category: 'Crop Sales', amount: 850000 }],
    },
    expenseBreakdown: {
      seeds: 25000,
      fertilizer: 45000,
      pesticides: 38000,
      labour: 85000,
      diesel: 25000,
      machinery: 20000,
      transport: 18000,
      other: 0,
    },
    counts: { sales: 3, income: 1, expenses: 7, labourLogs: 12 },
  }),
  normalizeApiCropPnlRow({
    id: 'chilli-benchmark',
    crop: 'Chilli',
    cropCode: 'CRP-003',
    cropType: 'Spice / Cash',
    areaAcres: 8,
    farms: ['Sunrise Farms (East Block)'],
    seasons: ['Annual 2025'],
    totalIncome: 729000,
    totalExpenses: 248000,
    soldQuantityKg: 4500,
    totalQuantityKg: 4500,
    incomeBreakdown: {
      cropSales: 729000,
      otherIncome: 0,
      items: [{ category: 'Crop Sales', amount: 729000 }],
    },
    expenseBreakdown: {
      seeds: 28000,
      fertilizer: 42000,
      pesticides: 52000,
      labour: 76000,
      diesel: 18000,
      machinery: 17000,
      transport: 15000,
      other: 0,
    },
    counts: { sales: 2, income: 0, expenses: 6, labourLogs: 9 },
  }),
  normalizeApiCropPnlRow({
    id: 'paddy-benchmark',
    crop: 'Paddy (Rice)',
    cropCode: 'CRP-001',
    cropType: 'Cereal',
    areaAcres: 12,
    farms: ['Farm 2 (Canal Belt)'],
    seasons: ['Kharif 2025-26'],
    totalIncome: 465000,
    totalExpenses: 198000,
    soldQuantityKg: 21000,
    totalQuantityKg: 21000,
    incomeBreakdown: {
      cropSales: 450000,
      otherIncome: 15000,
      items: [
        { category: 'Crop Sales', amount: 450000 },
        { category: 'Agricultural By-product Sales', amount: 15000 },
      ],
    },
    expenseBreakdown: {
      seeds: 18000,
      fertilizer: 39000,
      pesticides: 22000,
      labour: 64000,
      diesel: 21000,
      machinery: 22000,
      transport: 12000,
      other: 0,
    },
    counts: { sales: 2, income: 1, expenses: 8, labourLogs: 14 },
  }),
  normalizeApiCropPnlRow({
    id: 'maize-benchmark',
    crop: 'Maize',
    cropCode: 'CRP-004',
    cropType: 'Cereal',
    areaAcres: 5,
    farms: ['North Field Farm'],
    seasons: ['Kharif 2025-26'],
    totalIncome: 172000,
    totalExpenses: 76500,
    soldQuantityKg: 8000,
    totalQuantityKg: 8000,
    incomeBreakdown: {
      cropSales: 172000,
      otherIncome: 0,
      items: [{ category: 'Crop Sales', amount: 172000 }],
    },
    expenseBreakdown: {
      seeds: 9500,
      fertilizer: 16500,
      pesticides: 9000,
      labour: 21000,
      diesel: 7500,
      machinery: 8000,
      transport: 5000,
      other: 0,
    },
    counts: { sales: 1, income: 0, expenses: 5, labourLogs: 5 },
  }),
]
