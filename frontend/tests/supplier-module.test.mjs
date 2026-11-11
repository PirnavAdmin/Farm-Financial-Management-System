import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

console.log('Testing Supplier Management Module...');

// Mock localStorage for node environment
const storage = {};
globalThis.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); }
};

// Mock api client for testing
const apiRequests = [];
const mockApi = {
  get: async (url) => {
    apiRequests.push({ method: 'GET', url });
    throw new Error('Fallback to persistent local store in offline/test mode');
  },
  post: async (url, data) => {
    apiRequests.push({ method: 'POST', url, data });
    return { data };
  },
  put: async (url, data) => {
    apiRequests.push({ method: 'PUT', url, data });
    return { data };
  },
  delete: async (url) => {
    apiRequests.push({ method: 'DELETE', url });
    return { data: { success: true } };
  }
};
globalThis.__supplierTestApi = mockApi;

// Load supplierService dynamically with mocked API and Vite env
const rawSource = await readFile(new URL('../src/services/supplierService.js', import.meta.url), 'utf8');
const transformedSource = rawSource
  .replace("import api from './api.js';", 'const api = globalThis.__supplierTestApi;')
  .replace("import api from './api';", 'const api = globalThis.__supplierTestApi;')
  .replaceAll('import.meta.env', '({ DEV: true })');

const { supplierService } = await import(`data:text/javascript;base64,${Buffer.from(transformedSource).toString('base64')}`);

async function runTests() {
  // 1. Initial Suppliers list
  const initialSuppliers = await supplierService.getSuppliers();
  assert.ok(Array.isArray(initialSuppliers), 'Suppliers should be an array');
  assert.ok(initialSuppliers.length >= 9, 'Should contain seed suppliers');

  // Verify all required fields on every seed supplier
  const requiredFields = [
    'supplierCode',
    'supplierName',
    'supplierType',
    'mobile',
    'address',
    'gstin',
    'bankName',
    'accountNumber',
    'ifscCode',
    'openingBalance',
    'status'
  ];

  initialSuppliers.forEach((s) => {
    requiredFields.forEach((field) => {
      assert.ok(field in s, `Supplier ${s.supplierName} missing field ${field}`);
    });
  });
  console.log('✔ All required supplier fields verified');

  // 2. Create a new supplier
  const newSupplierData = {
    supplierName: 'Kaveri Seed Company Ltd',
    supplierType: 'Seeds',
    mobile: '9849999888',
    email: 'info@kaveriseeds.in',
    address: '513B Minerva Complex, SD Road',
    city: 'Secunderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    pinCode: '500003',
    gstin: '36AAACK0123F1Z1',
    bankName: 'HDFC Bank',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0000038',
    branchName: 'SD Road',
    openingBalance: 10000,
    status: 'Active',
    notes: 'Hybrid maize and sunflower seeds'
  };

  const created = await supplierService.createSupplier(newSupplierData);
  assert.ok(created.id, 'Created supplier must have an ID');
  assert.ok(created.supplierCode.startsWith('SUP-'), 'Code should have SUP- prefix');
  assert.equal(created.supplierName, 'Kaveri Seed Company Ltd');
  assert.equal(created.openingBalance, 10000);
  console.log('✔ Supplier creation verified with auto-generated code:', created.supplierCode);

  // 3. Update supplier
  const updated = await supplierService.updateSupplier(created.id, {
    status: 'Inactive',
    notes: 'Temporarily inactive'
  });
  assert.equal(updated.status, 'Inactive');
  assert.equal(updated.notes, 'Temporarily inactive');
  console.log('✔ Supplier update and status toggling verified');

  // 4. Financial computations
  const fin = supplierService.computeSupplierFinancials(created, [], []);
  assert.equal(fin.openingBalance, 10000);
  assert.equal(fin.totalPurchases, 0);
  assert.equal(fin.totalPayments, 0);
  assert.equal(fin.outstandingBalance, 10000);
  console.log('✔ Supplier financial calculation verified');

  // 5. Transactions (`supplier_transactions`)
  const tx = await supplierService.createTransaction({
    supplierId: created.id,
    supplierName: created.supplierName,
    transactionType: 'Purchase',
    referenceNo: 'INV-KAV-1001',
    category: 'Seeds',
    itemsSummary: 'Maize Hybrid Seeds 20 Bags',
    amount: 15000,
    paidAmount: 5000
  });
  assert.ok(tx.transactionCode.startsWith('STX-'), 'Transaction code should have STX- prefix');
  assert.equal(tx.balanceAmount, 10000, 'Balance amount should be 15000 - 5000 = 10000');
  assert.equal(tx.paymentStatus, 'Partially Paid');
  console.log('✔ Supplier purchase transaction verified with balance calculation');

  // 6. Payments (`supplier_payments`)
  const py = await supplierService.createPayment({
    supplierId: created.id,
    supplierName: created.supplierName,
    amountPaid: 8000,
    paymentMode: 'Bank Transfer',
    referenceNo: 'UTR-HDFC-99112233',
    bankAccount: 'SBI Operational A/C'
  });
  assert.ok(py.paymentCode.startsWith('SPY-'), 'Payment code should have SPY- prefix');
  assert.equal(py.amountPaid, 8000);
  console.log('✔ Supplier payment voucher verified');

  // 7. Statement / Ledger calculation
  const allSuppliers = await supplierService.getSuppliers();
  const allTxs = await supplierService.getTransactions();
  const allPymts = await supplierService.getPayments();

  const statement = supplierService.getSupplierStatement(created.id, allSuppliers, allTxs, allPymts);
  assert.ok(statement, 'Statement should not be null');
  assert.equal(statement.openingBalance, 10000);
  assert.equal(statement.totalDebit, 15000);
  assert.equal(statement.totalCredit, 8000);
  // Net Due = 10000 (opening) + 15000 (debit/purchase) - 8000 (credit/payment) = 17000
  assert.equal(statement.netDue, 17000);
  assert.equal(statement.entries.length, 2);
  console.log('✔ Supplier ledger statement running balance verified. Net Due: ₹17,000');

  // 8. Delete operations
  await supplierService.deleteTransaction(tx.id);
  await supplierService.deletePayment(py.id);
  await supplierService.deleteSupplier(created.id);
  const remainingSuppliers = await supplierService.getSuppliers();
  assert.ok(!remainingSuppliers.some((s) => s.id === created.id), 'Deleted supplier should be gone');
  console.log('✔ Supplier and transaction cleanup/delete verified');

  console.log('\nAll tests passed successfully! 🎉');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
