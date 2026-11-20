import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

console.log('Testing Machinery & Equipment Module Complete API Integration...');

// Mock localStorage for node environment
const storage = {};
globalThis.localStorage = {
  getItem: (key) => storage[key] || null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); }
};

// Mock API client to test HTTP calls & request routing
const apiRequests = [];
const mockApi = {
  get: async (url, config = {}) => {
    apiRequests.push({ method: 'GET', url, config });
    if (url === '/api/Machinery') {
      return {
        data: {
          totalMachines: 7,
          rowsShown: 7,
          expenseTypesCount: 6,
          items: [
            {
              id: 1,
              machineName: 'Mahindra 575 DI Tractor',
              machineType: 'Tractor',
              registrationNo: 'AP 16 CZ 4521',
              purchaseDate: '2022-04-15',
              purchaseCost: 750000,
              currentValue: 610000,
              fuelType: 'Diesel',
              status: 'Active',
              expenseCount: 2,
              totalExpenses: 5400
            }
          ]
        }
      };
    }
    if (url === '/api/Machinery/1') {
      return {
        data: {
          id: 1,
          machineName: 'Mahindra 575 DI Tractor',
          machineType: 'Tractor',
          registrationNo: 'AP 16 CZ 4521',
          purchaseDate: '2022-04-15',
          purchaseCost: 750000,
          currentValue: 610000,
          fuelType: 'Diesel',
          status: 'Active',
          expenseCount: 2,
          totalExpenses: 5400
        }
      };
    }
    if (url === '/api/Machinery/summary') {
      return {
        data: {
          totalMachines: 7,
          activeMachines: 5,
          underMaintenanceMachines: 1,
          inactiveMachines: 1,
          totalPurchaseCost: 3744500,
          totalCurrentValue: 2833800,
          totalExpenseRecords: 8,
          totalExpenseAmount: 28750,
          expenseTypesCount: 6
        }
      };
    }
    if (url === '/api/Machinery/lookups') {
      return {
        data: {
          machineTypes: ['Tractor', 'Harvester', 'Rotavator'],
          fuelTypes: ['Diesel', 'Petrol', 'Electric'],
          statuses: ['Active', 'Under Maintenance', 'Inactive'],
          expenseTypes: [
            { id: 1, code: 'FUEL', name: 'Fuel', isActive: true },
            { id: 2, code: 'MAINTENANCE', name: 'Maintenance', isActive: true }
          ]
        }
      };
    }
    if (url === '/api/Machinery/1/expenses') {
      return {
        data: {
          totalExpenseRecords: 2,
          rowsShown: 2,
          totalAmount: 5400,
          items: [
            { id: 1, machineryId: 1, machineName: 'Mahindra 575 DI Tractor', expenseType: 'Fuel', date: '2026-11-12', amount: 3200 },
            { id: 2, machineryId: 1, machineName: 'Mahindra 575 DI Tractor', expenseType: 'Maintenance', date: '2026-11-05', amount: 2200 }
          ]
        }
      };
    }
    if (url === '/api/Machinery/roi') {
      return {
        data: {
          success: true,
          message: 'Machinery Fleet ROI & Maintenance analysis retrieved successfully.',
          data: [
            {
              id: 1,
              machineCode: 'MCH-001',
              machineName: 'Mahindra 575 DI Tractor',
              machineType: 'Tractor',
              purchaseCost: 750000,
              currentValue: 610000,
              status: 'Active',
              totalMaintenanceCost: 5400,
              expenseCount: 2,
              maintenanceToCostRatio: 0.72,
              estimatedNetValue: 604600
            }
          ]
        }
      };
    }
    if (url === '/api/machinery-expenses') {
      return {
        data: {
          totalExpenseRecords: 2,
          totalAmount: 5400,
          items: [
            { id: 1, machineryId: 1, machineName: 'Mahindra 575 DI Tractor', expenseType: 'Fuel', date: '2026-11-12', amount: 3200 }
          ]
        }
      };
    }
    if (url === '/api/machinery-expenses/types') {
      return {
        data: [
          { id: 1, code: 'FUEL', name: 'Fuel', isActive: true },
          { id: 2, code: 'MAINTENANCE', name: 'Maintenance', isActive: true }
        ]
      };
    }
    if (url === '/api/machinery-expenses/1') {
      return {
        data: { id: 1, machineryId: 1, machineName: 'Mahindra 575 DI Tractor', expenseType: 'Fuel', date: '2026-11-12', amount: 3200 }
      };
    }
    throw new Error(`Endpoint not mocked: ${url}`);
  },
  post: async (url, data) => {
    apiRequests.push({ method: 'POST', url, data });
    return { data: { id: 99, ...data } };
  },
  put: async (url, data) => {
    apiRequests.push({ method: 'PUT', url, data });
    return { data: { id: 1, ...data } };
  },
  delete: async (url) => {
    apiRequests.push({ method: 'DELETE', url });
    return { status: 204, data: null };
  }
};
globalThis.__machineryTestApi = mockApi;

// Load machineryService dynamically with mocked API
const rawSource = await readFile(new URL('../src/services/machineryService.js', import.meta.url), 'utf8');
const transformedSource = rawSource
  .replace("import api from './api.js';", 'const api = globalThis.__machineryTestApi;')
  .replace("import api from './api';", 'const api = globalThis.__machineryTestApi;')
  .replaceAll('import.meta.env', '({ DEV: true })');

const { machineryService, normalizeMachine, normalizeExpense, SEED_MACHINERY } = await import(
  `data:text/javascript;base64,${Buffer.from(transformedSource).toString('base64')}`
);

async function runTests() {
  // ── 1. GET /api/Machinery ──────────────────────────────────────────────────
  const list = await machineryService.getMachinery();
  assert.ok(Array.isArray(list), 'Machinery should be an array');
  assert.ok(list.length > 0, 'Should return machinery records from API');
  assert.strictEqual(list[0].machineName, 'Mahindra 575 DI Tractor');
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/Machinery'));
  console.log('✔ GET /api/Machinery tested successfully');

  // ── 2. GET /api/Machinery/{id} ─────────────────────────────────────────────
  const machine = await machineryService.getMachineById(1);
  assert.ok(machine, 'Machine should not be null');
  assert.strictEqual(machine.id, 1);
  assert.strictEqual(machine.machineCode, 'MCH-001');
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/Machinery/1'));
  console.log('✔ GET /api/Machinery/{id} tested successfully');

  // ── 3. POST /api/Machinery ─────────────────────────────────────────────────
  const newMachine = {
    machineName: 'Swaraj 855 FE Tractor',
    machineType: 'Tractor',
    registrationNo: 'AP 16 SW 5500',
    purchaseDate: '2024-01-10',
    purchaseCost: 790000,
    currentValue: 740000,
    fuelType: 'Diesel',
    status: 'Active'
  };
  const createdMachine = await machineryService.createMachine(newMachine);
  assert.ok(createdMachine, 'Created machine should not be null');
  assert.strictEqual(createdMachine.machineName, 'Swaraj 855 FE Tractor');
  assert.ok(apiRequests.some((r) => r.method === 'POST' && r.url === '/api/Machinery'));
  console.log('✔ POST /api/Machinery tested successfully');

  // ── 4. PUT /api/Machinery/{id} ─────────────────────────────────────────────
  const updatedMachine = await machineryService.updateMachine(1, {
    status: 'Under Maintenance',
    currentValue: 590000
  });
  assert.strictEqual(updatedMachine.status, 'Under Maintenance');
  assert.strictEqual(updatedMachine.currentValue, 590000);
  assert.ok(apiRequests.some((r) => r.method === 'PUT' && r.url === '/api/Machinery/1'));
  console.log('✔ PUT /api/Machinery/{id} tested successfully');

  // ── 5. DELETE /api/Machinery/{id} ──────────────────────────────────────────
  const deleteResult = await machineryService.deleteMachine(1);
  assert.strictEqual(deleteResult, true);
  assert.ok(apiRequests.some((r) => r.method === 'DELETE' && r.url === '/api/Machinery/1'));
  console.log('✔ DELETE /api/Machinery/{id} tested successfully');

  // ── 6. GET /api/Machinery/summary ──────────────────────────────────────────
  const summary = await machineryService.getMachinerySummary();
  assert.ok(summary, 'Summary should not be null');
  assert.strictEqual(summary.totalMachines, 7);
  assert.strictEqual(summary.activeMachines, 5);
  assert.strictEqual(summary.underMaintenanceMachines, 1);
  assert.strictEqual(summary.totalExpenseRecords, 8);
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/Machinery/summary'));
  console.log('✔ GET /api/Machinery/summary tested successfully');

  // ── 7. GET /api/Machinery/lookups ──────────────────────────────────────────
  const lookups = await machineryService.getMachineryLookups();
  assert.ok(lookups, 'Lookups should not be null');
  assert.ok(Array.isArray(lookups.machineTypes));
  assert.ok(Array.isArray(lookups.fuelTypes));
  assert.ok(Array.isArray(lookups.statuses));
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/Machinery/lookups'));
  console.log('✔ GET /api/Machinery/lookups tested successfully');

  // ── 8. GET /api/Machinery/{machineryId}/expenses ───────────────────────────
  const machineExpenses = await machineryService.getExpensesForMachine(1);
  assert.ok(machineExpenses, 'Machine expenses should not be null');
  assert.strictEqual(machineExpenses.totalExpenseRecords, 2);
  assert.strictEqual(machineExpenses.totalAmount, 5400);
  assert.strictEqual(machineExpenses.items.length, 2);
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/Machinery/1/expenses'));
  console.log('✔ GET /api/Machinery/{machineryId}/expenses tested successfully');

  // ── 9. POST /api/Machinery/{machineryId}/expenses ──────────────────────────
  const addedExpense = await machineryService.addExpenseForMachine(1, {
    machineName: 'Mahindra 575 DI Tractor',
    expenseType: 'Fuel',
    date: '2026-11-20',
    amount: 2500,
    operator: 'Ramesh',
    remarks: 'Diesel refill for ploughing'
  });
  assert.ok(addedExpense, 'Added expense should not be null');
  assert.strictEqual(addedExpense.amount, 2500);
  assert.ok(apiRequests.some((r) => r.method === 'POST' && r.url === '/api/Machinery/1/expenses'));
  console.log('✔ POST /api/Machinery/{machineryId}/expenses tested successfully');

  // ── 10. GET /api/Machinery/roi ─────────────────────────────────────────────
  const roi = await machineryService.getFleetRoi();
  assert.ok(Array.isArray(roi), 'ROI should be an array');
  assert.strictEqual(roi[0].machineCode, 'MCH-001');
  assert.strictEqual(roi[0].totalMaintenanceCost, 5400);
  assert.strictEqual(roi[0].maintenanceToCostRatio, 0.72);
  assert.strictEqual(roi[0].estimatedNetValue, 604600);
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/Machinery/roi'));
  console.log('✔ GET /api/Machinery/roi tested successfully');

  // ── 11. GET /api/machinery-expenses ────────────────────────────────────────
  const allExpenses = await machineryService.getAllExpenses();
  assert.ok(allExpenses, 'All expenses should not be null');
  assert.strictEqual(allExpenses.totalExpenseRecords, 2);
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/machinery-expenses'));
  console.log('✔ GET /api/machinery-expenses tested successfully');

  // ── 12. GET /api/machinery-expenses/types ──────────────────────────────────
  const types = await machineryService.getExpenseTypes();
  assert.ok(Array.isArray(types), 'Expense types should be an array');
  assert.strictEqual(types.length, 2);
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/machinery-expenses/types'));
  console.log('✔ GET /api/machinery-expenses/types tested successfully');

  // ── 13. GET /api/machinery-expenses/{id} ───────────────────────────────────
  const singleExpense = await machineryService.getExpenseById(1);
  assert.ok(singleExpense, 'Expense should not be null');
  assert.strictEqual(singleExpense.id, 1);
  assert.strictEqual(singleExpense.amount, 3200);
  assert.ok(apiRequests.some((r) => r.method === 'GET' && r.url === '/api/machinery-expenses/1'));
  console.log('✔ GET /api/machinery-expenses/{id} tested successfully');

  // ── 14. POST /api/machinery-expenses ───────────────────────────────────────
  const createdGeneralExpense = await machineryService.createExpense({
    machineryId: 1,
    machineName: 'Mahindra 575 DI Tractor',
    expenseType: 'Fuel',
    date: '2026-11-20',
    amount: 1500,
    operator: 'Operator',
    remarks: 'Routine refill'
  });
  assert.ok(createdGeneralExpense, 'Created expense should not be null');
  assert.strictEqual(createdGeneralExpense.amount, 1500);
  assert.ok(apiRequests.some((r) => r.method === 'POST' && r.url === '/api/machinery-expenses'));
  console.log('✔ POST /api/machinery-expenses tested successfully');

  // ── 15. PUT /api/machinery-expenses/{id} ───────────────────────────────────
  const updatedExpense = await machineryService.updateExpense(1, {
    amount: 3500,
    remarks: 'Updated invoice amount'
  });
  assert.strictEqual(updatedExpense.amount, 3500);
  assert.ok(apiRequests.some((r) => r.method === 'PUT' && r.url === '/api/machinery-expenses/1'));
  console.log('✔ PUT /api/machinery-expenses/{id} tested successfully');

  // ── 16. DELETE /api/machinery-expenses/{id} ────────────────────────────────
  const deleteExpenseResult = await machineryService.deleteExpense(1);
  assert.strictEqual(deleteExpenseResult, true);
  assert.ok(apiRequests.some((r) => r.method === 'DELETE' && r.url === '/api/machinery-expenses/1'));
  console.log('✔ DELETE /api/machinery-expenses/{id} tested successfully');

  console.log('\n🎉 ALL 16 MACHINERY & OPERATING EXPENSE API ENDPOINTS VERIFIED SUCCESSFULLY! 🎉');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
