# Permission matrix

The human-readable copy of the two authorization matrices. Both are mirrored in code, and both mirrors
must stay in step with this file.

| Axis | Backend | Frontend |
|---|---|---|
| System roles | `backend/.../auth/security/SystemAuthorization.java` | `src/app/features/auth/permissions.ts` |
| Work-management roles | `backend/.../auth/work/security/WorkAuthorization.java` | `src/app/features/work-done/permissions.ts` |

The two axes are independent. Every user holds exactly one of each: a system role in `users.role`, and a
work role in `users.work_role`. Being an Owner says nothing about whether you are a Manager on the work
board, and vice versa.

---

## System roles

| Role | Who creates it | In one sentence |
|---|---|---|
| `ROLE_ROOT` ("Owner") | The Tenant Access Management control plane, when it provisions the company | The company's own account — exactly one, and it cannot be created, demoted, disabled or deleted through the app |
| `ROLE_ADMIN` | The company's owner | Delegated operator: runs the business, but does not own the company |
| `ROLE_USER` | The owner or an admin | Day-to-day work: reads the catalogue and clients, works quotations and repair orders |

Every permission below is **company-scoped**. Nothing here grants cross-company reach — creating,
suspending and reactivating companies belongs to the control plane, not to this app.

### The matrix

| Permission | Owner | Admin | User |
|---|:--:|:--:|:--:|
| `USER_VIEW` | ✓ | ✓ | — |
| `USER_MANAGE` | ✓ | ✓ | — |
| `USER_MANAGE_ADMIN` | ✓ | — | — |
| `COMPANY_SETTINGS_MANAGE` | ✓ | — | — |
| `EMAIL_SETTINGS_MANAGE` | ✓ | — | — |
| `PRODUCT_VIEW` | ✓ | ✓ | ✓ |
| `PRODUCT_WRITE` | ✓ | ✓ | — |
| `CLIENT_VIEW` | ✓ | ✓ | ✓ |
| `CLIENT_WRITE` | ✓ | ✓ | — |
| `VENDOR_MANAGE` | ✓ | ✓ | — |
| `QUOTATION_VIEW` | ✓ | ✓ | ✓ |
| `QUOTATION_WRITE` | ✓ | ✓ | ✓ |
| `INVOICE_VIEW` | ✓ | ✓ | ✓ |
| `INVOICE_WRITE` | ✓ | ✓ | — |
| `FINANCE_VIEW` | ✓ | ✓ | — |
| `FINANCE_WRITE` | ✓ | ✓ | — |
| `REPAIR_VIEW` | ✓ | ✓ | ✓ |
| `REPAIR_WRITE` | ✓ | ✓ | ✓ |

Admin is Owner minus exactly three permissions — the ones that define the company or hand out control of
it. `USER_MANAGE_ADMIN` is owner-only because an admin able to mint admins would make the distinction
meaningless.

### Rules the matrix cannot express

These depend on *which* user is being acted upon, so they live in `UserService`:

- The owner account is visible in the user directory but **every mutation on it is refused (403)**. It
  maintains itself through `/api/users/me` and `/api/auth/change-password`.
- `ROLE_ROOT` can never be assigned through the API. That is what keeps "exactly one owner per company"
  true after migration `V10` established it.
- An admin cannot administer another admin.
- Nobody may demote or disable themselves.
- A user in another company reports as **not found**, never as forbidden.

There is deliberately no "last admin" guard: since the owner cannot be disabled or demoted, a company can
never lose administrative access, so the guard would only ever produce false refusals.

### How it is enforced

1. `UserDetailsServiceImpl` grants, at authentication, the role and every role it outranks (Owner also
   carries `ROLE_ADMIN` and `ROLE_USER`), plus one `PERM_*` authority per permission in the matrix.
2. `SecurityConfig` gates URLs on those `PERM_*` authorities, as one ordered, method-aware list.
3. `UserService` applies the resource-scoped rules above.
4. The frontend mirror decides only what the UI *offers*. The server refuses independently.

> A mock principal — `@WithMockUser(roles = "ADMIN")` — never passes through step 1 and so arrives with
> no permissions at all. Tests must grant the `PERM_*` authorities explicitly.

### Public surface

Reachable with no token, by design:

- `GET /api/products`, `/api/products/{id}`, `/api/products/images/**`, `/api/categories/**`, `/api/variants/**`
- `POST /api/quotations` — anonymous checkout
- `GET /api/quotations/{id}` — the confirmation page the customer was linked to
- `POST /api/auth/login`, `POST /api/auth/refresh`
- `/api/internal/**` — guarded by `X-Internal-Api-Key`, the control plane's provisioning channel

Note the quotation rule is `{id}`, not `/**`: the wildcard also matched the collection, which let
anonymous callers list every quotation.

---

## Work-management roles

Mirrored in `WorkAuthorization.java` and `features/work-done/permissions.ts`. Manager is the reference
role with full write access; HR is read-only except for its own personal tasks; Employee writes only
what it owns.

| Role | Shape of access |
|---|---|
| `MANAGER` | Every action |
| `HR` | Read-only across projects, tasks, time logs and reports; may create and view its own personal tasks |
| `EMPLOYEE` | Self-scoped writes — own tasks, own time logs, own checklist items; sees others' tasks read-only |

Some Employee actions carry a resource-scope check beyond the role bit (may edit *only their own* task).
That check lives in `can()` on both sides rather than in the matrix. For the per-action table, read
`permissions.ts` — it is the authoritative list and is kept deliberately explicit.
