export function buildReport(records) {
  const income = records.filter((record) => record.status !== 'Cancelled')
  const columns = ['Date', 'Income No', 'Farmer', 'Farm', 'Crop', 'Income Type', 'Net Amount', 'Payment Mode']
  const rows = income.map((record) => ({
    Date: record.incomeDate,
    'Income No': record.incomeNo,
    Farmer: record.farmer,
    Farm: record.farm,
    Crop: record.crop,
    'Income Type': record.incomeType,
    'Net Amount': record.netAmount ?? record.amount,
    'Payment Mode': record.paymentMode,
  }))
  const totalIncome = income.filter((record) => record.status === 'Received')
    .reduce((sum, record) => sum + Number(record.netAmount ?? record.amount ?? 0), 0)
  return { columns, rows, totalIncome }
}
