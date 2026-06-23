# Current Situation Analysis - Rent City

Last updated: 2026-06-08, Asia/Saigon.

This document is a fresh snapshot after the team's recent progress. The previous analysis was centered on user/auth only and is now stale: the project now includes real backend modules for cars, branches, categories, bookings, payments, invoices, and admin dashboard/reporting.

## 1. Executive Summary

Rent City is now a fuller car-rental web application with:

- Backend: Spring Boot API under `backend/`, PostgreSQL, JPA, Spring Security, JWT, file upload, PDF invoice generation.
- Frontend: React 19, TypeScript, Vite 8, Tailwind, React Router, Axios, Sonner, Framer Motion, PayPal package.
- Database: local PostgreSQL via Docker Compose on host port `5434`.
- API base URL: `http://localhost:8081/api`.

The project has moved beyond mock-only domain flows. Vehicle/catalog, booking, payment, branch/category, dashboard, and invoice backend code exists and compiles. Frontend integration is partially connected to these APIs, especially cars, bookings, payments, profile, admin vehicles, admin bookings, admin payments, branches, and categories.

However, the application is not yet clean/ready:

- Backend smoke test now passes when Docker PostgreSQL is running with the expected `rentcity_user / rentcity_pass` role.
- Frontend build fails on unused variables in newly touched admin/payment pages.
- Frontend lint still has React Compiler/ESLint issues.
- Some frontend admin endpoints do not match backend routes.
- Admin users page has frontend code but no matching backend controller found.
- Payment flow is still mock/sandbox-style, not a real gateway integration.
- New unpaid bookings are held for 15 minutes and automatically cancelled after the payment deadline.
- Many Vietnamese strings/comments are mojibake in source files and UI text.

## 2. Repository Layout

Important folders/files:

- `backend/`: Spring Boot backend project.
- `backend/pom.xml`: Maven backend dependencies and Java release config.
- `backend/src/main/java/com/rentcity/Rentcity`: backend source.
- `backend/src/main/resources/application.yml`: default backend config.
- `backend/src/main/resources/application-sandbox.yml`: sandbox payment config draft.
- `frontend/`: React/Vite frontend project.
- `frontend/src`: frontend source.
- `docker-compose.yml`: local PostgreSQL container.
- `current-situation-analyze.md`: this current snapshot.
- `booking-implement-plan.md`: older booking implementation plan; many planned items are now implemented.
- `user-auth-improvements.md`: older user/auth local development snapshot.

Git status at inspection time:

- `target/` is untracked at repo root and appears to be generated build output from an older/root-level backend layout.
- Running backend verification also generated `backend/target/`, likely ignored by git.

## 3. Backend Current State

### 3.1 Stack and Config

Backend stack:

- Spring Boot `3.5.14`
- Maven compiler release `17`
- Runtime observed during test: Java `21.0.8`
- Spring Web
- Spring Data JPA
- Spring Validation
- Spring Security
- PostgreSQL driver
- Lombok
- JJWT `0.11.5`
- Apache PDFBox `2.0.32`

Default backend config in `backend/src/main/resources/application.yml`:

```yaml
server:
  port: 8081
  servlet:
    context-path: /api

spring:
  profiles:
    active: dev
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://127.0.0.1:5434/rentcity}
    username: ${SPRING_DATASOURCE_USERNAME:rentcity_user}
    password: ${SPRING_DATASOURCE_PASSWORD:rentcity_pass}
```

Local database config in `docker-compose.yml`:

- Container: `rentcity_postgres`
- Image: `postgres:15-alpine`
- Host port: `5434`
- DB: `rentcity`
- User: `rentcity_user`
- Password: `rentcity_pass`

### 3.2 Backend Modules Now Present

Entities:

- `User`
- `TokenBlacklist`
- `UserDocument`
- `Branch`
- `CarCategory`
- `Car`
- `CarImage`
- `Booking`
- `BookingStatusHistory`
- `Payment`

Enums:

- `Role`
- `KycStatus`
- `Transmission`
- `CarStatus`
- `PricingMode`
- `BookingStatus`
- `DepositStatus`
- `PaymentType`
- `PaymentGateway`
- `PaymentStatus`

Repositories:

- `UserRepository`
- `TokenBlacklistRepository`
- `UserDocumentRepository`
- `BranchRepository`
- `CarCategoryRepository`
- `CarRepository`
- `CarImageRepository`
- `BookingRepository`
- `BookingStatusHistoryRepository`
- `PaymentRepository`

Services:

- `AuthService`
- `UserService`
- `FileStorageService`
- `BranchService`
- `CategoryService`
- `CarService`
- `BookingAvailabilityService`
- `BookingPricingService`
- `BookingCancellationPolicyService`
- `BookingExpirationService`
- `BookingStateMachineService`
- `BookingService`
- `BookingTestConfirmationService`
- `PaymentService`
- `InvoiceService`
- `AdminDashboardService`

Controllers:

- `AuthController`
- `UserController`
- `BranchController`
- `CategoryController`
- `CarController`
- `AdminCarController`
- `BookingController`
- `AdminBookingController`
- `PaymentController`
- `AdminPaymentController`
- `InvoiceController`
- `AdminDashboardController`

### 3.3 API Surface Observed

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

User/profile/documents:

- `GET /api/users/me`
- `PUT /api/users/update`
- `PUT /api/users/me/password`
- `GET /api/users/documents`
- `POST /api/users/upload-document`
- `GET /api/uploads/**`

Cars:

- `GET /api/cars/search`
- `GET /api/cars/available`
- `GET /api/cars/{id}`

Admin cars:

- `GET /api/admin/cars`
- `GET /api/admin/cars/{id}`
- `POST /api/admin/cars`
- `PUT /api/admin/cars/{id}`
- `DELETE /api/admin/cars/{id}`
- `PATCH /api/admin/cars/{id}/status`
- `POST /api/admin/cars/{id}/images`
- `POST /api/admin/cars/{id}/images/single`
- `DELETE /api/admin/cars/{id}/images/{imageId}`
- `PATCH /api/admin/cars/{id}/images/{imageId}/primary`

Branches:

- `GET /api/branches`
- `GET /api/branches/{id}`
- `POST /api/branches`
- `PUT /api/branches/{id}`
- `DELETE /api/branches/{id}`

Categories:

- `GET /api/categories`
- `GET /api/categories/active`
- `GET /api/categories/{id}`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

Bookings:

- `POST /api/bookings`
- `GET /api/bookings/my`
- `GET /api/bookings/{id}`
- `POST /api/bookings/{id}/cancel`
- `POST /api/bookings/{id}/confirm-for-test`

Admin bookings:

- `GET /api/admin/bookings`
- `GET /api/admin/bookings/{id}`
- `POST /api/admin/bookings/{id}/transition`
- `POST /api/admin/bookings/{id}/cancel`

Payments:

- `POST /api/payments/deposit`
- `GET /api/payments/me`
- `POST /api/payments/paypal/{id}/capture`
- `GET /api/payments/vnpay/callback`
- `POST /api/payments/{id}/mock-success`
- `POST /api/payments/{id}/refund`

Admin payments:

- `GET /api/admin/payments`

Invoices:

- `GET /api/invoices/{bookingId}/pdf`

Admin dashboard:

- `GET /api/admin/dashboard/monthly`

### 3.4 Security

Security config now permits:

- Public auth: `/auth/register`, `/auth/login`, `/auth/refresh`
- Public uploads: `/uploads/**`
- Public VNPay callback: `/payments/vnpay/callback`
- Public car reads: `GET /cars/search`, `GET /cars/available`, `GET /cars/*`
- Public branch/category reads: `GET /branches`, `GET /branches/*`, `GET /categories`, `GET /categories/*`, `GET /categories/active`

Everything else requires authentication. Role restrictions are applied through method-level `@PreAuthorize`, mainly for admin/staff controllers and admin-only writes.

Notable role/security observations:

- Admin car list/detail are available to ADMIN and STAFF; create/update/delete/image management are ADMIN-only.
- Admin booking and admin payment list require ADMIN or STAFF.
- Branch/category writes require ADMIN but are under `/branches` and `/categories`, not `/admin/branches` or `/admin/categories`.
- Customer payment mock-success and refund endpoints are exposed under `/payments/...`; refund logic allows staff/admin or booking owner depending on conditions. This should be revisited before production-like use.
- JWT refresh tokens still appear stateless, without persistence/rotation.
- Token blacklist exists, but cleanup/expiry management is not obvious.

### 3.5 Data Seeding

Seeders now include:

- `DevDataSeeder` under `dev` profile:
  - `customer@demo.com / Password123`
  - `staff@demo.com / Password123`
  - `admin@demo.com / Password123`
- `DataSeeder`:
  - Admin: `admin@rentcity.com / Admin1234`
  - Categories: Sedan, SUV, MPV, Hatchback.
  - One Hanoi/Cau Giay branch.
  - Several sample cars with images.
- `BranchDataReconciler`:
  - Forces all cars into one target branch and deletes redundant branches.

Important implication:

- The reconciler conflicts with a general multi-branch admin feature. If the product should support multiple branches, this reconciler must be removed, disabled, or scoped only to legacy data migration.

## 4. Booking Implementation Analysis

Booking is now materially implemented, not just planned.

Recent pricing fix:

- Daily rental pricing no longer rounds any extra time into a full extra day.
- The backend now charges daily rentals as full 24-hour days plus rounded-up remaining hours.
- Example: a 25-hour daily rental is charged as `1 day + 1 hour`, not `2 days`.
- Frontend booking estimates and booking duration labels now use the same day-plus-hour behavior for the base rental amount.

Recent unpaid-booking hold implementation:

- New bookings store `paymentExpiresAt`, calculated as creation time plus 15 minutes.
- A scheduled backend job checks every 5 seconds for `PENDING` + `UNPAID` bookings past the deadline.
- Expired bookings transition to `CANCELLED` with database cancel reason `SYSTEM_CANCELLED`; status history records `SYSTEM_PAYMENT_TIMEOUT` and actor `SYSTEM`.
- Pending payment records for the booking transition to `EXPIRED`.
- Payment creation and completion reject requests after the deadline, preventing late gateway callbacks from confirming an expired booking.
- Legacy pending bookings without `paymentExpiresAt` use `createdAt + 15 minutes` as the fallback deadline.
- The payment selection, PayPal, and VNPay screens show a prominent `MM:SS` countdown with a clear 15-minute auto-cancellation warning; payment controls are disabled at zero.

Recent reservation, security-deposit, and return-settlement update:

- Booking lifecycle now includes `PAID`: `PENDING -> CONFIRMED -> PAID -> ONGOING -> COMPLETED`.
- The original 30% `depositAmount` is now explicitly a vehicle reservation fee. It confirms and reserves the booking; it is not the refundable vehicle security deposit.
- Every vehicle must have a positive fixed `car.deposit`. New bookings snapshot this value as `securityDepositAmount` so later vehicle edits cannot change an existing booking's obligation.
- For a `CONFIRMED` booking, staff opens the security-deposit popup and chooses `PAYMENT_REQUEST` or `CASH`. Amount paid, collection method, timestamp, and payment ledger entry are recorded.
- A booking moves from `CONFIRMED` to `PAID` only when its vehicle security deposit is fully paid; signed handover requires this state.
- The normal rental balance is no longer collected at handover. At return, the final rental amount is `baseAmount - reservationFeeAmount + totalOverdueFee`.
- Staff chooses `PAYMENT_REQUEST` or `CASH` for the final rental amount. Cash is immediately recorded as paid; a payment request appears in customer My Wallet and remains outstanding until gateway payment succeeds.
- A `GOOD` return requires staff to choose electronic or cash refund for the full security deposit. The refund amount, method, and timestamp are recorded in the booking, payment ledger, contract detail, and PDF.
- A `DAMAGE` or `NEED_MAINTENANCE` return retains the full security deposit for repair/maintenance, creates no separate damage fee, and makes the vehicle unavailable in `MAINTENANCE` state.
- The Staff Bookings action-row eye/date control opens a read-only detail modal with the latest booking financials, handover contract, return contract, condition photos, signatures, policy, and PDF download.
- Staff booking data and customer My Wallet data poll every 5 seconds and refresh on window focus.
- Handover condition only allows `GOOD` or `DAMAGE`; clearing the damage checkbox restores `GOOD`.
- Actual handover time cannot be earlier than the booking creation time or later than the scheduled return time; both the staff form and backend enforce this window.
- An early handover is treated as additional rental usage. Early-handover time and late-return time are added together before rounding to billable hours, then charged through the overdue-fee flow when the vehicle is returned.
- Rental contract PDFs embed DejaVu Sans instead of replacing non-ASCII characters, use an A4 sectioned layout, and preserve Vietnamese customer names, notes, addresses, and signature labels.
- Staff contract detail resolves condition images through the configured API base path (`/api/uploads/...`), so handover photos load correctly with the backend context path.
- Booking pickup now supports `BRANCH_PICKUP` or `ADDRESS_DELIVERY`. Address delivery requires and persists a delivery address, carries it through confirmation, and exposes it in customer/staff booking details and contract PDFs.
- Flyway `V8__add_booking_pickup_method.sql` adds the pickup method and delivery address columns with database-level consistency checks.
- Customer header menus on desktop and mobile expose `My Wallet` alongside profile and booking navigation.
- Axios now removes the JSON content type for `FormData` requests so condition-image uploads receive a valid browser-generated multipart boundary.
- Flyway `V9__separate_reservation_and_security_deposit.sql` adds the separate money lifecycles and contract snapshots; `V10__require_vehicle_security_deposit.sql` enforces a positive deposit for every vehicle and reconciles payment types.

Implemented behavior:

- `POST /bookings` creates a booking for the authenticated customer.
- Customer bookings are listed through `GET /bookings/my`.
- Customer can read own booking detail through `GET /bookings/{id}`.
- Customer can cancel `PENDING` or `CONFIRMED` bookings.
- Admin/staff can list/filter bookings.
- Admin/staff can transition booking states.
- Admin/staff can directly cancel `PENDING` or `CONFIRMED` bookings; unpaid pending payments are marked `EXPIRED`.
- Test confirmation endpoint exists: `POST /bookings/{id}/confirm-for-test`.
- State history is recorded through `BookingStatusHistory`.
- Booking code generation uses date plus random suffix.
- Car row is locked through `findByIdForUpdate` when creating a booking.
- Booking row can also be locked for admin/payment operations.
- Availability uses overlap checks and blocking statuses.

State and deposit behavior:

- New booking starts as `PENDING`.
- New booking starts with reservation `depositStatus = UNPAID` and vehicle `securityDepositStatus = UNPAID`.
- Reservation-fee completion moves `depositStatus` to `PAID` and confirms the booking.
- Payment completion can move booking from `PENDING` to `CONFIRMED`.
- Admin transition to `CONFIRMED` marks unpaid deposit as paid.
- Cancellation updates `cancelledAt`, `cancelReason`, `cancelledBy`, and deposit status based on cancellation policy.

Validation observed:

- `startTime` must be before `endTime`.
- `startTime` must be in the future.
- Hourly booking minimum: 1 hour.
- Daily booking minimum: 24 hours.
- Monthly booking minimum: 30 days.

Risk:

- `validateRequest` returns early if `pricingMode`, `startTime`, or `endTime` is null. Bean validation on `CreateBookingRequest` may cover this, but this should be confirmed.
- Some exception messages are mojibake and will leak into API responses/UI.
- Booking ownership checks are present for customer detail/cancel.
- Admin list returns plain list, not paginated.

## 5. Payment Implementation Analysis

Payment is partly implemented as a mock/sandbox flow.

Implemented behavior:

- Customer creates deposit payment for a pending booking.
- Payment idempotency key is supported.
- Existing active or paid deposit payment is reused.
- PayPal capture endpoint marks payment paid using mock gateway transaction id.
- VNPay callback endpoint is public and can mark payment paid if response code is `00`.
- Mock success endpoint exists.
- Refund endpoint exists.
- Admin payment list exists.
- Payment response includes a generated VNPay mock callback URL for pending VNPay payments.
- Invoice PDF download endpoint exists for bookings.

Important limitations:

- No real PayPal API call is visible in `PaymentService`; PayPal capture is currently local/mock completion.
- VNPay is currently callback/reference-driven; no signed VNPay verification was observed in the inspected service.
- `application-sandbox.yml` contains PayPal/VNPay config placeholders, but active default profile is `dev`.
- `AdminPaymentController` only has list; frontend expects admin refund endpoint under `/admin/payments/{id}/refund`, but backend does not expose that route.
- `PaymentService.ensureStaffOrAdmin` exists but is not used.

Production readiness:

- Treat payment as demo/sandbox/mock until gateway signing, provider calls, webhook/callback verification, and stricter role/ownership rules are implemented.

## 6. Vehicle, Branch, and Category Analysis

Cars are now backed by real API:

- Public search with filters/pagination/sort.
- Public availability query by date range and optional branch.
- Public detail.
- Admin CRUD.
- Admin upload/delete/set-primary images.
- Soft delete by setting status to `RETIRED`.
- Availability excludes cars with overlapping blocking bookings.

Branch/category APIs are real, but frontend route contracts currently diverge:

- Backend writes are `POST/PUT/DELETE /branches` and `/categories`.
- Frontend admin API currently calls `/admin/branches` and `/admin/categories`.

This means the current Admin Branches/Categories pages can load lists through public routes, but create/update/delete will likely fail unless routes are aligned.

Branch-specific risk:

- `BranchDataReconciler` currently collapses all branches to one Cau Giay branch and deletes redundant branches. This undermines admin branch management if multi-branch is a real requirement.

## 7. Frontend Current State

### 7.1 Stack

Frontend stack:

- React `19.2.4`
- Vite `8.0.0`
- TypeScript `5.9.3`
- React Router `7.13.1`
- Axios `1.13.6`
- Tailwind CSS `4.2.2`
- Framer Motion
- Lucide React
- Sonner
- `@paypal/react-paypal-js`

API base URL:

```ts
import.meta.env.VITE_API_URL || 'http://localhost:8081/api'
```

### 7.2 Routing

Public:

- `/`
- `/search`
- `/vehicles/:id`

Customer protected:

- `/booking/:id`
- `/booking/:id/confirm`
- `/booking/:id/payment`
- `/booking/:id/payment/paypal`
- `/booking/:id/payment/vnpay`
- `/booking/:id/result`
- `/my-bookings`
- `/my-bookings/:id`
- `/review/:id`

Authenticated:

- `/profile`
- `/payments`
- `/notifications`

Admin/staff:

- `/admin`
- `/admin/vehicles`
- `/admin/bookings`
- `/admin/payments`

Admin-only:

- `/admin/users`
- `/admin/branches`
- `/admin/categories`

### 7.3 API Integration

Real API services exist for:

- Auth/session/profile/documents.
- Cars/search/detail/availability.
- Admin car CRUD.
- Booking create/list/detail/cancel/admin transition/test confirm.
- Payment create/capture/VNPay mock callback/refund/invoice PDF.
- Admin payments list.
- Branch/category list and attempted admin CRUD.
- Admin dashboard monthly stats.

Still mock/local or incomplete:

- Notifications appear frontend/mock-oriented.
- Reviews do not appear backed by a backend review module.
- Admin users page expects `/admin/users` and toggle-status but no backend controller was found.
- Some admin branch/category write routes are miswired.
- Payment pages still mix frontend flow state with backend payment APIs and mock behavior.

## 8. Verified Commands and Results

### 8.1 Backend

Command:

```powershell
.\mvnw.cmd test
```

Initial sandbox run:

- Failed because Maven could not access Maven Central from the restricted sandbox.

Escalated/network-approved run:

- Dependency resolution worked.
- Backend compiled 94 source files successfully.
- Test started Spring context.
- Initial failure was database/environment related:
  - First, PostgreSQL was not listening on `127.0.0.1:5434`.
  - After Docker Postgres started, the existing volume rejected `rentcity_user` because the role did not exist.
  - After creating `rentcity_user`, existing tables were still owned by `postgres`, so Hibernate could not alter them.
  - After table/sequence ownership was moved to `rentcity_user`, Hibernate failed to add `car_categories.is_active` because existing rows needed a non-null default.

Repairs applied:

- Created the missing `rentcity_user` role with password `rentcity_pass` in the running Docker Postgres volume.
- Granted/assigned ownership for the `rentcity` database and `public` schema to `rentcity_user`.
- Reassigned existing public schema tables/sequences to `rentcity_user`.
- Updated `CarCategory.isActive` DDL to use `boolean default true not null`.

Final verification:

- `.\mvnw.cmd test`: pass.
- Tests run: 1.
- Failures: 0.
- Errors: 0.

Interpretation:

- Backend compiles and the Spring context loads successfully against local Docker Postgres.
- Test suite is still only one `contextLoads` style test, so coverage is very low.

### 8.2 Frontend Build

Command:

```powershell
npm.cmd run build
```

Result:

- Failed during TypeScript build.

Current build blockers:

- `src/pages/PaymentPage/PayPalRedirect.tsx`: unused `payment`.
- `src/pages/PaymentPage/PayPalRedirect.tsx`: unused `data`.
- `src/pages/PaymentPage/PayPalRedirect.tsx`: unused `actions`.

Interpretation:

- Build is close to passing; current blockers are small unused-variable TypeScript errors.

### 8.3 Frontend Lint

Command:

```powershell
npm.cmd run lint
```

Result:

- Failed with 21 errors and 2 warnings.

Notable lint blockers:

- `AdminLayout.tsx`: component declared during render (`react-hooks/static-components`).
- `AdminVehicles/VehicleModal.tsx`: synchronous setState inside effect.
- `PaymentPage/PayPalRedirect.tsx`: unused variables and many `any` types.
- `PaymentsPage/index.tsx`: unused `error`.
- `ProfilePage/TransactionsTab.tsx`: unused `error`.
- `SearchPage/index.tsx`: `let` should be `const`.
- `bookingStore.tsx`: `react-refresh/only-export-components`.

Warnings:

- `PayPalRedirect.tsx`: missing effect dependency.
- `VNPayQR.tsx`: missing effect dependency.

## 9. Major Mismatches and Risks

### 9.1 Frontend/Backend Route Mismatch

Frontend `adminApi.ts` expects:

- `POST /admin/branches`
- `PUT /admin/branches/{id}`
- `DELETE /admin/branches/{id}`
- `POST /admin/categories`
- `PUT /admin/categories/{id}`
- `DELETE /admin/categories/{id}`
- `GET /admin/users`
- `PATCH /admin/users/{id}/toggle-status`
- `POST /admin/payments/{id}/refund`

Backend currently provides:

- Branch writes under `/branches`.
- Category writes under `/categories`.
- Admin payments list only under `/admin/payments`.
- No admin users controller found.

Impact:

- Admin Branches and Admin Categories write operations likely fail.
- Admin Users page likely fails to load.
- Admin refund from frontend likely fails.

### 9.2 Payment Is Demo/Sandbox, Not Real Integration

Current code is useful for end-to-end demo flow, but should not be considered real payment integration.

Missing or unclear:

- Real PayPal order/capture API calls.
- VNPay signature validation.
- Secure webhook/callback verification.
- Stronger access rules for mock success/refund endpoints.
- Payment gateway error/retry handling.

### 9.3 Branch Reconciler Conflicts With Branch Management

`BranchDataReconciler` deletes all branches except the target Cau Giay branch and reassigns every car there.

Impact:

- Admin branch CRUD cannot be trusted as a real multi-branch feature while this reconciler remains active.

### 9.4 Encoding/Mojibake Is Widespread

Many source comments, messages, and frontend UI strings show mojibake such as `KhÃ´ng`, `ÄÃ£`, `chi nhÃ¡nh`.

Impact:

- UI quality is visibly broken for Vietnamese users.
- API error messages are hard to read.
- Source comments are harder for the team to maintain.

### 9.5 Tests Are Too Thin

Backend currently has only a smoke context test.

Missing coverage:

- Auth/register/login/refresh/logout.
- User profile validation.
- Car CRUD/search/availability.
- Booking overlap and pessimistic locking.
- Booking state machine transitions.
- Payment idempotency and completion.
- Refund policy.
- Role authorization.
- Frontend build/lint regression tests.

### 9.6 Environment Assumptions Are Fragile

Default `dev` profile assumes local Postgres on `127.0.0.1:5434`.

Impact:

- Backend tests require Docker Compose database to be running.
- If a developer already has a stale `postgres_data` volume initialized with different credentials, they may need to create/grant `rentcity_user` or recreate the volume.
- CI will fail unless DB service is provided or tests use a test profile/Testcontainers/H2-style substitute.

## 10. Current Strengths

- Backend domain has expanded significantly and now covers the main rental lifecycle.
- Booking core has important safety features: overlap checks, row locking, state machine, status history.
- Payment flow is sufficient for demo/testing of booking confirmation.
- Admin car management is relatively complete.
- Public car search/detail/availability are implemented.
- Profile/auth/document flow remains integrated with real backend APIs.
- Config now points frontend/backend consistently to port `8081`.
- Docker Compose matches backend DB defaults.
- Backend source compiles and the current smoke test passes once dependencies and Docker Postgres are available.

## 11. Recommended Next Steps

High priority:

1. Fix the three remaining TypeScript build blockers so `npm.cmd run build` passes.
2. Align frontend admin routes with backend routes or add matching backend `/admin/...` endpoints.
3. Decide whether admin users is in scope now; if yes, implement backend `AdminUserController` and service methods.
4. Disable or remove `BranchDataReconciler` if multi-branch management is required.
5. Add a repeatable DB bootstrap/migration path so stale Docker volumes do not break local startup.

Next priority:

1. Fix frontend lint blockers, especially React Compiler rules.
2. Clean mojibake strings/comments in user-facing files.
3. Harden payment route access and label mock/sandbox-only endpoints clearly.
4. Add backend tests for booking overlap/state transitions/payment completion.
5. Add frontend smoke checks for login, search, booking create, payment mock success, and admin list pages.

Later hardening:

1. Replace mock payment behavior with verified PayPal/VNPay integrations.
2. Add pagination to admin booking/payment lists.
3. Standardize API error responses.
4. Add token cleanup and refresh-token persistence/rotation.
5. Move local-only seed/reconciliation logic into explicit dev/test profiles.

## 12. Practical Local Run Notes

Start database:

```powershell
docker compose up -d postgres
```

Run backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Run backend tests:

```powershell
cd backend
.\mvnw.cmd test
```

Run frontend:

```powershell
cd frontend
npm.cmd run dev
```

Build frontend:

```powershell
cd frontend
npm.cmd run build
```

Lint frontend:

```powershell
cd frontend
npm.cmd run lint
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8081/api`
- PostgreSQL host: `127.0.0.1:5434`

Seed users:

- `customer@demo.com / Password123`
- `staff@demo.com / Password123`
- `admin@demo.com / Password123`
- `admin@rentcity.com / Admin1234`
