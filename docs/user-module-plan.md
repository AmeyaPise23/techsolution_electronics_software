# User Module — Phased Implementation Plan

Target branch: `m2/user-module` (cut from `m1/foundations`).
Working assumption until you say otherwise: **root = platform operator spanning companies**, stored against a reserved `__PLATFORM__` company row. See Phase 0.

Every phase below is independently shippable, has its own gate, and touches only its own scope (per `CLAUDE.md`).

---

## Phase map

| Phase | Name | Breaking? | Depends on |
|---|---|---|---|
| 0 | Decisions & pre-flight audit ✅ | no | — |
| 1 | Role model foundation (schema + enums) ✅ | no | 0 |
| 2 | The company root account ✅ | no | 1 |
| 3 | Authentication hardening ✅ | no | 1 |
| 4 | User management API ✅ | no | 1, 2 |
| 5 | Endpoint authorization sweep ✅ | no, in the end | 1, 4 |
| ~~6~~ | ~~Platform / root API~~ — **cancelled**, the control plane owns company lifecycle | — | — |
| 7 | Frontend permission layer ✅ | no | 4 |
| 8 | Frontend screens ✅ | no | 7 |
| 9 | Test suite & rollout ✅ | no | all |

Phases 3 and 4 can run in parallel with each other. Phase 5 must not ship before Phase 8 is at least partially deployed, or admins lose UI affordances they still have API rights to.

---

## Phase 0 — Decisions & pre-flight audit

**Goal.** Lock the two design forks that change the schema, and find out who is currently affected.

**Steps.**

1. Answer the fork questions (§ *Open decisions* at the bottom). Only #1 and #2 block Phase 1; #3 blocks Phase 5.
2. Run the exposure audit against production data:
   ```sql
   SELECT company_id, role, work_role, enabled, COUNT(*)
   FROM users GROUP BY company_id, role, work_role, enabled;
   ```
   Every `ROLE_USER` row here is an account that today has effective admin rights on products, quotations, invoices, finance and repair orders — Phase 5 revokes that.
3. Confirm `ROLE_USER` accounts that must keep write access, and record the list in this doc before Phase 5.
4. Confirm whether `GET /api/quotations/**` being public is deliberate (the storefront `quotation-confirmation.tsx` page relies on it). If yes, Phase 5 narrows it to a share-token route rather than removing it.

**Acceptance.** Decisions recorded in this file; the role census pasted into the Phase 5 section.

**Gate.** None (no code).

### Phase 0 — RESULT (2026-08-28)

Census against the local `techsolution` database:

```
company_id  role        work_role  enabled  n
1           ROLE_ADMIN  EMPLOYEE   1        1
2           ROLE_ADMIN  EMPLOYEE   1        1
4           ROLE_ADMIN  EMPLOYEE   1        1

id  company_code  company_name      status
1   test-company  Test Company      ACTIVE
2   apple         apple             ACTIVE
4   AMEYAT-7490   Ameya Test Corp   ACTIVE
```

**There are no `ROLE_USER` accounts.** Every existing user is `ROLE_ADMIN`, one per company.
Consequences:

- **Phase 5 is not breaking in practice.** The `strict-authorization` flag stays in the design as a
  safety valve, but there is no migration window to plan and no account loses access.
- The `ROLE_USER` column of the Phase 5 matrix is a greenfield decision, not a revocation.
- No company currently has a second admin, so the last-admin guard in Phase 4 will fire on *every*
  company if someone tries to disable their only admin. That is correct behaviour, but it means the
  guard is on the hot path from day one and must be tested first, not last.
- Baseline test suite before any change: **26 tests, 0 failures**.

Decisions taken (defaults, per the recommendations in *Open decisions*):

1. Root = **platform operator spanning companies**.
2. Root stored against a reserved `__PLATFORM__` company row; `users.company_id` stays `NOT NULL`.
3. `ROLE_USER` matrix column as proposed in Phase 5.

---

## Phase 1 — Role model foundation

**Goal.** Introduce a real role/permission model in the type system and the schema, with **zero behaviour change**. Every existing login, token and endpoint keeps working identically.

**New files.**

- `backend/src/main/java/com/ecommerce/auth/enums/SystemRole.java`
  Enum `ROOT, ADMIN, USER`. Members: `authority()` → `"ROLE_ROOT"` etc., `rank()` (root 300 / admin 200 / user 100), `fromAuthority(String)` and `fromNullable(String)` that defaults to `USER` on unknown input (mirrors `CurrentActorService.parseWorkRole`, which already swallows bad values rather than throwing).
- `backend/src/main/java/com/ecommerce/auth/enums/Permission.java`
  The system-axis permission enum (see the matrix in Phase 5).
- `backend/src/main/java/com/ecommerce/auth/security/SystemAuthorization.java`
  `@Component("systemAuthz")`. Holds a `static final Map<SystemRole, EnumSet<Permission>>` built the same way `WorkAuthorization.build()` does. Public API:
  - `Set<Permission> permissionsFor(SystemRole)`
  - `boolean can(Permission)` / `boolean can(String)` — reads the `SecurityContext`, for SpEL use in `@PreAuthorize("@systemAuthz.can('USER_MANAGE')")`
  - `void require(Permission)` → throws `AccessDeniedException` (already mapped to 403 by `GlobalExceptionHandler`)
  Add the same "server-side mirror of `<frontend file>`" javadoc header that `WorkAuthorization` carries.
- `backend/src/main/resources/db/migration/V9__user_module_foundation.sql`

**Migration `V9` contents.**

```sql
ALTER TABLE users
    ADD COLUMN full_name             VARCHAR(120) NULL,
    ADD COLUMN phone                 VARCHAR(20)  NULL,
    ADD COLUMN password_updated_at   DATETIME     NULL,
    ADD COLUMN failed_login_attempts INT          NOT NULL DEFAULT 0,
    ADD COLUMN locked_until          DATETIME     NULL,
    ADD COLUMN must_change_password  TINYINT(1)   NOT NULL DEFAULT 0;

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_role ON users(company_id, role);

-- Normalise any stray values written before ALLOWED_ROLES was enforced.
UPDATE users SET role = 'ROLE_USER' WHERE role NOT IN ('ROLE_ADMIN','ROLE_USER');

CREATE TABLE user_audit_log (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id     BIGINT       NULL,
    actor_user_id  BIGINT       NULL,
    target_user_id BIGINT       NULL,
    action         VARCHAR(40)  NOT NULL,
    detail         JSON         NULL,
    ip_address     VARCHAR(45)  NULL,
    created_at     DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_ual_company_created (company_id, created_at),
    INDEX idx_ual_target (target_user_id),
    INDEX idx_ual_action (action)
);
```

`user_audit_log` deliberately has **no** FK on `actor_user_id` / `target_user_id` — audit rows must survive a user row being removed.

**Modified files.**

- `entity/User.java` — add the six new columns with getters/setters. Keep `role` as `String` at the JPA layer (avoids a converter migration); convert at the service boundary via `SystemRole.fromNullable()`. Add a transient `systemRole()` helper.
- `service/UserDetailsServiceImpl.java` — grant `SystemRole.authority()` **plus** one `SimpleGrantedAuthority("PERM_" + p.name())` per permission from `SystemAuthorization`. Replace the `Collections.singletonList` call. Also stop throwing `UsernameNotFoundException` for a disabled user — use `.disabled(!user.isEnabled())` and `.accountLocked(lockedUntil != null && lockedUntil.isAfter(now))` so Phase 3 can distinguish 401 from 403/423.
- `config/SecurityConfig.java` — add a `RoleHierarchy` bean (`ROLE_ROOT > ROLE_ADMIN > ROLE_USER`) and the matching `MethodSecurityExpressionHandler`; change `hasRole("SUPER_ADMIN")` at line 105 to `hasRole("ROOT")`. **Do not touch the request matcher list yet** — that is Phase 5.
- `entity/UserAuditLog.java` + `repository/UserAuditLogRepository.java` (Pageable listing only) + `service/UserAuditService.java` with a single `record(action, actorId, targetId, detail)` method. Nothing calls it until Phase 4.

**Acceptance criteria.**

- `mvn test` green with no test changes.
- An existing admin logs in and every screen behaves exactly as before.
- A JWT issued pre-migration still authenticates (the filter reloads from DB, so this holds).
- `SystemAuthorization.permissionsFor(ADMIN)` returns the Phase 5 matrix row.

**Gate.** `cd backend && mvn test` · `npm run build` (no FE change, just proving nothing broke).

**Risk.** Low. The only runtime change is extra granted authorities, which nothing reads yet.

### Phase 1 — RESULT (2026-08-28) ✅

Shipped as designed, with two deviations, both noted below.

**Added**

- `enums/SystemRole.java` — ROOT(300) / ADMIN(200) / USER(100), `impliedAuthorities()`,
  strict `fromAuthority` for the write path and lenient `fromNullable` for the read path.
- `enums/Permission.java` — 20 permissions.
- `enums/UserAuditAction.java` — the audit vocabulary.
- `security/SystemAuthorization.java` — bean `systemAuthz`, the matrix, `can(...)`/`require(...)`.
- `entity/UserAuditLog.java`, `repository/UserAuditLogRepository.java`, `service/UserAuditService.java`.
- `db/migration/V9__user_module_foundation.sql`.
- `SystemAuthorizationTest` — 11 tests.

**Changed**

- `entity/User.java` — six new columns plus `systemRole()`, `lockedNow()`, `displayName()`.
- `service/UserDetailsServiceImpl.java` — grants implied role authorities **and** `PERM_*`;
  reports disabled/locked through UserDetails flags instead of throwing; constructor injection.
- `security/JwtAuthenticationFilter.java` — skips authentication for disabled/locked accounts.
- `config/SecurityConfig.java` — `hasRole("SUPER_ADMIN")` → `hasRole("ROOT")`.

**Deviation 1 — no `RoleHierarchy` bean.** The plan called for one. Instead `SystemRole.impliedAuthorities()`
grants the role *and every role it outranks* at authentication time. A `RoleHierarchy` bean has to be wired
into the filter chain and into method security separately and fails silently if either half is missed;
granting implied authorities is one mechanism that is effective everywhere. Same outcome, fewer ways to get
it wrong.

**Deviation 2 — a defect the plan would have introduced.** Switching `UserDetailsServiceImpl` from
"throw `UsernameNotFoundException` for a disabled user" to "return a UserDetails with `disabled=true`" is
required for Phase 3 to answer 403 instead of 401. But `JwtAuthenticationFilter` set the authentication
unconditionally, so on the bearer path that change would have **re-enabled disabled users' unexpired
tokens**. The filter now checks `isEnabled()` / `isAccountNonLocked()` before authenticating. Phase 3 must
not undo this.

**Verification**

- `mvn test` — 37 tests, 0 failures (26 baseline + 11 new).
- `npm run build` — clean.
- V9 applied to the real `techsolution` database on backend boot: `flyway_schema_history` rank 9,
  success=1, 703 ms. The app then passed Hibernate's `ddl-auto=validate` against the new entity, which is
  the real proof that migration and entity agree — the H2 test profile has Flyway disabled and builds its
  schema from entities, so it could never have caught a mismatch.
- Live smoke: `GET /api/products` 200, `GET /api/users` (no token) 401.

**Unrelated finding.** `GET /actuator/health` returns 500. `SecurityConfig` permits the path but
`spring-boot-starter-actuator` is not a dependency, so it falls through to the exception handler.
Pre-existing; not touched.

---

## Phase 2 — The company root account

**Decided 2026-08-28 (supersedes the original Phase 2 and cancels Phase 6).**
Root is *the company's own account* — the one the control plane creates when it provisions the company.
One per company, full access inside it, and no reach outside it. There is no platform-operator tier and no
`__PLATFORM__` company: company lifecycle stays with the Tenant Access Management service, which already
owns it and reaches this service through `/api/internal/provision`.

The resulting model, in the user's words: *you* create companies and manage company access; *the company*
creates its own users (admin, user).

| Role | Who creates it | Can do |
|---|---|---|
| `ROLE_ROOT` | the control plane, at provisioning | everything in the company, including granting ADMIN and changing company/email settings |
| `ROLE_ADMIN` | the company's root | everything except granting ADMIN and company/email settings |
| `ROLE_USER` | root or an admin | day-to-day operations only |

**Steps.**

1. `Permission` — drop `PLATFORM_COMPANY_MANAGE` and `PLATFORM_TENANT_SWITCH`; add `USER_MANAGE_ADMIN`
   (granting ADMIN is the privilege-escalation edge and must be root-only).
2. `SystemAuthorization` — ROOT gets everything; ADMIN gets everything except `USER_MANAGE_ADMIN`,
   `COMPANY_SETTINGS_MANAGE`, `EMAIL_SETTINGS_MANAGE`; USER unchanged.
3. `InternalProvisionController` — the founding account is created `ROLE_ROOT`, not `ROLE_ADMIN`.
4. `V10__company_root_role.sql` — promote each existing company's founding account to `ROLE_ROOT`.
5. `SecurityConfig` — delete the `/api/admin/companies/**` matcher; it pointed at a controller that
   never existed and now never will.

**Not built** (from the superseded plan): `V9_1__PlatformCompany.java`, `RootBootstrapRunner`,
`PlatformCompanyService`, `CompanyRepository.findByCompanyCodeNot`, the `APP_ROOT_*` env vars.

### Phase 2 — RESULT (2026-08-28) ✅

**Changed** — `enums/Permission.java`, `security/SystemAuthorization.java`,
`controller/InternalProvisionController.java`, `config/SecurityConfig.java`,
`SystemAuthorizationTest` (+1 test asserting no `PLATFORM_*` permission can reappear).
**Added** — `db/migration/V10__company_root_role.sql`.

**Promotion rule.** The founding account is `MIN(id)` per company, not an email match. Email is not a
usable key: the provisioning payload carries `adminEmail` separately from `companyEmail`, and they diverge
in real data — companies `AMEYAT-7490` and `NOVASY-4459` both have an admin address different from the
company's, while `test-company` and `apple` happen to match. Keying on email would have promoted two of
four companies and silently left the rest without a root.

**Verification**

- `mvn test` — 38 tests, 0 failures.
- `npm run build` — clean.
- V10 rehearsed against a full-data clone seeded with a *second* admin and a plain user in company 1:
  only the founding account was promoted; the later admin stayed `ROLE_ADMIN`, the plain user stayed
  `ROLE_USER`. Post-migration invariant held — exactly one root per company across all four.

**Open invariant for Phase 4.** Nothing yet enforces "exactly one root per company" or protects the root
account from being demoted, disabled or deleted through `/api/users`. V10 establishes the state; Phase 4
must add the guards. Until then the invariant is convention, not constraint.

---

## Phase 3 — Authentication hardening

### Phase 3 — RESULT (2026-08-28) ✅

**Added** — `validator/PasswordPolicyValidator.java`, `service/LoginAttemptService.java`,
`dto/ChangePasswordRequest.java`, `enums/LoginMode.java`, `backend/.env.example`,
`PasswordPolicyValidatorTest` (6 tests), `AuthenticationIntegrationTest` (14 tests).

**Changed** — `controller/AuthController.java` (rewritten), `exception/GlobalExceptionHandler.java`,
`security/JwtTokenProvider.java`, `dto/LoginRequest.java`, `dto/LoginResponse.java`,
`repository/UserRepository.java`, `controller/UserController.java`, `dto/CreateUserRequest.java`,
`dto/UpdateUserRequest.java`, `application.properties`, `TenantIsolationTest` (fixtures).

**Status codes.** `AuthController.login` no longer wraps everything in `catch (Exception)`.
Bad password → 401, disabled → 403, locked → 423, anything unexpected → 500. Previously all four were
400 "Invalid username or password".

**Lockout.** 5 consecutive failures lock the account for 15 minutes
(`app.security.max-login-attempts`, `app.security.lockout-minutes`). Enforced by
`DaoAuthenticationProvider` via the `accountLocked` flag, so it applies before the password is compared.
Locks expire by timestamp; the counter clears lazily on the next attempt.

**Password policy.** Min 10 chars, at least one letter and one digit, not equal to the username, max 72
(bcrypt truncates beyond that). Applied on change; Phase 4 applies it to create and reset.
`/api/internal/provision` deliberately does **not** apply it — it is a trusted machine-to-machine path
owned by the control plane, and imposing the rule there would break that contract unilaterally.

**Session lifecycle.** `POST /api/auth/change-password` requires the current password and revokes every
refresh token. `/api/auth/refresh` now rejects disabled and locked accounts and revokes their token family.

**Secret to env.** `app.jwt.secret=${APP_JWT_SECRET:}` with no committed default; `JwtTokenProvider`
fails startup if unset or under 32 bytes. The old literal is in git history and must be treated as
compromised. Also removed a no-op base64 encode/decode round trip in the key derivation — the key bytes
are unchanged, so tokens signed before this still verify.

**CORS.** Removed `@CrossOrigin(origins = "*")` from `AuthController` and the localhost variant from
`UserController`; the `CorsConfigurationSource` bean is now the only CORS policy.

### Root vs user sign-in (added mid-phase on the user's request)

AWS-style split. `LoginRequest` gains optional `companyCode` and `loginAs` (`ROOT` | `USER`):

- **Root card** — email address, no company code. Must resolve to a `ROLE_ROOT` account.
- **User card** — company code + username. Must resolve to a non-root account.
- Both fields absent → unconstrained, so existing clients keep working.

A wrong-form rejection is deliberately **not** counted toward lockout. Counting it would let anyone who
knows an email address lock the account out by submitting it on the wrong card five times, with no
password. The two-card UI is Phase 8.

### Three defects found by the tests

1. **The lockout never locked.** `LoginAttemptService.onFailure` threw `LockedException` — a
   `RuntimeException` — from inside `@Transactional`, so Spring rolled back the very row it had just
   written. The counter and `locked_until` were discarded, and the next attempt with the correct password
   succeeded. Fixed with `@Transactional(noRollbackFor = LockedException.class)`; the attribute is
   load-bearing and commented as such.
2. **The company code was decorative.** When a scoped lookup found nothing, `resolveUsername` fell through
   to the raw identifier — and usernames are globally unique, so any username authenticated under any
   company code. Now a scoped miss is a hard rejection.
3. **`TenantIsolationTest` regression.** Raising `CreateUserRequest` to `@Size(min = 10)` broke fixtures
   using 8-character passwords. The test is about tenant scoping, so the fixtures were updated rather than
   the policy relaxed.

**Verification** — `mvn test` 58 tests, 0 failures (was 38). `npm run build` clean.

### ⚠ Action required before the next backend start

`APP_JWT_SECRET` is now mandatory. The service will refuse to start without it.

```
openssl rand -base64 48
```

Export it as `APP_JWT_SECRET`. Because the previous key is committed in git history, generating a fresh
one is the right call — it invalidates access tokens in circulation, so all four existing users sign in
again once.

---

## Phase 4 — User management API

**Goal.** Turn `/api/users` from "admin CRUD" into a real account-administration surface with the guardrails that make a three-tier role model safe.

**DTO changes.**

- `UserResponse` += `fullName`, `phone`, `workRole`, `companyId`, `lockedUntil`, `mustChangePassword`, `passwordUpdatedAt`.
- `CreateUserRequest` += `fullName`, `phone`, `workRole` (defaults `EMPLOYEE`); `role` validated against `SystemRole`, not the current `Set.of("ROLE_ADMIN","ROLE_USER")` string set.
- `UpdateUserRequest` += `fullName`, `phone`, `workRole`. **Remove `password`** — password changes move to the dedicated reset/change endpoints so they can be audited and can revoke sessions distinctly.
- New `ResetPasswordRequest` `{newPassword, requireChangeOnNextLogin}`.
- New `UserSearchCriteria` `{search, role, enabled, workRole}`.

**Service rules — each one gets a test.**

| Rule | Enforcement point |
|---|---|
| ADMIN may only create/edit `ROLE_ADMIN` and `ROLE_USER` | `validateRole` replaced by `validateAssignableRole(actor, target)` |
| ADMIN may never read, edit, disable or delete a `ROLE_ROOT` user | `findUserInCompany` filters root; listings exclude root |
| ROOT users never appear in company-scoped listings | repository predicate `role <> 'ROLE_ROOT'` |
| No self-demotion, no self-disable | compare target id to actor id |
| Last-admin guard: cannot disable or demote the final enabled ADMIN of a company | `countByCompanyIdAndRoleAndEnabledTrue` before the write |
| Role change, disable, or password reset revokes refresh tokens | `refreshTokenService.revokeAllForUser` in each path |
| Every mutation writes a `user_audit_log` row | `UserAuditService.record(...)` |

Today `deleteUser` disables without revoking, and `updateUser` changes roles without revoking — both are fixed here.

**Endpoints.**

| Method | Path | Guard |
|---|---|---|
| `GET` | `/api/users` (+ `search`, `role`, `enabled`, Pageable) | `USER_VIEW` |
| `GET` | `/api/users/{id}` | `USER_VIEW` |
| `POST` | `/api/users` | `USER_MANAGE` |
| `PUT` | `/api/users/{id}` | `USER_MANAGE` |
| `DELETE` | `/api/users/{id}` (soft — disables) | `USER_MANAGE` |
| `POST` | `/api/users/{id}/reset-password` | `USER_MANAGE` |
| `POST` | `/api/users/{id}/unlock` | `USER_MANAGE` |
| `GET` | `/api/users/{id}/audit` (Pageable) | `USER_MANAGE` |
| `GET` | `/api/users/me` | authenticated |
| `PUT` | `/api/users/me` (fullName, phone, email only) | authenticated |

**Repository.** Add `JpaSpecificationExecutor<User>` and `countByCompanyIdAndRoleAndEnabledTrue`. Search goes through a `UserSpecifications` class — **not** `findAll()` + Java filtering (project hard rule).

**Controller.** Drop the class-level `@PreAuthorize("hasRole('ADMIN')")` in favour of per-method `@PreAuthorize("@systemAuthz.can('...')")`, so `/me` can be exempt.

**Acceptance criteria.**

- An admin cannot see or touch a root user, by id or by listing.
- An admin cannot disable themselves, nor the last remaining admin.
- Resetting a password forces re-login on the target's next request.
- `GET /api/users?search=foo` produces a single paged SQL query (verify with `spring.jpa.show-sql`).
- Every mutation leaves an audit row.

**Gate.** `cd backend && mvn test` with the new `UserServiceTest`.

**Risk.** Low-medium. Removing `password` from `UpdateUserRequest` breaks `admin-users.tsx`, which sends it today — Phase 8 fixes the caller, so either ship them together or keep the field accepted-and-ignored for one release.

---

## Phase 5 — Endpoint authorization sweep

### Phase 5 — RESULT (2026-08-28) ✅

**Added** — `PublicSurfaceTest` (7 tests), `RoleAuthorizationTest` (7 tests).
**Changed** — `config/SecurityConfig.java` (authorization rules rewritten),
`components/admin-layout.tsx`, `services/userService.ts`, `ProductControllerTest` (fixture).

### Two leaks, confirmed before they were closed

The assertions were written first and run against the old config, so the exposure is a measurement
rather than a claim:

| Request | Before | After |
|---|---|---|
| `GET /api/clients` (no token) | **200** | 401 |
| `GET /api/quotations` (no token) | **200** | 401 |

`/api/clients/**` was `permitAll()` on every method — unauthenticated CRUD on customer records.
Every caller in the frontend already used `authenticatedFetch`, so nothing depended on it.

The quotation leak was subtler and worse than the plan described. The rule was
`.requestMatchers(HttpMethod.GET, "/api/quotations/**").permitAll()`, and `/**` matches the collection
as well as its members — so anonymous callers could list **every quotation**, and with no token there is
no `TenantContext`, so the tenant filter was not applied either. Narrowed to
`GET /api/quotations/{id}`, which is all the public confirmation page ever fetches.

The other five probes already passed: quotation mutations, customer contacts, invoices, finance, repair
orders and users were covered by the `/api/**` authenticated floor.

### Deviation — rules in SecurityConfig, not `@PreAuthorize` on 13 controllers

The plan called for per-controller annotations. That would have broken the storefront: **method security
applies even to `permitAll` URLs**, so a class-level `@PreAuthorize` on `ProductController` would have
made anonymous product browsing 403. Getting it right would have meant annotating individual methods
across 13 controllers and hoping none were missed.

Instead the whole policy is one ordered, method-aware list in `SecurityConfig`, keyed on the `PERM_*`
authorities that `UserDetailsServiceImpl` projects from the matrix. It is auditable at a glance, and the
public/private split is explicit rather than emergent.

### Deviation — no `strict-authorization` feature flag

The plan wanted a flag to stage the rollout. Phase 0 established there are **zero `ROLE_USER` accounts**,
so there is no population to stage and nothing to roll back to. A switch whose off position disables
authorization is a liability that outlives the migration it was meant to smooth. Dropped.

### Correction to the plan — `CustomerContactController`

The plan said to narrow its bare `/api` class mapping. Doing so would have broken
`/api/customers/{id}/contacts`, which does not sit under a `/customer-contacts` prefix. The mapping is
left alone and its routes are enumerated individually in the rules instead.

### Sharp edge worth knowing

Authorization now depends on `PERM_*` authorities, and only `UserDetailsServiceImpl` produces them.
`@WithMockUser(roles = "ADMIN")` does not — a mock principal never passes through that projection and
arrives with no permissions. `ProductControllerTest.deleteProduct_pathVariable` began failing 403 for
exactly this reason; the fixture now grants `{"ROLE_ADMIN", "PERM_PRODUCT_WRITE"}`. Production paths are
unaffected: both the login flow and the JWT filter load through `UserDetailsServiceImpl`.

### Live frontend breakage caused by Phase 2, fixed here

`admin-layout.tsx` gated two nav items on `user?.role === "ROLE_ADMIN"`. After V10 promoted every
provisioned account to `ROLE_ROOT`, that predicate was false for **every existing user**, so "Team" and
"Email" would have silently disappeared. "Company" was ungated entirely and would have shown a
`ROLE_USER` a link that now returns 403.

Navigation now uses `canManageUsers` / `canManageCompany` helpers in `userService.ts`, mirroring the
server matrix. Phase 7 replaces them with the full generated mirror; they exist now so nothing keys off a
bare role string.

**Verification** — `mvn test` 88 tests, 0 failures (was 74). `npm run build` clean.
Note the frontend gate does not type-check: `npm run build` is bare `vite build` and TypeScript is not a
project dependency, so esbuild strips types without checking them.

---

## Phase 6 — Platform / root API — **CANCELLED (2026-08-28)**

Dropped on the user's decision: company lifecycle belongs to the Tenant Access Management control plane,
which already provisions companies through `/api/internal/provision`. Building
`PlatformCompanyController` here would have been a second source of truth for tenants.

Consequently there is no `X-Company-Id` tenant switching, no cross-company reads, and no permission in
`Permission` that spans companies — `SystemAuthorizationTest.noPermissionSpansCompanies` fails the build
if one is reintroduced.

Phase 8's `root-companies.tsx` page is cancelled with it.

---

## Phase 7 — Frontend permission layer

### Phase 7 — RESULT (2026-08-28) ✅

**Added** — `src/app/features/auth/types.ts` (SystemRole mirror, `toSystemRole`, `roleLabel`),
`src/app/features/auth/permissions.ts` (the matrix mirror, `can`, `permissionsFor`),
`docs/permission-matrix.md`.

**Changed** — `context/AuthContext.tsx` (rewritten), `services/authService.ts`,
`services/userService.ts`, `components/admin-layout.tsx`.

**`AuthContext` now exposes** `role`, `roleLabel`, `isRoot`, `isAdmin`, `mustChangePassword`,
`can(permission)` and `refresh()`. It paints immediately from local storage, then reconciles against
`GET /api/auth/me`. Local storage only records what was true at sign-in, so a role change, a disable or a
forced reset would otherwise stay invisible until the next login. A failed reconcile keeps the cached
view rather than signing the user out — a dropped connection is not proof of a bad session, and
`authenticatedFetch` already handles a genuinely rejected token.

**`authService`** gained `fetchMe`, `changePassword`, and an `AuthError` carrying the HTTP status so the
sign-in screen can distinguish 401 / 403 / 423 — the distinction Phase 3 created on the server would
otherwise be collapsed again in the client. `LoginRequest` gained `companyCode` and `loginAs` for the
two-card sign-in. `authenticatedFetch` now documents why only 401 triggers a refresh: a 403 means the
session is fine and the permission is not.

**`userService.parseJsonResponse`** now surfaces per-field validation errors. The backend puts a
field→message map in `ApiResponse.data`; the old parser read only `message` and dropped it silently.

**Navigation** switched from the temporary `canManageUsers`/`canManageCompany` helpers introduced in
Phase 5 to `can("USER_VIEW")`, `can("COMPANY_SETTINGS_MANAGE")`, `can("EMAIL_SETTINGS_MANAGE")`. The
helpers are deleted. Also replaced the hardcoded `"Ameya Pise"` fallback in the sidebar with the role
label.

**`docs/permission-matrix.md`** now exists. `features/work-done/permissions.ts` has referenced this path
since Phase 0 of the work module and the file had never been written; it now documents both axes.

### Verification, and its limit

`npm run build` is clean, but **the project has no TypeScript configuration at all** — no `tsconfig.json`,
and TypeScript is not a dependency. `vite build` hands `.ts`/`.tsx` to esbuild, which strips types without
checking them. There is no type-checking gate to pass, so none of this frontend work is type-verified.

In its place, the dev server was run and the changed paths exercised in a browser:

- `/admin/login` renders.
- `/admin/users` correctly redirects to sign-in when unauthenticated, which exercises `ProtectedRoute`
  → `useAuth` → the new `AuthContext` hydration path.
- Console filtered for `AuthContext|useAuth|permissions|Cannot read`: **no matches**. The only console
  errors are `ERR_CONNECTION_REFUSED` from the backend being down, unrelated to these changes.

Adding `typescript` plus a `tsconfig.json` would make the frontend gate mean something for Phase 8, which
is larger and more UI-heavy. Worth doing, but it is a project-level change rather than part of this phase.

---

## Phase 8 — Frontend screens

### TypeScript added first (2026-08-28)

Phases 7 and 8 are frontend-heavy and the project had **no type-checking at all** — no `tsconfig.json`,
and TypeScript was not a dependency, so `vite build` handed everything to esbuild, which strips types
without checking them. Added at the user's request before starting this phase.

- Installed `typescript@5.6`, `@types/react@18.3`, `@types/react-dom@18.3`, `@types/node@22`.
  The transitive `@types/react` was **19.2.17** against React **18.3.1** — a mismatch that would have
  produced spurious errors.
- `tsconfig.json` with `strict: false`. Full strict on a never-checked codebase buries real defects under
  a backlog of pre-existing noise; this catches genuine bugs now and can tighten later.
  `noImplicitReturns` is deliberately off — it fires on the idiomatic
  `useEffect(() => { if (!x) return; ... })` early-return throughout this codebase, which is correct React.
- `npm run build` is now `tsc --noEmit && vite build`, so the project's own gate has teeth.
  `npm run typecheck` added for the check alone.
- Excluded `src/imports/pasted_text/` — a single unreferenced Figma paste
  (`finance-module.tsx`) that does not parse, contributing **421** of the initial 421 errors on its own.
  Nothing imports it and Vite never bundles it. **Deletion candidate, left in place.**

Once configured, the whole application type-checked with **2 genuine pre-existing errors**, both fixed:

| File | Defect |
|---|---|
| `pages/finance-invoice-create.tsx` | The empty-state invoice row omitted `uom`, which `InvoiceItem` requires — a blank invoice carried no unit of measure |
| `pages/finance-invoices.tsx` | The aging memo returned two differently-shaped arrays, so `in`-narrowing typed `item.percentage` as `unknown` |

Both are outside this module's scope, but they blocked the gate the user had just asked for.

### Phase 8 — RESULT (2026-08-28) ✅

**Added** — `components/Forbidden.tsx`, `pages/account-security.tsx`.
**Changed** — `pages/admin-login.tsx` (rewritten), `components/ProtectedRoute.tsx`, `routes.tsx`,
`components/admin-layout.tsx`.

**Two-card sign-in.** The AWS root/IAM split the user asked for:

| Card | Identifier | Sends |
|---|---|---|
| **Owner** | email address | `loginAs: "ROOT"` |
| **Team member** | company code + username | `loginAs: "USER"`, `companyCode` |

The company code plays the part of an IAM account id. The backend enforces the split — the owner card
cannot sign in a team member and vice versa — so it is a real boundary, not a UI convention. On a 401
from the owner card the message adds a pointer to the other tab, since choosing the wrong card is the
likeliest cause.

Removed the "Remember me" checkbox: it was wired to state that nothing ever read.

**`ProtectedRoute`** gained `requiredPermission`. Three outcomes now, where before there was one:

- not signed in → redirect to sign-in, remembering the destination
- `mustChangePassword` → redirect to `/admin/account/security`, and nothing else is reachable
- signed in without the permission → render `<Forbidden />`, **not** a redirect to sign-in. Bouncing an
  authenticated user to a login form implies their session expired and invites them to re-enter
  credentials that were never the problem.

**Routes gated** — `users` (`USER_VIEW`), `company-settings` (`COMPANY_SETTINGS_MANAGE`),
`email-settings` (`EMAIL_SETTINGS_MANAGE`), and six `finance/*` pages (`FINANCE_VIEW`).
`account/security` is deliberately ungated: every signed-in user owns an account, and it is where
`ProtectedRoute` sends anyone with `mustChangePassword`, so gating it would deadlock them.

**Account security page** — change password with a client-side mirror of `PasswordPolicyValidator`, plus
last sign-in and last password change. On success it signs the user out, because the change revoked every
refresh token including this session's.

**Verification**

- `npm run typecheck` clean; `npm run build` clean (now type-checking).
- Dev server driven in a browser: the Owner card renders an email field; clicking **Team member**
  switches the form to company code + username; no console errors beyond the backend being down.

---

## Phase 9 — Test suite & rollout

### Phase 9 — RESULT (2026-08-28) ✅

**Added** — `PermissionMatrixParityTest` (4 tests).

Two hand-maintained copies of one table drift; that is the known failure mode of the mirror pattern, and
it fails silently — the UI offers a button the server refuses, or hides one the user is entitled to. The
test parses `src/app/features/auth/permissions.ts` and compares it to `SystemAuthorization`, checking:

1. the mirror declares exactly the backend's permissions, no more and no fewer;
2. every role grants the same set on both sides;
3. the three owner-only permissions stay owner-only;
4. no `PLATFORM_*` permission reappears, which would imply cross-company reach.

**The test was verified to actually fail.** A parity test that only ever passes proves nothing, so drift
was injected — granting `ADMIN` the owner-only `USER_MANAGE_ADMIN` in the mirror — and two assertions
failed with:

```
ADMIN has drifted.
  Offered by the UI but refused by the server: [USER_MANAGE_ADMIN]
```

The mirror was then restored and confirmed byte-identical.

**Not built, and why**

- `RootAccessTest` — cancelled with Phase 6. There is no cross-company root to test.
- The planned `TenantIsolationTest` extension for cross-company user access — already covered by
  `UserManagementIntegrationTest.crossCompanyAccessIsNotFound`. A second copy would add no signal.

### Final verification

| Gate | Result |
|---|---|
| `cd backend && mvn test` | **92 tests, 0 failures** (26 at baseline) |
| `npm run build` | clean — and now runs `tsc --noEmit` first |
| `npm run typecheck` | clean |

New test classes: `SystemAuthorizationTest` (12), `PasswordPolicyValidatorTest` (6),
`AuthenticationIntegrationTest` (14), `UserManagementIntegrationTest` (16), `PublicSurfaceTest` (7),
`RoleAuthorizationTest` (7), `PermissionMatrixParityTest` (4).

---

## Rollout

### Before the backend will start

`APP_JWT_SECRET` is mandatory — `JwtTokenProvider` fails startup without it, by design.

```
openssl rand -base64 48
```

The previous key was committed to git and must be treated as compromised, so generate a fresh one rather
than reusing it. Access tokens in circulation stop verifying; all four users sign in once more.

### Migration state as of this writing

`flyway_schema_history` shows **V9 applied, V10 not yet**. V10 is the one that promotes each company's
founding account to `ROLE_ROOT`, and it has not run because the backend has not started since it was
written. All four users are still `ROLE_ADMIN`.

Flyway runs at startup before the service accepts requests, so V10 applies automatically on the next
successful boot and the ordering is safe. But note what would happen if the app somehow served traffic
without it: the owner-only rules added in Phase 5 (`/api/company/**` requires
`PERM_COMPANY_SETTINGS_MANAGE`) would refuse every existing user, because none of them is `ROLE_ROOT`
yet. Confirm V10 is present after the first boot:

```
SELECT version, description, success FROM flyway_schema_history WHERE version = '10';
SELECT id, username, role, company_id FROM users ORDER BY company_id, id;
```

Expect exactly one `ROLE_ROOT` per company.

### What changes for the people using it

- The four existing accounts become **owners** of their companies. They gain nothing they did not have;
  the role simply names what they already were.
- Company and email settings become **owner-only**. No current user loses access, because every current
  user is an owner — but a future admin will not have it.
- No `ROLE_USER` account exists, so the Phase 5 authorization sweep revokes nothing from anyone.
- Sign-in now has two cards. Existing users are owners and use the **Owner** card with their email
  address; the username still works on the unconstrained path.
- Passwords must now be at least 10 characters with a letter and a digit. Existing passwords are
  unaffected until they are next changed.
- Five failed sign-ins lock an account for 15 minutes.

### Left for you

- Set `APP_JWT_SECRET` and start the backend (applies V10).
- `src/imports/pasted_text/finance-module.tsx` is unreferenced and does not parse. It is excluded from
  type-checking; deleting it would be tidier, but that is your call.
- `/actuator/health` returns 500: `SecurityConfig` permits the path but
  `spring-boot-starter-actuator` is not a dependency. Pre-existing, untouched.
- Consider tightening `tsconfig.json` toward `strict: true` over time.
