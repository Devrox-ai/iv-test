# Upgrade summary

- Replaced separate login/register pages with a single responsive account flow.
- Added mobile/WhatsApp field to users.
- Added protected admin dashboard and order status messaging.
- Added optional WhatsApp Cloud API order bill/status sender.
- Added AI shopping assistant using live MongoDB catalog + optional OpenAI Responses API.
- Added `.env.example`; the original `.env` was intentionally not included in the upgraded ZIP.


## Admin Control Center Upgrade
Added:
- Central admin dashboard navigation
- Sales and order summary cards
- Low-stock and out-of-stock alerts
- Best-selling products
- Full order detail page
- Order timeline / WhatsApp status updates
- Customer detail + order history
- Sales & operations reports
- Product stock and low-stock limit fields
- Stock badges on product management
- Direct links between all admin sections

New routes:
- /admin/dashboard
- /admin/orders/:id
- /admin/customers/:id
- /admin/reports

Product forms now save `stock`, `lowStockLimit`, and `active`.
