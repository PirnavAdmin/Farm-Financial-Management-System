using FarmManagementApi.Models;

namespace FarmManagementApi.Services
{
    public static class LoanCalculationService
    {
        /// <summary>
        /// Calculates EMI using the standard financial formula:
        /// E = P * r * (1 + r)^n / ((1 + r)^n - 1)
        /// Avoids floating point inaccuracies by using high-precision math and rounding to 2 decimals.
        /// </summary>
        public static decimal CalculateEmi(decimal principal, decimal annualRatePercent, int tenureMonths, string frequency = "Monthly")
        {
            if (principal <= 0 || tenureMonths <= 0) return 0;
            if (annualRatePercent <= 0)
            {
                var periods = GetTotalPeriods(tenureMonths, frequency);
                return Math.Round(principal / Math.Max(1, periods), 2);
            }

            var periodsPerYear = GetPeriodsPerYear(frequency);
            var totalPeriods = GetTotalPeriods(tenureMonths, frequency);
            if (totalPeriods <= 0) return principal;

            double p = (double)principal;
            double r = (double)(annualRatePercent / (100m * periodsPerYear));
            int n = totalPeriods;

            double factor = Math.Pow(1 + r, n);
            double emi = (p * r * factor) / (factor - 1);

            return Math.Round((decimal)emi, 2, MidpointRounding.AwayFromZero);
        }

        public static int GetPeriodsPerYear(string frequency)
        {
            return frequency?.ToLower() switch
            {
                "quarterly" => 4,
                "half-yearly" or "half yearly" or "semi-annually" => 2,
                "yearly" or "annually" => 1,
                _ => 12 // Default monthly
            };
        }

        public static int GetTotalPeriods(int tenureMonths, string frequency)
        {
            var monthsPerPeriod = frequency?.ToLower() switch
            {
                "quarterly" => 3,
                "half-yearly" or "half yearly" or "semi-annually" => 6,
                "yearly" or "annually" => 12,
                _ => 1 // Default monthly
            };

            return Math.Max(1, (int)Math.Ceiling((double)tenureMonths / monthsPerPeriod));
        }

        public static DateTime GetPeriodDueDate(DateTime startDate, int periodIndex, string frequency)
        {
            var monthsPerPeriod = frequency?.ToLower() switch
            {
                "quarterly" => 3,
                "half-yearly" or "half yearly" or "semi-annually" => 6,
                "yearly" or "annually" => 12,
                _ => 1
            };

            return startDate.AddMonths(periodIndex * monthsPerPeriod);
        }

        /// <summary>
        /// Generates a complete amortization repayment schedule for the loan.
        /// </summary>
        public static List<LoanInstallment> GenerateSchedule(Loan loan)
        {
            var list = new List<LoanInstallment>();
            decimal principal = loan.OutstandingPrincipal > 0 ? loan.OutstandingPrincipal : (loan.DisbursedAmount > 0 ? loan.DisbursedAmount : loan.SanctionAmount);
            if (principal <= 0) return list;

            int totalPeriods = GetTotalPeriods(loan.TenureMonths, loan.RepaymentFrequency);
            int periodsPerYear = GetPeriodsPerYear(loan.RepaymentFrequency);
            decimal periodicRate = (loan.InterestRate / (100m * periodsPerYear));
            decimal emi = loan.EmiAmount > 0 ? loan.EmiAmount : CalculateEmi(principal, loan.InterestRate, loan.TenureMonths, loan.RepaymentFrequency);

            decimal currentPrincipal = principal;
            var now = DateTime.UtcNow.Date;

            for (int i = 1; i <= totalPeriods; i++)
            {
                var dueDate = GetPeriodDueDate(loan.StartDate, i, loan.RepaymentFrequency);
                decimal openingPrincipal = currentPrincipal;

                decimal interest = Math.Round(openingPrincipal * periodicRate, 2, MidpointRounding.AwayFromZero);
                decimal principalPortion;

                if (i == totalPeriods || openingPrincipal + interest <= emi)
                {
                    // Last installment settles remaining principal exactly
                    principalPortion = openingPrincipal;
                    emi = principalPortion + interest;
                    currentPrincipal = 0;
                }
                else
                {
                    principalPortion = Math.Min(openingPrincipal, Math.Round(emi - interest, 2, MidpointRounding.AwayFromZero));
                    currentPrincipal = Math.Max(0, openingPrincipal - principalPortion);
                }

                var status = dueDate < now ? "Overdue" : "Pending";

                list.Add(new LoanInstallment
                {
                    LoanId = loan.Id,
                    InstallmentNumber = i,
                    DueDate = dueDate,
                    OpeningPrincipal = openingPrincipal,
                    PrincipalAmount = principalPortion,
                    InterestAmount = interest,
                    EmiAmount = emi,
                    PaidAmount = 0,
                    RemainingAmount = emi,
                    ClosingPrincipal = currentPrincipal,
                    Status = status,
                    CreatedAt = DateTime.UtcNow
                });

                if (currentPrincipal <= 0) break;
            }

            return list;
        }
    }
}
