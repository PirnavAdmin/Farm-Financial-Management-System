import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyMetricOverrides,
  BENCHMARK_CROP_PNL_RECORDS,
  buildCropPnlFromRecords,
  computeCropMetrics,
  mapExpenseCategory,
  normalizeApiCropPnlRow,
  toKg,
} from '../src/Reports/Crop Profit/cropProfitData.js'

test('Cotton 10 Acres canonical Crop-wise Profit & Loss matches exact AgriMan formulas', () => {
  const result = buildCropPnlFromRecords({
    cropSeasons: [
      {
        crop: 'Cotton',
        farm: 'Farm 1 (South Block)',
        season: 'Kharif 2025-26',
        area: '10 Acres',
        actualYield: '118 Quintals',
      },
    ],
    sales: [
      {
        salesNo: 'SAL-COT-001',
        salesDate: '2026-11-15',
        farm: 'Farm 1 (South Block)',
        crop: 'Cotton',
        quantity: 118,
        unit: 'Quintals',
        netAmount: 850000,
      },
    ],
    expenses: [
      { expenseDate: '2026-06-15', farm: 'Farm 1 (South Block)', crop: 'Cotton', expenseCategory: 'Seeds', amount: 25000, status: 'Paid' },
      { expenseDate: '2026-07-05', farm: 'Farm 1 (South Block)', crop: 'Cotton', expenseCategory: 'Fertilizers', amount: 45000, status: 'Paid' },
      { expenseDate: '2026-08-10', farm: 'Farm 1 (South Block)', crop: 'Cotton', expenseCategory: 'Pesticides', amount: 38000, status: 'Paid' },
      { expenseDate: '2026-09-12', farm: 'Farm 1 (South Block)', crop: 'Cotton', expenseCategory: 'Labour', amount: 85000, status: 'Paid' },
      { expenseDate: '2026-09-20', farm: 'Farm 1 (South Block)', crop: 'Cotton', expenseCategory: 'Fuel & Diesel', amount: 25000, status: 'Paid' },
      { expenseDate: '2026-10-02', farm: 'Farm 1 (South Block)', crop: 'Cotton', expenseCategory: 'Machinery Rental', amount: 20000, status: 'Paid' },
      { expenseDate: '2026-11-15', farm: 'Farm 1 (South Block)', crop: 'Cotton', expenseCategory: 'Transportation', amount: 18000, status: 'Paid' },
    ],
  })

  assert.equal(result.length, 1)
  const cotton = result[0]
  assert.equal(cotton.crop, 'Cotton')
  assert.equal(cotton.areaAcres, 10)
  assert.equal(cotton.incomeBreakdown.cropSales, 850000)
  assert.equal(cotton.totalIncome, 850000)

  assert.equal(cotton.expenseBreakdown.seeds, 25000)
  assert.equal(cotton.expenseBreakdown.fertilizer, 45000)
  assert.equal(cotton.expenseBreakdown.pesticides, 38000)
  assert.equal(cotton.expenseBreakdown.labour, 85000)
  assert.equal(cotton.expenseBreakdown.diesel, 25000)
  assert.equal(cotton.expenseBreakdown.machinery, 20000)
  assert.equal(cotton.expenseBreakdown.transport, 18000)
  assert.equal(cotton.totalExpenses, 256000)

  assert.equal(cotton.netProfit, 594000)
  assert.equal(cotton.costPerAcre, 25600)
  assert.equal(cotton.incomePerAcre, 85000)
  assert.equal(cotton.profitPerAcre, 59400)
  assert.equal(cotton.totalQuantityKg, 11800)
  assert.equal(cotton.costPerKg, 21.69)
  assert.equal(cotton.sellingPricePerKg, 72.03)
  assert.equal(cotton.roiPercent, 232.03)
})

test('BENCHMARK_CROP_PNL_RECORDS Cotton entry matches prompt numbers', () => {
  const cotton = BENCHMARK_CROP_PNL_RECORDS.find((r) => r.crop === 'Cotton')
  assert.ok(cotton)
  assert.equal(cotton.areaAcres, 10)
  assert.equal(cotton.totalIncome, 850000)
  assert.equal(cotton.totalExpenses, 256000)
  assert.equal(cotton.netProfit, 594000)
  assert.equal(cotton.costPerAcre, 25600)
  assert.equal(cotton.incomePerAcre, 85000)
  assert.equal(cotton.profitPerAcre, 59400)
  assert.equal(cotton.roiPercent, 232.03)
})

test('toKg converts kg, quintals, tonnes, grams, and bags accurately', () => {
  assert.equal(toKg(500, 'kg'), 500)
  assert.equal(toKg(12, 'Quintals'), 1200)
  assert.equal(toKg(2.5, 'Tonnes'), 2500)
  assert.equal(toKg(5000, 'grams'), 5)
  assert.equal(toKg(10, 'bags'), 500)
  assert.equal(toKg(10, 'boxes'), 0)
})

test('mapExpenseCategory maps agricultural expense labels into canonical buckets', () => {
  assert.equal(mapExpenseCategory('Seeds & Seedlings'), 'Seeds')
  assert.equal(mapExpenseCategory('Fertilizers', 'Urea and DAP'), 'Fertilizer')
  assert.equal(mapExpenseCategory('Pesticides & Crop Protection'), 'Pesticides')
  assert.equal(mapExpenseCategory('Labour Wages'), 'Labour')
  assert.equal(mapExpenseCategory('Fuel & Electricity', 'Tractor Diesel'), 'Diesel')
  assert.equal(mapExpenseCategory('Machinery & Equipment Rental'), 'Machinery')
  assert.equal(mapExpenseCategory('Transportation'), 'Transport')
  assert.equal(mapExpenseCategory('Irrigation & Water'), 'Irrigation & Water')
})

test('cancelled records are excluded and LabourAttendance fallback avoids double counting', () => {
  const rows = buildCropPnlFromRecords({
    sales: [{ crop: 'Paddy', salesDate: '2026-10-20', quantity: 50, unit: 'Quintals', netAmount: 110000 }],
    incomes: [
      { crop: 'Paddy', incomeDate: '2026-10-21', incomeType: 'Government Subsidy', netAmount: 10000, status: 'Received' },
      { crop: 'Paddy', incomeDate: '2026-10-22', incomeType: 'Crop Sales', netAmount: 50000, status: 'Cancelled' },
    ],
    expenses: [
      { crop: 'Paddy', expenseDate: '2026-08-01', expenseCategory: 'Seeds', amount: 12000, status: 'Paid' },
      { crop: 'Paddy', expenseDate: '2026-08-02', expenseCategory: 'Seeds', amount: 99999, status: 'Cancelled' },
    ],
    labourAttendances: [
      { cropName: 'Paddy', attendanceDate: '2026-08-15', amount: 18000 },
    ],
  })

  assert.equal(rows.length, 1)
  assert.equal(rows[0].totalIncome, 120000)
  assert.equal(rows[0].expenseBreakdown.seeds, 12000)
  assert.equal(rows[0].expenseBreakdown.labour, 18000)
  assert.equal(rows[0].totalExpenses, 30000)
  assert.equal(rows[0].netProfit, 90000)
  assert.equal(rows[0].roiPercent, 300)
})

test('applyMetricOverrides and normalizeApiCropPnlRow handle overrides and API shape cleanly', () => {
  const normalized = normalizeApiCropPnlRow({
    crop: 'Cotton',
    areaAcres: 0,
    totalIncome: 850000,
    totalExpenses: 256000,
    soldQuantityKg: 0,
    expenseBreakdown: {
      seeds: 25000,
      fertilizer: 45000,
      pesticides: 38000,
      labour: 85000,
      diesel: 25000,
      machinery: 20000,
      transport: 18000,
    },
  })

  assert.equal(normalized.costPerAcre, null)
  assert.equal(normalized.costPerKg, null)
  assert.equal(normalized.roiPercent, 232.03)

  const overridden = applyMetricOverrides(normalized, { areaAcres: '10', totalQuantityKg: '10000' })
  assert.equal(overridden.costPerAcre, 25600)
  assert.equal(overridden.incomePerAcre, 85000)
  assert.equal(overridden.profitPerAcre, 59400)
  assert.equal(overridden.costPerKg, 25.6)
  assert.equal(overridden.sellingPricePerKg, 85)
})

test('computeCropMetrics handles negative net profit (loss) safely', () => {
  const m = computeCropMetrics({
    totalIncome: 100000,
    cropSales: 100000,
    totalExpenses: 125000,
    areaAcres: 5,
    soldQuantityKg: 2000,
  })
  assert.equal(m.netProfit, -25000)
  assert.equal(m.profitPerAcre, -5000)
  assert.equal(m.roiPercent, -20)
})

test('normalizeApiCropPnlRow handles /api/crop-profitability CropProfitabilityItemDto shape', () => {
  const normalized = normalizeApiCropPnlRow({
    cropId: 1005,
    crop: 'Cotton',
    cropCode: 'CRP-005',
    cropType: 'Commercial',
    areaAcres: 10,
    cropSales: 850000,
    otherIncome: 0,
    totalIncome: 850000,
    incomeBreakdown: [{ category: 'Crop Sales', amount: 850000, recordCount: 2 }],
    expensesByCategory: {
      seeds: 25000,
      fertilizer: 45000,
      pesticides: 38000,
      labour: 85000,
      diesel: 25000,
      machinery: 20000,
      transport: 18000,
      other: 0,
    },
    expenseBreakdown: [
      { category: 'Seeds', amount: 25000, recordCount: 1 },
      { category: 'Fertilizer', amount: 45000, recordCount: 1 },
      { category: 'Pesticides', amount: 38000, recordCount: 1 },
      { category: 'Labour', amount: 85000, recordCount: 1 },
      { category: 'Diesel', amount: 25000, recordCount: 1 },
      { category: 'Machinery', amount: 20000, recordCount: 1 },
      { category: 'Transport', amount: 18000, recordCount: 1 },
    ],
    totalExpenses: 256000,
    netProfit: 594000,
    soldQuantityKg: 11800,
    salesCount: 2,
    incomeTransactionCount: 0,
    expenseTransactionCount: 7,
    labourAttendanceCount: 0,
  })

  assert.equal(normalized.crop, 'Cotton')
  assert.equal(normalized.areaAcres, 10)
  assert.equal(normalized.totalIncome, 850000)
  assert.equal(normalized.totalExpenses, 256000)
  assert.equal(normalized.netProfit, 594000)
  assert.equal(normalized.costPerAcre, 25600)
  assert.equal(normalized.incomePerAcre, 85000)
  assert.equal(normalized.profitPerAcre, 59400)
  assert.equal(normalized.roiPercent, 232.03)
  assert.equal(normalized.expenseBreakdown.seeds, 25000)
  assert.equal(normalized.expenseBreakdown.transport, 18000)
  assert.equal(normalized.counts.expenses, 7)
})
