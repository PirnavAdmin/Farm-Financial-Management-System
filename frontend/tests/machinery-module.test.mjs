import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

console.log('Testing Machinery & Equipment Module...');

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
    throw new Error('Offline fallback mode');
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
globalThis.__machineryTestApi = mockApi;

// Load machineryService dynamically with mocked API
const rawSource = await readFile(new URL('../src/services/machineryService.js', import.meta.url), 'utf8');
const transformedSource = rawSource
  .replace("import api from './api.js';", 'const api = globalThis.__machineryTestApi;')
  .replace("import api from './api';", 'const api = globalThis.__machineryTestApi;')
  .replaceAll('import.meta.env', '({ DEV: true })');

const { machineryService, normalizeMachine, SEED_MACHINERY } = await import(
  `data:text/javascript;base64,${Buffer.from(transformedSource).toString('base64')}`
);

async function runTests() {
  // 1. Initial Machinery list
  const initialMachinery = await machineryService.getMachinery();
  assert.ok(Array.isArray(initialMachinery), 'Machinery should be an array');
  assert.ok(initialMachinery.length >= 7, 'Should contain realistic seed machinery');

  // Verify all 8 required fields specified in user prompt:
  // 1. Machine Name
  // 2. Machine Type
  // 3. Registration No
  // 4. Purchase Date
  // 5. Purchase Cost
  // 6. Current Value
  // 7. Fuel Type
  // 8. Status
  const requiredFields = [
    'machineCode',
    'machineName',
    'machineType',
    'registrationNo',
    'purchaseDate',
    'purchaseCost',
    'currentValue',
    'fuelType',
    'status'
  ];

  initialMachinery.forEach((m) => {
    requiredFields.forEach((field) => {
      assert.ok(field in m, `Machine "${m.machineName}" is missing required field "${field}"`);
    });
    assert.strictEqual(typeof m.purchaseCost, 'number', 'purchaseCost must be a number');
    assert.strictEqual(typeof m.currentValue, 'number', 'currentValue must be a number');
    assert.ok(
      ['Active', 'Inactive', 'Under Maintenance'].includes(m.status),
      `Invalid status: ${m.status}`
    );
  });
  console.log('✔ All 8 required machinery fields and types verified on seed data');

  // Verify sample types (Tractor, Power Tiller, Power Weeder, Sprayer, Harvester, Rotavator)
  const typesInSeed = new Set(initialMachinery.map((m) => m.machineType));
  ['Tractor', 'Power Tiller', 'Power Weeder', 'Sprayer', 'Harvester', 'Rotavator'].forEach((t) => {
    assert.ok(typesInSeed.has(t), `Seed machinery missing type: ${t}`);
  });
  console.log('✔ All required agricultural machinery types present in seed data');

  // 2. Create / Add Machinery
  const newMachineData = {
    machineName: 'John Deere 5050 D GearPro Tractor',
    machineType: 'Tractor',
    registrationNo: 'AP 16 JD 9922',
    purchaseDate: '2024-03-01',
    purchaseCost: 820000,
    currentValue: 800000,
    fuelType: 'Diesel',
    status: 'Active',
    modelNumber: '5050 D (50 HP)',
    manufacturer: 'John Deere India',
    notes: 'Heavy duty tractor with dual clutch and power steering'
  };

  const created = await machineryService.createMachine(newMachineData);
  assert.ok(created.id, 'Created machine must have an id');
  assert.strictEqual(created.machineName, 'John Deere 5050 D GearPro Tractor');
  assert.strictEqual(created.registrationNo, 'AP 16 JD 9922');
  assert.strictEqual(created.purchaseCost, 820000);
  assert.strictEqual(created.currentValue, 800000);
  assert.strictEqual(created.status, 'Active');
  assert.ok(created.machineCode.startsWith('MCH-'), 'Machine code generated');

  const afterCreate = await machineryService.getMachinery();
  assert.strictEqual(afterCreate.length, initialMachinery.length + 1, 'Length increased by 1');
  console.log('✔ Add Machinery verified with code generation and persistence');

  // 3. Edit / Update Machinery
  const updated = await machineryService.updateMachine(created.id, {
    status: 'Under Maintenance',
    currentValue: 780000,
    notes: 'Scheduled for first 50-hour free servicing'
  });
  assert.strictEqual(updated.status, 'Under Maintenance');
  assert.strictEqual(updated.currentValue, 780000);
  assert.strictEqual(updated.notes, 'Scheduled for first 50-hour free servicing');

  const afterUpdate = await machineryService.getMachineById(created.id);
  assert.strictEqual(afterUpdate.status, 'Under Maintenance');
  console.log('✔ Edit Machinery verified with field update and persistence');

  // 4. Metrics computation
  const metrics = machineryService.computeMachineryMetrics(afterCreate);
  assert.strictEqual(metrics.total, afterCreate.length);
  assert.ok(metrics.active > 0, 'Active count positive');
  assert.ok(metrics.maintenance > 0, 'Under Maintenance count positive');
  assert.ok(metrics.totalPurchaseCost > 0, 'Total purchase cost positive');
  assert.ok(metrics.totalCurrentValue > 0, 'Total current value positive');
  console.log('✔ Machinery metrics computation verified (Active, Maintenance, Valuation)');

  // 5. Delete Machinery
  await machineryService.deleteMachine(created.id);
  const afterDelete = await machineryService.getMachinery();
  assert.strictEqual(afterDelete.length, initialMachinery.length, 'Length reverted');
  const foundDeleted = await machineryService.getMachineById(created.id);
  assert.strictEqual(foundDeleted, null, 'Deleted machine should not be found');
  console.log('✔ Delete Machinery verified');

  // 6. Normalization resilience test
  const rawEmpty = normalizeMachine({}, 99);
  assert.ok(rawEmpty.machineName.length > 0, 'Default name exists');
  assert.strictEqual(rawEmpty.machineType, 'Tractor');
  assert.strictEqual(rawEmpty.status, 'Active');
  assert.strictEqual(rawEmpty.purchaseCost, 0);

  const rawSnakeCase = normalizeMachine({
    machine_name: 'Snake Case Sprayer',
    machine_type: 'Sprayer',
    registration_no: 'ts 09 ab 1234',
    purchase_date: '2023-05-10',
    purchase_cost: '45000',
    current_value: '35000',
    fuel_type: 'Petrol'
  });
  assert.strictEqual(rawSnakeCase.machineName, 'Snake Case Sprayer');
  assert.strictEqual(rawSnakeCase.registrationNo, 'TS 09 AB 1234');
  assert.strictEqual(rawSnakeCase.purchaseCost, 45000);
  assert.strictEqual(rawSnakeCase.currentValue, 35000);
  console.log('✔ Normalization resilience tested with snake_case and defaults');

  console.log('\nAll Machinery & Equipment module tests passed successfully! 🎉');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
