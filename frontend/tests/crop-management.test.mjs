import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

console.log('Testing Crops Module Implementation (Renamed to Crops, summary card icons removed)...\n');

// 1. Check Sidebar.jsx
const sidebarPath = path.resolve('frontend/src/Sidebar/Sidebar.jsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

assert.ok(sidebarContent.includes("'Crops'"), "Sidebar should have 'Crops' menu item under Masters");
assert.ok(!sidebarContent.includes("'Crop Master'"), "Sidebar should NOT have 'Crop Master'");
assert.ok(!sidebarContent.includes("'Crop Varieties'"), "Sidebar should NOT have 'Crop Varieties'");

// Check that other menu items in Masters are intact
assert.ok(sidebarContent.includes("'Bank Accounts'"), "Masters should retain 'Bank Accounts'");
assert.ok(sidebarContent.includes("'Income Categories'"), "Masters should retain 'Income Categories'");
assert.ok(sidebarContent.includes("'Expense Categories'"), "Masters should retain 'Expense Categories'");
console.log('✓ 1. Sidebar menu item renamed to Crops and other items intact');

// 2. Check SidebarIcons.jsx
const sidebarIconsPath = path.resolve('frontend/src/Sidebar/SidebarIcons.jsx');
const sidebarIconsContent = fs.readFileSync(sidebarIconsPath, 'utf8');

assert.ok(sidebarIconsContent.includes("case 'Crops':"), "SidebarIcons should map 'Crops'");
console.log('✓ 2. Sidebar icons correctly mapped to Crops');

// 3. Check App.jsx routing
const appPath = path.resolve('frontend/src/App.jsx');
const appContent = fs.readFileSync(appPath, 'utf8');

assert.ok(appContent.includes("active === 'Crops'"), "App.jsx should route 'Crops'");
assert.ok(appContent.includes('initialTab="crop-management"'), "App.jsx should pass initialTab='crop-management'");
console.log('✓ 3. App.jsx routing verified for Crops');

// 4. Check Crops.jsx structure
const cropsPath = path.resolve('frontend/src/Masters/Crops/Crops.jsx');
const cropsContent = fs.readFileSync(cropsPath, 'utf8');

// Summary Cards: Verify labels and dynamic counts
assert.ok(cropsContent.includes('Total Crops'), "Summary cards should have 'Total Crops'");
assert.ok(cropsContent.includes('Total Varieties'), "Summary cards should have 'Total Varieties'");
assert.ok(cropsContent.includes('Active'), "Summary cards should have 'Active'");
assert.ok(cropsContent.includes('cropMgmtTotalCrops'), "Total Crops must be dynamically calculated");
assert.ok(cropsContent.includes('cropMgmtTotalVarieties'), "Total Varieties must be dynamically calculated");
assert.ok(cropsContent.includes('cropMgmtActiveCount'), "Active count must be dynamically calculated");

// Verify that icons have been removed from the 3 summary cards
const cardsStart = cropsContent.indexOf("{(activeTab === 'crop-management' || activeTab === 'crops' || activeTab === 'varieties')");
const cardsEnd = cropsContent.indexOf("{activeTab === 'seasons'");
const cardsSection = cropsContent.substring(cardsStart, cardsEnd);
assert.ok(!cardsSection.includes('cr-stat-icon'), "Summary cards MUST NOT have cr-stat-icon containers");
assert.ok(!cardsSection.includes('🌱'), "Summary cards MUST NOT have sprout icon");
assert.ok(!cardsSection.includes('🌾'), "Summary cards MUST NOT have grain icon");
console.log('✓ 4. Dynamic Summary Cards verified without icons');

// Unified Filters Button in Toolbar
assert.ok(cropsContent.includes('cr-filters-dropdown-wrap'), "Toolbar has unified Filters dropdown wrap");
assert.ok(cropsContent.includes('cr-filters-btn'), "Toolbar has single Filters button");
assert.ok(cropsContent.includes('All Crop Types'), "Crop Type dropdown inside Filters has All Crop Types option");
assert.ok(cropsContent.includes('All Seasons'), "Season dropdown inside Filters has All Seasons option");

// Verify Add Crop is removed from toolbar, but retained in Page Header
const toolbarIdx = cropsContent.indexOf('<div className="cr-toolbar">');
const tableIdx = cropsContent.indexOf('{/* 5. Main Content Tables */}');
const toolbarSection = cropsContent.substring(toolbarIdx, tableIdx);
assert.ok(!toolbarSection.includes('Add Crop'), "Toolbar MUST NOT have Add Crop button");
assert.ok(cropsContent.substring(0, toolbarIdx).includes('Add {currentTabInfo.addLabel}'), "Page header retains primary + Add Crop button");
console.log('✓ 5. Unified Filters button verified and Add Crop removed from toolbar');

// Table Columns (Exact 8 columns: Crop ID, Crop Name, Crop Type, Variety / Hybrid Name, Duration (Days), Season, Status, Actions)
const col1 = cropsContent.includes('<th><strong>Crop ID</strong></th>');
const col2 = cropsContent.includes('<th><strong>Crop Name</strong></th>');
const col3 = cropsContent.includes('<th><strong>Crop Type</strong></th>');
const col5 = cropsContent.includes('<th><strong>Variety / Hybrid Name</strong></th>');
const col6 = cropsContent.includes('<th><strong>Duration (Days)</strong></th>');
const col7 = cropsContent.includes('<th><strong>Season</strong></th>');
const col8 = cropsContent.includes('<th><strong>Status</strong></th>');
const col9 = cropsContent.includes('<th><strong>Actions</strong></th>') || cropsContent.includes("<th style={{ textAlign: 'right' }}><strong>Actions</strong></th>");

assert.ok(col1 && col2 && col3 && col5 && col6 && col7 && col8 && col9, "All 8 required table columns must be present in the table header");

// Check the column sequence in combined table
const combinedTableStart = cropsContent.indexOf('{/* ─── MODULE: CROP MANAGEMENT (COMBINED) ───────────────────────── */}');
const combinedTableSection = cropsContent.substring(combinedTableStart, combinedTableStart + 2500);

const idx1 = combinedTableSection.indexOf('Crop ID');
const idx2 = combinedTableSection.indexOf('Crop Name');
const idx3 = combinedTableSection.indexOf('Crop Type');
const idx5 = combinedTableSection.indexOf('Variety / Hybrid Name');
const idx6 = combinedTableSection.indexOf('Duration (Days)');
const idx7 = combinedTableSection.indexOf('Season');
const idx8 = combinedTableSection.indexOf('Status');
const idx9 = combinedTableSection.indexOf('Actions');

assert.ok(idx1 < idx2, "Crop ID before Crop Name");
assert.ok(idx2 < idx3, "Crop Name before Crop Type");
assert.ok(idx3 < idx5, "Crop Type before Variety / Hybrid Name");
assert.ok(idx5 < idx6, "Variety / Hybrid Name before Duration (Days)");
assert.ok(idx6 < idx7, "Duration (Days) before Season");
assert.ok(idx7 < idx8, "Season before Status");
assert.ok(idx8 < idx9, "Status before Actions");

assert.ok(!combinedTableSection.includes('Crop Category'), "Combined table MUST NOT include Crop Category");
assert.ok(!combinedTableSection.includes('Default Unit'), "Combined table MUST NOT include Default Unit");
assert.ok(!combinedTableSection.includes('Expected Yield'), "Combined table MUST NOT include Expected Yield");
console.log('✓ 6. Combined Table columns and sequence strictly verified (Crop Category removed)');

// 7. Actions Menu
assert.ok(cropsContent.includes('handleToggleCropManagementStatus'), "Activate/Deactivate action handler present");
assert.ok(cropsContent.includes('handleOpenEditCropManagement'), "Edit action handler present");
assert.ok(cropsContent.includes('type === \'crop-management\''), "Action menu supports crop-management");
console.log('✓ 7. Actions Menu (View, Edit, Activate/Deactivate) verified');

// 8. Add/Edit Modal (Crop Category removed, Crop Type options present)
const modalStart = cropsContent.indexOf("{modalType === 'crop-management' && (");
const modalSection = cropsContent.substring(modalStart, modalStart + 3500);

assert.ok(!modalSection.includes('Crop Category'), "Modal MUST NOT include Crop Category field");
assert.ok(modalSection.includes('Crop Type'), "Modal must include Crop Type field");
assert.ok(modalSection.includes('value="Cereal"'), "Modal Crop Type options include Cereal");
assert.ok(modalSection.includes('value="Vegetable"'), "Modal Crop Type options include Vegetable");
assert.ok(modalSection.includes('value="Spices"'), "Modal Crop Type options include Spices");
assert.ok(modalSection.includes('handleSaveCropManagement'), "Save Crop Management handler present");
console.log('✓ 8. Add/Edit Modal verified (Crop Category removed, Crop Type selector present)');

// 9. resolveCropType helper validation
assert.ok(cropsContent.includes('resolveCropType'), "resolveCropType helper exists in Crops.jsx");
console.log('✓ 9. resolveCropType helper verified');

console.log('\nAll Crops checks passed successfully!');
