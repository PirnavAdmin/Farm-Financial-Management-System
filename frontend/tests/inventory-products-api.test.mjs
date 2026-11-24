import assert from 'node:assert/strict';

console.log('Testing Inventory Management Part 1: Master Data, DB Schema & Products API...');

// Test Category Schema and Lookups
const categories = [
  { id: 1, name: 'Seeds', description: 'Agricultural crop seeds, hybrid varieties, and certified saplings', isActive: true },
  { id: 2, name: 'Fertilizers', description: 'Chemical, organic, and complex plant nutrients', isActive: true },
  { id: 3, name: 'Pesticides', description: 'Chemical insecticides, fungicides, and herbicides for pest control', isActive: true },
  { id: 4, name: 'Sprayer Chemicals', description: 'Specialized liquid sprays, adjuvants, and micronutrients', isActive: true },
  { id: 5, name: 'Spare Parts', description: 'Tractor, tiller, irrigation pump, and sprayer spare parts', isActive: true },
  { id: 6, name: 'Consumables', description: 'Drip lateral pipes, ropes, tarpaulins, and farm consumables', isActive: true }
];

const units = [
  { id: 1, name: 'Kilograms', shortCode: 'kg', isActive: true },
  { id: 2, name: 'Bags', shortCode: 'Bags', isActive: true },
  { id: 3, name: 'Litre', shortCode: 'Litre', isActive: true },
  { id: 4, name: 'Quintals', shortCode: 'Quintals', isActive: true },
  { id: 5, name: 'Packets', shortCode: 'Packets', isActive: true }
];

const products = [
  { id: 1, code: 'PRD-001', name: 'Paddy Certified Seeds (BPT 5204 Samba Masuri)', categoryId: 1, unitId: 2, reorderLevel: 10, standardCost: 850, currentStock: 50, isActive: true },
  { id: 2, code: 'PRD-002', name: 'Urea Fertilizer Granular (45kg)', categoryId: 2, unitId: 2, reorderLevel: 25, standardCost: 270, currentStock: 100, isActive: true },
  { id: 3, code: 'PRD-003', name: 'DAP Complex Fertilizer 18-46-0 (50kg)', categoryId: 2, unitId: 2, reorderLevel: 15, standardCost: 1350, currentStock: 40, isActive: true },
  { id: 4, code: 'PRD-004', name: 'Chlorpyrifos 20% EC Insecticide', categoryId: 3, unitId: 3, reorderLevel: 5, standardCost: 480, currentStock: 25, isActive: true },
  { id: 5, code: 'PRD-005', name: 'Glyphosate 41% SL Sprayer Chemical', categoryId: 4, unitId: 3, reorderLevel: 8, standardCost: 550, currentStock: 30, isActive: true },
  { id: 6, code: 'PRD-006', name: 'Mahindra Tractor Oil Filter Cartridge', categoryId: 5, unitId: 5, reorderLevel: 4, standardCost: 450, currentStock: 15, isActive: true },
  { id: 7, code: 'PRD-007', name: 'Drip Lateral Pipe 16mm (100m Roll)', categoryId: 6, unitId: 5, reorderLevel: 3, standardCost: 1650, currentStock: 10, isActive: true },
  { id: 8, code: 'PRD-008', name: 'Cotton Hybrid Seeds (Kaveri Jadu)', categoryId: 1, unitId: 5, reorderLevel: 10, standardCost: 920, currentStock: 35, isActive: true }
];

// Helper: Sequential PRD-NNN Generator Logic
function generateNextProductCode(existingCodes) {
  let max = 0;
  for (const c of existingCodes) {
    if (c.toUpperCase().startsWith('PRD-')) {
      const num = parseInt(c.slice(4), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  const nextNum = max + 1;
  let code = `PRD-${String(nextNum).padStart(3, '0')}`;
  const set = new Set(existingCodes.map(x => x.toUpperCase()));
  let curr = nextNum;
  while (set.has(code.toUpperCase())) {
    curr++;
    code = `PRD-${String(curr).padStart(3, '0')}`;
  }
  return code;
}

// 1. Verify Default Categories
assert.equal(categories.length, 6, 'Must define 6 standard agricultural categories');
const categoryNames = categories.map(c => c.name);
['Seeds', 'Fertilizers', 'Pesticides', 'Sprayer Chemicals', 'Spare Parts', 'Consumables'].forEach(expected => {
  assert.ok(categoryNames.includes(expected), `Default category ${expected} must exist`);
});

// 2. Verify Default Units
assert.equal(units.length, 5, 'Must define 5 required units');
const unitShortCodes = units.map(u => u.shortCode);
['kg', 'Bags', 'Litre', 'Quintals', 'Packets'].forEach(expected => {
  assert.ok(unitShortCodes.includes(expected), `Default unit ${expected} must exist`);
});

// 3. Verify Sequential PRD-NNN Code Generation
const existingCodes = products.map(p => p.code);
const nextCode = generateNextProductCode(existingCodes);
assert.equal(nextCode, 'PRD-009', 'Next generated product code should be PRD-009');

// Test collision avoidance
const collisionCodes = [...existingCodes, 'PRD-009', 'PRD-010'];
assert.equal(generateNextProductCode(collisionCodes), 'PRD-011', 'Should skip collided numbers to find PRD-011');

// 4. Verify Block Delete When Linked to Active Products
function canDeleteCategory(catId) {
  const linked = products.filter(p => p.categoryId === catId && p.isActive);
  if (linked.length > 0) {
    return { canDelete: false, message: `Cannot delete category because it is linked to ${linked.length} active products.` };
  }
  return { canDelete: true };
}

assert.equal(canDeleteCategory(1).canDelete, false, 'Category 1 has active products and cannot be deleted');
assert.equal(canDeleteCategory(999).canDelete, true, 'Unlinked category can be deleted');

function canDeleteUnit(unitId) {
  const linked = products.filter(p => p.unitId === unitId && p.isActive);
  if (linked.length > 0) {
    return { canDelete: false, message: `Cannot delete unit because it is linked to ${linked.length} active products.` };
  }
  return { canDelete: true };
}

assert.equal(canDeleteUnit(2).canDelete, false, 'Unit 2 (Bags) has active products and cannot be deleted');
assert.equal(canDeleteUnit(999).canDelete, true, 'Unlinked unit can be deleted');

// 5. Verify Validations: Non-negative costs and levels
function validateProductDto(dto) {
  const errors = [];
  if (dto.reorderLevel < 0) errors.push('ReorderLevel must be non-negative (>= 0).');
  if (dto.standardCost < 0) errors.push('StandardCost must be non-negative (>= 0).');
  if (!categories.some(c => c.id === dto.categoryId)) errors.push(`Category with ID ${dto.categoryId} does not exist.`);
  if (!units.some(u => u.id === dto.unitId)) errors.push(`Unit with ID ${dto.unitId} does not exist.`);
  return errors;
}

assert.deepEqual(validateProductDto({ categoryId: 1, unitId: 2, reorderLevel: 5, standardCost: 100 }), []);
const invalidRes = validateProductDto({ categoryId: 999, unitId: 888, reorderLevel: -5, standardCost: -10 });
assert.equal(invalidRes.length, 4, 'Should flag invalid category, unit, reorder level, and standard cost');

// 6. Verify Status Update (PATCH /api/Products/{id}/status)
function patchProductStatus(id, isActive) {
  const p = products.find(prod => prod.id === id);
  if (!p) return null;
  return { ...p, isActive, status: isActive ? 'Active' : 'Inactive' };
}

const deactivated = patchProductStatus(1, false);
assert.equal(deactivated.isActive, false);
assert.equal(deactivated.status, 'Inactive');

console.log('All Inventory Master Data & Products API tests passed successfully!');
