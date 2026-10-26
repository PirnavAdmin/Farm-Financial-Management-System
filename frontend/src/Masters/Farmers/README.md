# Farmers

Farmers master screen for managing farmer records.

## Farmer list

Shows farmer code, name, mobile, village, mandal, district, total land, status, and row actions. The list supports text search, status filtering, inline status changes, editing, and deletion.

## Add and edit farmer

The form captures farmer code, name, father or husband name, mobile numbers, email, Aadhaar, address, village, mandal, district, state, PIN code, bank name, account number, IFSC, and status. Total land is displayed in the list and can be managed with farm records.

## API integration

The frontend farmer service requests the collection with `GET /api/Farmers`, creates with `POST /api/Farmers`, updates with `PUT /api/Farmers/{id}`, and deletes with `DELETE /api/Farmers/{id}`. The list accepts either a JSON array or an object whose `data` property is an array. It does not treat an unknown response format as an empty list.

No ASP.NET Core backend source is present in this repository, so the collection route and DTOs could not be verified against controller definitions. In particular, a 404 from the collection request means the route or proxy target needs backend verification; it does not mean an individual farmer record is missing.
