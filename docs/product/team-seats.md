# Team seats

For the foundation, one row in `organization_memberships` consumes one seat. Memberships currently have no inactive state, so every row is active. The owner counts because organization creation guarantees its canonical admin membership. No separate seat-assignment table is needed.

The Team subscription `quantity` is the effective allowance; future plan-included and extra-seat composition can calculate that quantity without changing membership authority. No final allowance is fixed in this phase.

If usage exceeds allowance after a downgrade, existing members are retained. Billing may expose an over-limit issue and future invitation creation/acceptance may reject with `seat_limit_reached`, but it must never remove members automatically. The current invitation flow is deliberately unchanged until enforcement/product policy is enabled. The future hook belongs transactionally in invitation acceptance after locking the Organization and before inserting membership, using the same membership count and latest active Team subscription.

The server read model reports `{ usage, allowance }` for Team. Provider quantity and billing internals remain hidden. Organization—not an individual member—is the payer and entitlement scope, so payer/owner transfer can evolve without changing Team product authority.

