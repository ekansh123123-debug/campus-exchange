# Testing & Verification Guide (`TC01–TC18`)

CampusExchange includes automated unit and integration test suites covering all 18 acceptance test cases defined in `project.md` §15, plus frontend component/route tests.

## Running Tests

### 1. Full Test Suite (Root)
```bash
npm test
```

### 2. Backend Unit & Integration Suites
```bash
npm test --workspace=backend
```
- **Unit tests** (`backend/src/tests/unit/core.unit.test.js`):
  - College email domain policy enforcement (`COLLEGE_EMAIL_DOMAINS`).
  - Listing validation rules (automatic `price = 0` for `donate`, mandatory price for `sell`, image count limits).
  - Transaction state machine guardrails and valid/invalid transition checks.
  - Safe DTO serializers (`toPublicUserDTO`, `toPrivateSelfUserDTO`) ensuring `passwordHash`, `email`, and `enrollmentNumber` are never leaked publicly.
- **Integration tests** (`backend/src/tests/integration/campus-exchange.integration.test.js`):
  - Uses `mongodb-memory-server` and `supertest` to exercise the full Express 5 + Mongoose 9 stack end-to-end.

### 3. Frontend Component & Route Guard Tests
```bash
npm test --workspace=frontend
```
- Uses `vitest` and `@testing-library/react` (`frontend/src/test/app.test.jsx`) to verify:
  - Marketplace discovery filters (`FR-05`), empty state (`"No items found"`), and `DEMO` badges.
  - Semantic `StatusBadge` icon + label pairing.
  - Route guards (`ProtectedRoute`, `VerifiedStudentRoute`, `AdminRoute`, `PublicOnlyRoute`).

---

## Acceptance Test Matrix (`TC01–TC18` from `project.md` §15)

| Test ID | Feature | Scenario | Expected Result | Automated Coverage |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Signup (`FR-01`) | Register with valid college email (`@university.ac.in`) | Account created in `unverified` state; verification code issued | `campus-exchange.integration.test.js` (`TC01 & TC02`) |
| **TC02** | Signup (`FR-01`) | Register with non-college email (`@gmail.com`) | `400 VALIDATION_ERROR`: College email required | `core.unit.test.js` + `campus-exchange.integration.test.js` |
| **TC03** | Email Verification (`FR-01`) | Submit valid verification token | `isVerifiedStudent: true`; access + refresh tokens issued | `campus-exchange.integration.test.js` (`TC03 & TC04`) |
| **TC04** | Access Control (`FR-02`) | Unverified user tries to create listing | `403 FORBIDDEN`: Verified student status required | `campus-exchange.integration.test.js` (`TC03 & TC04`) |
| **TC05** | Create Listing (`FR-04`) | Verified student submits valid book listing | `201 Created`; listing appears in marketplace feed | `campus-exchange.integration.test.js` (`TC05, TC06, TC07`) |
| **TC06** | Create Listing (`FR-04`) | Submit `sell` listing without price | `400 VALIDATION_ERROR` + client inline error | `core.unit.test.js` + `campus-exchange.integration.test.js` |
| **TC07** | Donation Listing (`FR-04`) | Create listing with `listingType = "donate"` | Price automatically forced to `0` (`FREE`) | `core.unit.test.js` + `campus-exchange.integration.test.js` |
| **TC08** | Search & Filter (`FR-05`) | Filter by `semester=4` and `department=CSE` | Only matching active listings returned | `campus-exchange.integration.test.js` (`TC08 & TC09`) |
| **TC09** | Search Empty State (`FR-05`) | Search keyword with no matching items | Empty list returned; UI renders `"No items found"` | `campus-exchange.integration.test.js` + `app.test.jsx` |
| **TC10** | Messaging (`FR-07`) | Buyer sends message on active listing | Conversation thread created; message stored; seller notified | `campus-exchange.integration.test.js` (`TC10`) |
| **TC11** | Transaction (`FR-08`) | Buyer requests item; seller accepts | Listing status changes to `reserved`; transaction `accepted` | `campus-exchange.integration.test.js` (`TC11 & TC12`) |
| **TC12** | Concurrency (`FR-08`) | Second buyer requests already-reserved item | `409 CONFLICT`: Listing is already reserved or unavailable | `campus-exchange.integration.test.js` (`TC11 & TC12`) |
| **TC13** | Completion & Review (`FR-08`, `FR-10`) | Transaction marked `completed`; buyer submits review | Listing status `completed`; seller `averageRating` updated | `campus-exchange.integration.test.js` (`TC13`) |
| **TC14** | PYQ Upload (`FR-11`) | Verified student uploads valid PDF with course metadata | `201 Created` with `moderationStatus: "pending"` | `campus-exchange.integration.test.js` (`TC14, TC15, TC16`) |
| **TC15** | File Validation (`FR-11`) | Upload invalid file type (`.exe`) or oversized file | `400 Bad Request`: Unsupported file type / size limit | `campus-exchange.integration.test.js` (`TC14, TC15, TC16`) |
| **TC16** | Admin Moderation (`FR-14`) | Admin approves pending PYQ resource | Status changes to `approved`; visible in public search | `campus-exchange.integration.test.js` (`TC14, TC15, TC16`) |
| **TC17** | RBAC Security (`FR-02`) | Regular student requests `/api/v1/admin/*` | `403 FORBIDDEN`; access blocked | `campus-exchange.integration.test.js` (`TC17`) |
| **TC18** | Cross-User Isolation (`FR-06`) | User A tries to edit/delete User B's listing | `403 FORBIDDEN`; listing remains unchanged | `campus-exchange.integration.test.js` (`TC18`) |
