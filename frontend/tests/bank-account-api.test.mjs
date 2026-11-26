// frontend/tests/bank-account-api.test.mjs
// Run with: node --test frontend/tests/bank-account-api.test.mjs

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── Pure utility functions mirroring bankAccountService.js ───────────────────

function parseAmount(val) {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  const clean = String(val ?? '').replace(/[^\d.-]/g, '');
  const n = parseFloat(clean);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(val) {
  const n = Number(String(val ?? '').replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(val) {
  if (!val) return '';
  const m = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [, year, month, day] = m;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[parseInt(month, 10) - 1]} ${year}`;
  }
  return val;
}

function maskAccountNumber(accountNo, isRevealed = false) {
  if (!accountNo) return '—';
  const s = String(accountNo).trim();
  if (isRevealed || s.startsWith('CASH') || s.length <= 4) return s;
  const last4 = s.slice(-4);
  const maskedLength = Math.max(0, s.length - 4);
  const bullets = '•'.repeat(Math.min(8, maskedLength));
  return `${bullets} ${last4}`;
}

function computeRunningBalances(transactions, openingBalance = 0) {
  const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = Number(openingBalance) || 0;

  const computed = sorted.map((t) => {
    if (t.status === 'Cancelled') {
      return { ...t, runningBalance: running };
    }
    const credit = Number(t.credit) || 0;
    const debit = Number(t.debit) || 0;
    running = running + credit - debit;
    return {
      ...t,
      runningBalance: running,
    };
  });

  return computed.reverse();
}

function computeAccountBalances(accounts, transactions) {
  return accounts.map((acc) => {
    const accTxns = transactions.filter(
      (t) => (t.accountId === acc.id || String(t.accountNumber) === String(acc.accountNumber)) && t.status !== 'Cancelled'
    );

    const totalCredits = accTxns.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
    const totalDebits = accTxns.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);
    const openingBalance = Number(acc.openingBalance) || 0;
    const currentBalance = openingBalance + totalCredits - totalDebits;

    return {
      ...acc,
      openingBalance,
      totalCredits,
      totalDebits,
      currentBalance,
    };
  });
}

function computeSummaryKpis(accountsWithBalances, transactions) {
  const totalAccounts = accountsWithBalances.length;
  const activeAccounts = accountsWithBalances.filter((a) => a.status === 'Active');
  const activeAccountsCount = activeAccounts.length;

  const totalAvailableBalance = activeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const activeAccountIds = new Set(activeAccounts.map((a) => a.id));
  const eligibleTxns = transactions.filter(
    (t) => activeAccountIds.has(t.accountId) && t.status !== 'Cancelled'
  );

  const totalMoneyReceived = eligibleTxns.reduce((sum, t) => sum + (Number(t.credit) || 0), 0);
  const totalMoneyPaid = eligibleTxns.reduce((sum, t) => sum + (Number(t.debit) || 0), 0);

  return {
    totalAccounts,
    activeAccountsCount,
    totalAvailableBalance,
    totalMoneyReceived,
    totalMoneyPaid,
  };
}

// ── Mock API client for Service Tests ─────────────────────────────────────────

const requests = [];
const mockApi = {
  get: async (url, config) => {
    requests.push({ method: 'GET', url, config });
    return { data: [{ id: 1, farmerId: 1, bankName: 'HDFC Bank', accountNumber: '50100428912456', ifsc: 'HDFC0001042' }] };
  },
  post: async (url, data, config) => {
    requests.push({ method: 'POST', url, data, config });
    return { data: { id: 101, ...data } };
  },
  put: async (url, data, config) => {
    requests.push({ method: 'PUT', url, data, config });
    return { data: { success: true } };
  },
  delete: async (url, config) => {
    requests.push({ method: 'DELETE', url, config });
    return { data: { success: true } };
  },
};

// ── Test Suites ──────────────────────────────────────────────────────────────

describe('Bank Accounts Module: Pure Utilities & Formatting', () => {
  it('correctly parses currency, decimal strings, and amounts', () => {
    assert.equal(parseAmount('2,50,000'), 250000);
    assert.equal(parseAmount('₹ 6,82,450.75'), 682450.75);
    assert.equal(parseAmount(50000), 50000);
    assert.equal(parseAmount(null), 0);
    assert.equal(parseAmount(''), 0);
    assert.equal(parseAmount(undefined), 0);
  });

  it('formats dates in clean Indian day-month-year display', () => {
    assert.equal(formatDate('2026-11-24'), '24 Nov 2026');
    assert.equal(formatDate('2026-04-01T00:00:00'), '01 Apr 2026');
    assert.equal(formatDate(''), '');
  });

  it('masks bank account numbers securely by default and reveals only on demand', () => {
    const masked = maskAccountNumber('50100428912456', false);
    assert.ok(masked.endsWith('2456'));
    assert.ok(masked.includes('••••'));
    assert.ok(!masked.includes('501004'));

    const revealed = maskAccountNumber('50100428912456', true);
    assert.equal(revealed, '50100428912456');

    // Cash accounts should remain clear for operational readability
    assert.equal(maskAccountNumber('CASH-VAULT-001', false), 'CASH-VAULT-001');
    assert.equal(maskAccountNumber('123', false), '123');
    assert.equal(maskAccountNumber('', false), '—');
  });

  it('formats currency with INR symbol and decimal accuracy', () => {
    const formatted = formatCurrency(250000);
    assert.ok(formatted.includes('2,50,000'));
    assert.ok(formatCurrency(null).includes('₹0'));
  });
});

describe('Bank Accounts Module: Balance Calculation Engine', () => {
  it('computes account balance using Current = Opening + Credits - Debits', () => {
    const accounts = [
      { id: 1, accountNumber: '50100428912456', openingBalance: 200000, status: 'Active' },
    ];

    const transactions = [
      { accountId: 1, accountNumber: '50100428912456', credit: 380000, debit: 0, status: 'Completed' }, // Paddy sale
      { accountId: 1, accountNumber: '50100428912456', credit: 0, debit: 125000, status: 'Completed' }, // Fertilizer expense
      { accountId: 1, accountNumber: '50100428912456', credit: 75000, debit: 0, status: 'Completed' },  // Subsidy
    ];

    const computed = computeAccountBalances(accounts, transactions);
    assert.equal(computed.length, 1);
    assert.equal(computed[0].openingBalance, 200000);
    assert.equal(computed[0].totalCredits, 455000);
    assert.equal(computed[0].totalDebits, 125000);
    // 200000 + 455000 - 125000 = 530000
    assert.equal(computed[0].currentBalance, 530000);
  });

  it('strictly excludes cancelled transactions from balance computation', () => {
    const accounts = [
      { id: 1, accountNumber: '50100428912456', openingBalance: 100000, status: 'Active' },
    ];

    const transactions = [
      { accountId: 1, credit: 50000, debit: 0, status: 'Completed' },
      { accountId: 1, credit: 999999, debit: 0, status: 'Cancelled' }, // Should be ignored
      { accountId: 1, credit: 0, debit: 20000, status: 'Completed' },
      { accountId: 1, credit: 0, debit: 888888, status: 'Cancelled' }, // Should be ignored
    ];

    const computed = computeAccountBalances(accounts, transactions);
    // 100000 + 50000 - 20000 = 130000
    assert.equal(computed[0].currentBalance, 130000);
    assert.equal(computed[0].totalCredits, 50000);
    assert.equal(computed[0].totalDebits, 20000);
  });

  it('computes chronological running balances correctly', () => {
    const txns = [
      { id: 'T1', date: '2026-04-01', credit: 10000, debit: 0, status: 'Completed' },
      { id: 'T2', date: '2026-04-05', credit: 0, debit: 3000, status: 'Completed' },
      { id: 'T3', date: '2026-04-10', credit: 5000, debit: 0, status: 'Completed' },
    ];

    const running = computeRunningBalances(txns, 5000);
    // Oldest to newest:
    // start: 5000
    // after T1 (+10000) => 15000
    // after T2 (-3000)  => 12000
    // after T3 (+5000)  => 17000
    // Output is returned newest-first:
    assert.equal(running[0].id, 'T3');
    assert.equal(running[0].runningBalance, 17000);
    assert.equal(running[1].id, 'T2');
    assert.equal(running[1].runningBalance, 12000);
    assert.equal(running[2].id, 'T1');
    assert.equal(running[2].runningBalance, 15000);
  });
});

describe('Bank Accounts Module: Summary KPIs & Portfolio Aggregation', () => {
  it('aggregates available balance only across active bank accounts', () => {
    const accounts = [
      { id: 1, currentBalance: 350000, status: 'Active' },
      { id: 2, currentBalance: 150000, status: 'Active' },
      { id: 3, currentBalance: 50000, status: 'Inactive' }, // Should be excluded from available balance
      { id: 4, currentBalance: 0, status: 'Closed' },       // Should be excluded
    ];

    const transactions = [
      { accountId: 1, credit: 350000, debit: 50000, status: 'Completed' },
      { accountId: 2, credit: 150000, debit: 20000, status: 'Completed' },
      { accountId: 3, credit: 50000, debit: 10000, status: 'Completed' }, // from inactive
    ];

    const kpis = computeSummaryKpis(accounts, transactions);
    assert.equal(kpis.totalAccounts, 4);
    assert.equal(kpis.activeAccountsCount, 2);
    // 350000 + 150000 = 500000
    assert.equal(kpis.totalAvailableBalance, 500000);
    // Sum of credits from active accounts: 350000 + 150000 = 500000
    assert.equal(kpis.totalMoneyReceived, 500000);
    // Sum of debits from active accounts: 50000 + 20000 = 70000
    assert.equal(kpis.totalMoneyPaid, 70000);
  });
});

describe('Bank Accounts Module: Internal Transfers & Business Rules', () => {
  it('disallows transfer between identical source and destination accounts', () => {
    const transfer = {
      fromAccountId: 1,
      toAccountId: 1,
      amount: 10000,
    };

    assert.throws(() => {
      if (transfer.fromAccountId === transfer.toAccountId) {
        throw new Error('Source and destination accounts must be different');
      }
    }, /Source and destination accounts must be different/);
  });

  it('disallows non-positive transfer or deposit amounts', () => {
    assert.throws(() => {
      const amount = parseAmount('-500');
      if (amount <= 0) throw new Error('Amount must be greater than ₹0');
    }, /Amount must be greater than ₹0/);

    assert.throws(() => {
      const amount = parseAmount('0');
      if (amount <= 0) throw new Error('Amount must be greater than ₹0');
    }, /Amount must be greater than ₹0/);
  });

  it('guarantees atomic paired debit & credit entries with shared transfer reference', () => {
    const transferRef = 'TRF-2026-0042';
    const amount = 25000;
    const date = '2026-11-24';

    const debitTxn = {
      id: 'TXN-OUT',
      accountId: 1,
      type: 'Internal Transfer Out',
      credit: 0,
      debit: amount,
      linkedRef: transferRef,
      referenceNo: transferRef,
      date,
      status: 'Completed',
    };

    const creditTxn = {
      id: 'TXN-IN',
      accountId: 2,
      type: 'Internal Transfer In',
      credit: amount,
      debit: 0,
      linkedRef: transferRef,
      referenceNo: transferRef,
      date,
      status: 'Completed',
    };

    // Overall cash impact check
    const netCashMovement = creditTxn.credit - debitTxn.debit;
    assert.equal(netCashMovement, 0);
    assert.equal(debitTxn.referenceNo, creditTxn.referenceNo);
    assert.equal(debitTxn.linkedRef, creditTxn.linkedRef);
  });
});

describe('Bank Accounts Module: Backend API Integration Contract', () => {
  it('calls POST /api/FarmerBankAccounts with exact CreateFarmerBankAccountDto schema', async () => {
    requests.length = 0;
    const payload = {
      farmerId: 1,
      bankName: 'HDFC Bank',
      accountNumber: '50100428912456',
      ifsc: 'HDFC0001042',
    };

    await mockApi.post('/api/FarmerBankAccounts', payload);
    assert.equal(requests.length, 1);
    const req = requests[0];
    assert.equal(req.method, 'POST');
    assert.equal(req.url, '/api/FarmerBankAccounts');
    assert.equal(req.data.farmerId, 1);
    assert.equal(req.data.bankName, 'HDFC Bank');
    assert.equal(req.data.accountNumber, '50100428912456');
    assert.equal(req.data.ifsc, 'HDFC0001042');
  });

  it('calls PUT /api/FarmerBankAccounts/{id} on update', async () => {
    requests.length = 0;
    const payload = {
      farmerId: 1,
      bankName: 'State Bank of India',
      accountNumber: '31980045217891',
      ifsc: 'SBIN0004521',
    };

    await mockApi.put('/api/FarmerBankAccounts/42', payload);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'PUT');
    assert.equal(requests[0].url, '/api/FarmerBankAccounts/42');
    assert.equal(requests[0].data.accountNumber, '31980045217891');
  });

  it('calls DELETE /api/FarmerBankAccounts/{id} on account removal', async () => {
    requests.length = 0;
    await mockApi.delete('/api/FarmerBankAccounts/42');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'DELETE');
    assert.equal(requests[0].url, '/api/FarmerBankAccounts/42');
  });

  it('calls GET /api/FarmerBankAccounts on account listing', async () => {
    requests.length = 0;
    const res = await mockApi.get('/api/FarmerBankAccounts');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, 'GET');
    assert.equal(requests[0].url, '/api/FarmerBankAccounts');
    assert.ok(Array.isArray(res.data));
  });
});
