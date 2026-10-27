Inventory API integration
=========================

The existing layouts, columns, search, pagination, and styles are retained. Lists now load from the backend rather than browser demo data. Products are selected by inventory ID because the live inventory contains duplicate item names.

Connected reads: GET /api/Inventory, /api/Purchases, /api/StockIn, /api/StockOut, /api/StockAdjustment, /api/StockLedger.
Connected writes: POST /api/StockIn, /api/StockOut, and /api/Purchases for fields supported by their schemas. Saves refresh the list; failed requests never fall back to local demo records.

Backend requirements for the existing screens
---------------------------------------------

- Stock In/Out: transaction number, category, farm/warehouse location, and transaction-specific supplier are absent from StockMovement. Stock Out also needs issued-to and purpose. The current numeric stockMovementId is shown as the transaction identifier. Supplier and unit come from the inventory master.
- Stock Adjustment: clarify whether quantity is a signed delta or a final count before enabling creation. StockMovement does not contain adjustment type, approved-by, location, or adjustment number. Reason maps to description. Listing is connected.
- Stock movements: update/delete endpoints are absent. Existing action buttons show an explanation; they do not change browser-only records.
- Stock Ledger: only GET endpoints exist. The Add Ledger Entry button explains that entries must come from stock transactions. A creation endpoint is needed only if manual ledger entries are intended. Location is absent from ledger records.
- Purchases: purchase number, crop, discount, tax, and payment status are absent. Purchase.status describes receipt status and is not treated as payment status. Total is calculated as quantity × unitPrice for supported submissions. Farm accepts a numeric farmId; a farm lookup API is needed for name-based selection. PUT/DELETE /api/Purchases/{id} exist but editing/deletion are not wired while the existing form cannot round-trip all columns safely.
- Inventory master: category and farm/warehouse relationships are absent. The existing Inventory API supplies product IDs, names, units, quantities, suppliers, and minimum stock levels.

Unsupported entered fields produce an explicit validation message rather than being silently discarded. Missing response fields display a dash. Adjustment and ledger creation remain blocked with an explanation.

Configuration
-------------

Optional VITE_INVENTORY_API_URL selects the inventory host. Development requests use dedicated Vite proxy routes, falling back to the existing business API host (VITE_FARMERS_API_URL / VITE_DASHBOARD_API_URL). Restart Vite after configuration changes. Authentication tokens are passed when available.

Validation
----------

Swagger and live GET responses were inspected. No live records were created, updated, or deleted during verification. Write behavior requires an approved test record/environment for end-to-end verification.
