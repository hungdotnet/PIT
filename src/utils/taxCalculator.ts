export const PERSONAL_DEDUCTION = 11000000
export const DEPENDENT_DEDUCTION = 4400000

export const TAX_BRACKETS = [
  { limit: 5000000, rate: 0.05, subtract: 0 },
  { limit: 10000000, rate: 0.10, subtract: 250000 },
  { limit: 18000000, rate: 0.15, subtract: 750000 },
  { limit: 32000000, rate: 0.20, subtract: 1650000 },
  { limit: 52000000, rate: 0.25, subtract: 3250000 },
  { limit: 80000000, rate: 0.30, subtract: 5850000 },
  { limit: Infinity, rate: 0.35, subtract: 9850000 },
]

export function calculatePIT(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  
  if (taxableIncome <= 5000000) return taxableIncome * 0.05
  if (taxableIncome <= 10000000) return taxableIncome * 0.10 - 250000
  if (taxableIncome <= 18000000) return taxableIncome * 0.15 - 750000
  if (taxableIncome <= 32000000) return taxableIncome * 0.20 - 1650000
  if (taxableIncome <= 52000000) return taxableIncome * 0.25 - 3250000
  if (taxableIncome <= 80000000) return taxableIncome * 0.30 - 5850000
  return taxableIncome * 0.35 - 9850000
}

export function isDependentActive(dep: any, monthYear: string) {
  if (dep.khong_su_dung) return false
  
  // Format MM/YYYY
  const [targetMonth, targetYear] = monthYear.split('/').map(Number)
  const [startMonth, startYear] = dep.tu_thang.split('/').map(Number)
  
  const targetDate = new Date(targetYear, targetMonth - 1)
  const startDate = new Date(startYear, startMonth - 1)
  
  if (targetDate < startDate) return false
  
  if (dep.den_thang) {
    const [endMonth, endYear] = dep.den_thang.split('/').map(Number)
    const endDate = new Date(endYear, endMonth - 1)
    if (targetDate > endDate) return false
  }
  
  return true
}
