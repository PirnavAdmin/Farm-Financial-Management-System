# Sales Management

Sales Transactions, Customers, and Payments & Receivables use the ASP.NET Core API through the shared Axios client.

- Sales: `GET/POST /api/Sales`, `PUT/DELETE /api/Sales/{id}`
- Buyers: `GET/POST /api/Buyers`, `PUT/DELETE /api/Buyers/{id}`
- Payments: `GET/POST /api/SalesPayments`, `DELETE /api/SalesPayments/{id}`
- Receivables: `PUT /api/Sales/receivables/{salesNo}`

Sales records, buyers, and payments are not silently replaced with browser-local sample data when an API request fails. The API error is surfaced in the relevant screen.
