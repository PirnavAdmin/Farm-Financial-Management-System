# Income Management

Income Management screens for listing, adding, editing, and viewing farm income transactions.

The module uses `incomeService.js` as its persistence boundary. No income API endpoint, backend implementation, or verified farmer/farm/crop lookup service exists in this repository. Records are therefore stored in browser `localStorage` under `agriman-income-records`, and farmer, farm, crop, and buyer names are entered as text. Data is available only in the current browser on the current device and is not synchronized with a server.

Gross amount is calculated as quantity multiplied by rate. Net amount is gross amount minus discount plus other charges. Income numbers are generated locally on record creation. Income types and payment modes are module-level choices, not backend-managed categories. When verified API and lookup contracts are available, replace the storage operations in the service layer with those contracts. The screens do not call invented endpoints or present local data as server-saved data.
