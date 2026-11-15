# Phase 5: payment ledger and settlement operations

Phase 5 adds an auditable payment ledger without claiming that an unconfigured online gateway is operational.

## Order payment lifecycle

- Public and manual orders create a pending payment intention.
- Cash on delivery and bank transfer can be confirmed by authorised merchant staff.
- Split and partial payments are supported.
- Refunds are separate immutable ledger entries and cannot exceed the net confirmed amount.
- A full refund changes the order status to `REFUNDED`.
- Every confirmed collection and refund creates a tenant audit event.

Payment state is derived from successful ledger entries rather than a mutable checkbox. Pending and failed entries never increase collected revenue.

## Permissions and isolation

- `orders.view` can view the payment dashboard.
- `orders.manage` can confirm collections.
- `orders.refund` can record refunds.
- Every mutation revalidates the tenant and store against the signed-in user.

## Online gateways

PayFast, Easypaisa, JazzCash and Stripe remain disabled until merchant-specific credentials and signed webhook verification are implemented. Configuring an account reference does not mark these providers as connected. The current phase provides the provider-neutral ledger that future webhook adapters will write to.
