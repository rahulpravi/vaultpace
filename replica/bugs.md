# Bug Tracker: FundTracker

Audit and resolution log following the `replica-test` protocol.

---

### BUG-001: Stripe SDK v17 Checkout `payment_method_types` Compiler Error
- **Severity**: S2 (feature build broken)
- **Flow / Case**: F05-N1 (Checkout route build)
- **Screen / Route**: `/api/checkout`
- **Build**: `f5f6efa`
- **Steps**:
  1. Install `stripe@17.2.0`.
  2. Run `npm run build`.
- **Expected**: Next.js compiles all server routes cleanly.
- **Actual**: Webpack TypeScript error: `payment_method_types does not exist in type SessionCreateParams`.
- **Suspected Cause**: In Stripe SDK v17, payment methods are automatically handled by the dashboard configuration rather than explicit parameter arrays.
- **Status**: **Fixed** in commit `f5f6efa` by updating `stripe.checkout.sessions.create` call.

---

## Bug Severity Summary
| Severity | Description | Logged | Fixed | Open |
| --- | --- | --- | --- | --- |
| **S1** | Data loss, security hole, core flow blocked | 0 | 0 | **0** |
| **S2** | Feature broken with no workaround | 1 | 1 | **0** |
| **S3** | Visual glitch or non-blocking defect | 0 | 0 | **0** |
| **S4** | Minor cosmetic styling issue | 0 | 0 | **0** |

**Zero open S1/S2 issues.** The application meets the test gate requirements for parity diffing.
