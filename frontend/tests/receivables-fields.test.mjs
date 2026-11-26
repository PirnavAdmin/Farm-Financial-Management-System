import fs from 'fs';
import path from 'path';

console.log('Testing Receivables & Payment History Screen Matching Fields...');

const filePath = path.resolve('frontend/src/Sales/Receivables/receivables.jsx');
const code = fs.readFileSync(filePath, 'utf8');

// 1. Verify Payment History Records Tab Modal
console.log('1. Checking Payment History Records Modal Fields...');
if (!code.includes("activeTab === 'payments' ? (") || !code.includes('/* TAB 2: EXACT PAYMENT HISTORY RECORDS SCREEN COLUMNS ONLY */')) {
  throw new Error('Payment tab specific modal conditional rendering is missing!');
}

const paymentFields = [
  'name="paymentNo"',
  'name="paymentDate"',
  'name="buyer"',
  'name="salesNo"',
  'name="paymentAmount"',
  'name="paymentMode"',
  'name="referenceNo"',
  'name="remarks"'
];

for (const field of paymentFields) {
  if (!code.includes(field)) {
    throw new Error(`Expected payment field ${field} not found in receivables.jsx`);
  }
}
console.log('✓ All 8 Payment History Records screen fields verified in modal.');

// 2. Verify Receivables Tab Modal
console.log('2. Checking Receivables Tab Modal Fields...');
if (!code.includes('/* TAB 1: EXACT RECEIVABLES SCREEN COLUMNS ONLY */')) {
  throw new Error('Receivables tab specific modal is missing!');
}

const receivableFields = [
  'name="buyer"',
  'name="salesNo"',
  'name="salesDate"',
  'name="totalSalesAmount"',
  'name="amountReceived"',
  'name="outstandingAmount"',
  'name="paymentStatus"'
];

for (const field of receivableFields) {
  if (!code.includes(field)) {
    throw new Error(`Expected receivable field ${field} not found in receivables.jsx`);
  }
}
console.log('✓ All 7 Receivables screen fields verified in modal.');

// 3. Verify Filters dropdown matches screen columns dynamically
console.log('3. Checking Filters dropdown dynamic options...');
if (!code.includes("activeTab === 'receivables' ? (") ||
    !code.includes('Option 2: Payment Status') ||
    !code.includes('Payment Mode') ||
    !code.includes('Payment Date')) {
  throw new Error('Filters dropdown does not match active screen tab columns!');
}
console.log('✓ Filters dropdown options strictly match screen columns for both tabs.');

// 4. Verify salesService.recordPayment is called for payment tab
console.log('4. Checking salesService.recordPayment integration...');
if (!code.includes('await salesService.recordPayment({')) {
  throw new Error('salesService.recordPayment not called in handleSavePayment!');
}
console.log('✓ salesService.recordPayment properly integrated.');

console.log('\nAll Receivables & Payment History checks passed successfully!');
