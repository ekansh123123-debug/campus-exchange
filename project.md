# CampusExchange — Project Specification

**Document type:** Product and system specification  
**Project:** CampusExchange  
**Target implementation:** Vite + React frontend, Express.js API, MongoDB with Mongoose  
**Audience:** Project owner, implementation agent, frontend/backend developers, testers, and evaluators  
**Status:** Build specification derived from `CampusExchange_Mini_Project_Report.docx`, with the implementation stack updated to the stack requested by the project owner.

---

## 1. Source Alignment and Implementation Decision

The supplied mini-project report is the source of truth for the product problem, goals, functional requirements, user workflows, UML/DFD concepts, prototype modules, test cases, risks, and proposed future enhancements.

The report's original prototype stack is HTML/CSS/JavaScript with Bootstrap, Python/Flask, and MySQL. This project specification intentionally replaces only that implementation stack with:

- **Frontend:** Vite, React, JavaScript/JSX, and a responsive component system.
- **Backend:** Node.js and Express.js.
- **Database:** MongoDB with Mongoose models and indexes.
- **Media:** ImageKit for listing photographs and resource files, subject to private-resource access controls.
- **Authentication:** College-email verification, password hashing, JWT access tokens, refresh sessions, and server-side role/ownership authorization.

The product requirements from the report remain in scope. Where the report does not specify a technical detail, this document defines a practical implementation choice. Those choices are design decisions for the new stack, not claims that the original report already implemented them.

## 2. Executive Summary

CampusExchange is a web-based marketplace and study-resource library exclusively for verified engineering students of a participating college. Students can discover, buy, sell, or exchange second-hand academic items such as textbooks, scientific calculators, drawing instruments, and lab kits. They can also browse and download previous-year question papers (PYQs), notes, and other approved study materials.

Today, such exchanges often take place through informal messaging groups or personal contacts. Posts become hard to find, sellers are difficult to verify, academic resources are scattered, item status is unclear, and there is little accountability for misleading listings. CampusExchange centralizes these activities in a searchable and moderated platform.

The platform uses college-email verification, administrator moderation, controlled item states, item-specific chat, transaction records, ratings/reviews, report handling, and an organized resource library to make campus-level exchanges easier to discover and more trustworthy. It promotes affordability and reuse, not online payment processing in the first release.

## 3. Problem, Need, and Purpose

### 3.1 Problem statement

Engineering students need affordable second-hand textbooks, engineering tools, previous-year question papers, and study materials. Existing channels do not offer one organized place where verified students can post what they have, search by academic context, track an item's status, communicate privately, and access relevant resources.

### 3.2 Problems with current channels

- **Poor discoverability:** Posts in messaging groups quickly disappear in new messages and cannot be filtered reliably by category, branch, year, subject, price, or condition.
- **Limited verification:** Informal groups and general marketplaces do not consistently confirm that sellers belong to the college.
- **Scattered resources:** PYQs and notes may be spread across chats, drives, links, and folders.
- **No dependable status:** Buyers may contact sellers about items that have already been reserved or sold.
- **Low accountability:** Ratings, reviews, reporting, and moderation may be missing.
- **Wasted resources:** Usable books and equipment remain unused because students who need them cannot find them.

### 3.3 Purpose

Provide a safe, convenient, affordable, searchable, and moderated campus platform for exchanging academic items and sharing study material. The system should reduce discovery time and education costs, build trust through college-email verification and transparent transaction states, and encourage reuse of educational resources.

## 4. Goals and Success Criteria

### 4.1 Product goals

1. Offer one campus-only place to buy, sell, and exchange eligible academic items.
2. Provide fast item discovery through keyword search, filters, and sorting.
3. Allow registration only with an approved college email domain and require email verification before protected marketplace actions.
4. Make new item listings and uploaded resources subject to administrator moderation.
5. Give buyers and sellers a private, item-specific communication channel.
6. Track listing, reservation, exchange, and handover outcomes.
7. Enable trustworthy post-transaction reviews and reporting of suspicious activity.
8. Maintain a structured, searchable PYQ/study-material library.
9. Give administrators tools for moderation, account management, complaints, and usage statistics.
10. Keep the design modular enough to grow in users, items, and resources.

### 4.2 MVP success criteria

The first usable release is considered functionally complete when:

- A student can register with a permitted college email, verify it, sign in, sign out, and edit a profile.
- A student can submit a listing; the listing stays pending until an administrator approves it.
- Only approved and active listings appear in general search.
- Search supports keyword, category, branch, academic year, subject, price range, condition, and sorting.
- A student can save/remove wishlist entries, start an item-specific conversation, reserve a sale item or request an exchange, and see transaction status.
- A seller can confirm a completed campus handover; the listing then becomes sold.
- Eligible users can submit ratings/reviews after completion.
- Students can browse/download approved resources and submit new resources for moderation.
- Users can report listings or users; administrators can review and resolve the reports.
- Administrator-only routes and actions are inaccessible to normal students.
- Data belonging to one user cannot be read or changed by another user unless the action is explicitly permitted by the product workflow.
- The security, validation, and test requirements in this document are covered by automated tests or a recorded manual test run.

## 5. Scope

### 5.1 In scope for the MVP

- College-email registration and verification by OTP or expiring verification link.
- Secure login/logout and authenticated sessions.
- Student profiles containing name, branch, year, and contact preferences.
- Listing creation, editing, removal, images, sell/exchange type, condition, price, and moderation.
- Search, filters, sorting, pagination, and listing details.
- Wishlist.
- Item-specific chat and stored message history.
- Sale reservations and exchange requests with accept/decline flow.
- Handover confirmation and final listing status.
- Ratings and reviews for completed transactions.
- PYQ/study-material upload, moderation, browse, and download.
- Notifications for important user events.
- Reports, account blocking/restoration, moderation, and admin dashboard statistics.
- Responsive desktop and mobile UI, basic accessibility, logging, backups, and test coverage.

### 5.2 Explicitly out of scope for the first release

- Online payment collection, escrow, refunds, or payment-gateway integration.
- Courier/delivery logistics; the report describes campus meet-up/handover.
- A native Android/iOS application.
- Public marketplace access for arbitrary non-college users.
- Guaranteed correctness or official certification of user-uploaded academic documents.
- Multi-college tenancy in the MVP. The data model may retain a future path to a college identifier, but authorization and initial configuration target one college community.
- Automated AI recommendations or automatic content approval.

Future extensions may include an in-app payment option, push notifications, branch/semester-based recommendations, a mobile app, and expansion to additional colleges, as described in the source report.

## 6. Actors, Accounts, and Permissions

### 6.1 Actors

- **Visitor:** Unauthenticated person. May view public landing/help pages and authentication screens only. Do not expose private marketplace data to visitors unless the project owner explicitly chooses public previews.
- **Registered, unverified student:** Can complete email verification and limited account recovery tasks. Cannot post listings, chat, reserve items, review, or upload resources until verified.
- **Verified student:** The common account type. A verified student can perform buyer and seller actions; “buyer” and “seller” are contextual roles, not separate account types.
- **Administrator:** A trusted staff account able to moderate listings/resources, block or restore accounts, resolve reports, and view operational statistics.

### 6.2 Permission principles

- Registration creates a student account only. A client must never be able to submit `role: "admin"` and obtain administrator rights.
- Admin accounts must be provisioned by a protected seed/bootstrap script or another explicitly controlled operator process.
- College email verification is required for marketplace actions.
- Account status is distinct from email verification: an email-verified account can still be blocked by an administrator.
- Every private record must be scoped to its authorized owner or participant(s), not merely hidden in the UI.
- A user ID received from the browser is not proof of identity. Derive the current actor from verified authentication claims and re-check the database record and status.
- A student may read public-safe seller information on a listing, but contact details, password hashes, tokens, moderation notes, and internal authentication fields must not be returned publicly.

### 6.3 User identity and naming rules

Use MongoDB `ObjectId` values as internal primary identifiers and references. In addition, generate stable, server-owned human-readable codes:

- User: `CEU-<random-suffix>`
- Listing: `CEL-<random-suffix>`
- Transaction: `CET-<random-suffix>`
- Resource: `CER-<random-suffix>`
- Report: `CERPT-<random-suffix>`
- Conversation: `CEC-<random-suffix>`

The suffix must be generated securely, checked against a unique index, and must not expose a sequential count or personal information. Use the MongoDB `_id` for internal references and the public code for URLs and human-facing references. Codes must be unique and immutable. Store `fullName` separately from the generated identifier; never use a person's name as a database key. Do not allow users to choose or overwrite their identifiers.

## 7. Functional Requirements

The following requirement IDs preserve the source report's functional requirement coverage.

### FR-01 — Registration, verification, and authentication

- Register using name, college email, password, branch, and year (or required profile data configured by the college).
- Normalize email to lowercase and trim whitespace.
- Accept only domains in a server-configured allowlist such as `COLLEGE_EMAIL_DOMAINS`; do not trust a client-side domain check.
- Hash passwords with bcryptjs and an appropriate work factor. Never store plaintext passwords.
- Deliver an OTP or verification link by email. Store only a hash of an OTP/token, expiry time, attempt count, and consumed status.
- Enforce expiry, attempt limits, resend cooldowns, and rate limits.
- Do not allow unverified accounts to post, chat, reserve, exchange, review, or upload resources.
- Provide login, logout, session refresh/renewal, and safe error messages.

### FR-02 — Profile management

- A student can edit their name, branch, year, bio, avatar, and contact preferences.
- Email changes, if supported, require re-verification.
- Do not publish direct contact details by default.
- Show only a safe public profile: display name, branch/year when appropriate, profile image, completed-transaction count where valid, and aggregate rating.

### FR-03 — Create and manage listings

A verified student can create a listing containing:

- Title and description.
- Category (for example textbook, calculator, drawing instrument, lab kit, or other approved academic item).
- Listing type: `sell` or `exchange`.
- Price, including zero for a free item if free listings are permitted by college policy.
- Condition.
- One or more photographs.
- Optional academic metadata: branch, year, semester, subject, edition, author, or similar fields where appropriate.

The owner can edit or remove their own listing subject to state and policy constraints. Newly submitted listings enter moderation and are not visible as active search results until approved.

### FR-04 — Listing approval

- A new or resubmitted listing is `Pending`/`Pending Approval` until an administrator decides.
- Admins may approve or reject it; rejection must include a reason visible to the owner.
- Approved listings become `Active` and searchable.
- Rejected listings are not shown as active; the seller can edit and resubmit them.
- The system records the reviewing administrator and timestamps.
- Approval/rejection decisions create notifications and an audit record.

### FR-05 — Search and filters

Support keyword search and filtering by category, branch, academic year, subject, price minimum/maximum, condition, and listing type. Support sorting by newest and price ascending/descending. Apply pagination and return only eligible active listings to general search; reserved listings may appear only if the UI clearly identifies them and the policy explicitly allows it. Never include pending, rejected, removed, or sold listings in the default active results.

### FR-06 — Listing details

Display photos, title, category, description, price, condition, listing type, relevant academic metadata, status, safe seller profile, and seller rating. Show controls appropriate to the viewer and current state: wishlist, chat, reserve, exchange request, report, or owner management controls. Do not show the owner-facing moderation notes to other users.

### FR-07 — Wishlist

- A verified student can save an item and remove it later.
- A listing may appear only once in a given user's wishlist.
- If an item becomes sold/removed, present its state clearly and prevent reserving it; the implementation may keep or automatically prune the wishlist entry according to a documented choice.
- Users may list and edit only their own wishlist.

### FR-08 — In-app chat

- Enable item-specific communication between buyer and seller.
- Persist every message in MongoDB.
- Only the conversation participants can read or send messages in that conversation.
- Prevent a seller from creating a conversation with themselves for their own listing.
- Validate and limit message length, escape/render text safely, rate-limit sending, and provide report/mute/block handling as appropriate.
- Notify the recipient of new messages. A real-time transport such as Socket.IO may improve delivery, but authorization must be applied to both socket connection/join and HTTP history endpoints.

### FR-09 — Reserve sale items and request exchanges

- A buyer can reserve an active sale listing, creating a transaction record and moving the listing to `Reserved` in a concurrency-safe operation.
- Only one active reservation may win for a listing.
- An exchange request identifies the item requested and, where applicable, the item offered by the requester.
- The seller can accept or decline an exchange request. On acceptance, lock the involved listing(s) so another transaction cannot take them; on decline, return/leave the requested item active.
- Participants can cancel according to documented transaction rules. Cancellations and expiry release reserved items back to `Active` when appropriate.
- Users cannot transact with their own listings.

### FR-10 — Handover and status update

- The expected handover takes place on campus, outside the application.
- The seller confirms that the handover occurred.
- Validate that the transaction is in an allowed reserved/accepted state before completion.
- On completion, update the transaction and relevant listing state(s) consistently; for exchanges, record the exchange type and both items.
- Completion unlocks the review workflow and creates notifications.
- Do not represent a meet-up as payment processing or claim that the platform guarantees the physical transaction.

### FR-11 — Ratings and reviews

- Allow a transaction participant to leave a rating from 1 to 5 and an optional review after a transaction is completed.
- Enforce one review per author per transaction, with a unique database index.
- The reviewed user must be the other participant; users cannot review themselves or review before completion.
- Recompute or maintain aggregate rating safely. Do not allow users to alter another person's review.
- Provide reporting/moderation for abusive reviews where needed.

### FR-12 — PYQ and study-resource library

- Browse approved PYQs, notes, and related study materials.
- Filter by branch, year, subject, semester, resource type, and academic year where available.
- Authenticated verified users can download approved resources.
- Verified students can upload resources, but uploads start as `Pending` until moderated.
- Validate file type/size and capture metadata and uploader identity.
- Provide admin takedown/removal and a clear policy discouraging unauthorized or copyrighted uploads.
- Resource counts and file access should be logged where useful, without logging private file content.

### FR-13 — Notifications

Notify the relevant user about verification results, listing approval/rejection, new messages, reservations, exchange decisions, transaction cancellations/completion, review availability, and important moderation/report outcomes. Store notifications durably. Support unread counts and marking a notification read. Real-time notification delivery is an enhancement over persisted notification records, not a replacement for them.

### FR-14 — Reporting

Students can report a listing or a user and provide a reason and optional supporting details. Reports must be stored with reporter, target, timestamp, and status. Prevent a normal user from changing report resolution fields. The report flow should acknowledge receipt and make the report visible in the admin queue.

### FR-15 — Administration and moderation

Administrators can:

- View pending listings and approve/reject them with a reason.
- Moderate uploaded resources and perform takedowns.
- Search/view account status and block/restore users.
- View, triage, and resolve reports.
- See aggregate usage statistics such as active users, pending listings/resources, completed transactions, and unresolved reports.
- Review necessary moderation history/audit logs.

Admin endpoints must perform server-side role checks, and account-blocking must prevent future protected actions and invalidate active refresh sessions where possible.

## 8. Non-Functional Requirements

- **Usability:** Responsive, straightforward UI for mobile and desktop, usable with minimal training.
- **Performance:** Common pages and searches should normally respond within a few seconds under typical campus load. Use pagination, indexes, image optimization, and bounded queries.
- **Security:** Salted password hashes; authentication and role/ownership authorization; input validation; output encoding; secure headers; rate limiting; safe upload processing; protection against common injection, XSS, CSRF, brute-force, and authorization attacks.
- **Privacy:** Hide contact details; use item-specific in-app communication; never expose password hashes, verification tokens, refresh tokens, private moderation notes, or secret configuration.
- **Reliability:** Regular database and file backups, monitoring/logging, documented restore process, and useful service errors.
- **Scalability:** Modular code, suitable indexes, paginated endpoints, external file storage, and stateless API instances where practical.
- **Maintainability:** Feature-based modules, clear responsibilities, common validators/response/error utilities, documented environment variables, and automated tests.
- **Compatibility:** Current mainstream browsers and touch-friendly responsive layouts.
- **Accessibility:** Semantic HTML, keyboard operation, visible focus states, labels, useful validation messages, and sufficient contrast.

## 9. User Experience and Navigation

### 9.1 Main application areas

1. **Public entry / authentication:** Landing page, login, registration, email verification, resend verification, forgot/reset password.
2. **Student dashboard:** Recent approved items, popular categories, shortcuts to post an item, search, resources, wishlist, messages, and notifications.
3. **Browse marketplace:** Listing cards, keyword search, filters, sorting, paging, loading/error/empty states.
4. **Listing details:** Image gallery, item metadata, seller summary, rating, wishlist, report, chat, reserve, exchange request.
5. **Create/edit listing:** Validated multi-field form, photo upload previews, listing-type fields, save/submit feedback, and moderation status/rejection reason.
6. **My listings:** Draft/pending/active/reserved/sold/rejected/removed status; edit, remove, or view controls allowed by state.
7. **Wishlist:** Saved items and current item states.
8. **Messages:** Conversation list, item context, message history, unread state, and responsive conversation view.
9. **Transactions:** Buyer/seller views of reservations/exchange requests, accept/decline/cancel actions, status history, and handover confirmation.
10. **Resource library:** PYQ and study-material filters, details, upload form, moderation status for own uploads, and authorized downloads.
11. **Profile:** Personal editable details and safe public profile preview.
12. **Notifications:** New-message, listing, reservation, exchange, and moderation updates.
13. **Admin dashboard:** Summary metrics, pending listing/resource queues, user management, report queue, and moderation history.

### 9.2 UI principles

- Use a consistent shared layout, typography, spacing, form elements, status badges, cards, tables, dialogs, and toast/inline feedback.
- Prefer calm, academic, trustworthy styling over cluttered marketplace visuals.
- Make state visible; do not rely on color alone for `Pending`, `Active`, `Reserved`, `Sold`, `Rejected`, or `Removed`.
- Provide clear loading, empty, error, offline, unauthorized, and success states.
- Confirm destructive actions such as removal, account blocking, and report resolution.
- Never show a button merely because it is easy to render: hide or disable it based on permissions and state, and enforce the same rule on the server.

## 10. High-Level Architecture

```text
Student / Administrator Browser
            |
            v
Vite + React client
  - pages and shared UI
  - route guards for user experience only
  - API client and form validation
  - optional Socket.IO client
            |
            | HTTPS / JSON / multipart
            v
Express.js API
  - authentication/session middleware
  - validation and authorization
  - feature controllers and services
  - transaction/state-transition rules
  - notification and file-storage integrations
  - audit and structured logging
       |            |             |
       v            v             v
 MongoDB       ImageKit       Email provider
(Mongoose)     (media)        (OTP/alerts)
       |
       v
Indexes, durable entities, audit/event records, transaction history
```

### 10.1 Responsibilities

- **Presentation layer:** React components, route-level views, client-side form feedback, navigation, accessibility, and responsive states.
- **API layer:** Express routes, request parsing, authentication, validation, and consistent error responses.
- **Application/service layer:** Business rules, authorization checks, state transitions, atomic transaction operations, notifications, and moderation decisions.
- **Persistence layer:** Mongoose schemas, validation, indexes, repositories/data-access helpers if useful, and transaction support.
- **External service layer:** ImageKit media operations, email delivery, and optional Socket.IO events.

Frontend route guards are for usability only. The backend remains the authorization authority.

## 11. Main Domain Entities and Relationships

Use Mongoose schemas with explicit validation and indexes. The entities below map the original report's ER/class model to MongoDB; relations are represented with `ObjectId` references rather than SQL foreign keys.

### 11.1 User

Fields include `userCode`, `fullName`, normalized unique `collegeEmail`, `passwordHash` (excluded from default queries), `role` (`student` or `admin`), `emailVerifiedAt`/verification state, `accountStatus` (`active`, `blocked`, `deleted`), branch, year, bio/avatar, contact preferences, aggregate rating/count, and timestamps. Do not place password tokens or OTP plaintext in the user record.

### 11.2 Category

A controlled category record with name, slug, description, active flag, and sort order. Seed initial academic categories; do not accept arbitrary unreviewed categories from the client.

### 11.3 Listing (Item)

Fields include `listingCode`, `sellerId`, `categoryId`, title, normalized searchable title, description, `listingType` (`sell`/`exchange`), price in a consistently defined integer currency unit (recommended: paise, with display formatting in INR), condition, images and their provider identifiers, branch/year/semester/subject metadata, moderation fields, `status`, reserved transaction reference when applicable, timestamps, and optional removal/rejection reasons. Owner and moderation fields are never accepted blindly from the client.

### 11.4 Resource

Fields include `resourceCode`, uploader, title, description, resource type, branch/year/semester/subject/academic year, storage identifier, safe filename, detected MIME type, size, moderation status, reviewer/rejection/takedown details, download count, and timestamps. Resource storage must support access authorization rather than relying on a guessable public URL.

### 11.5 Conversation and Message

A conversation is linked to a listing and the two participants (buyer and seller). A message is linked to a conversation and has a sender, safe text body, timestamps, and optional read-state metadata. Store messages independently so message history is paginated and does not make a conversation document grow without limit.

### 11.6 Transaction

A transaction links listing, buyer, seller, `txnType` (`sale`/`exchange`), optional offered listing, transaction state, reservation expiry, handover/completion timestamps, cancellation reason, and audit metadata. It is the source of truth for a reservation/exchange and enables reviews only after completion.

### 11.7 Wishlist

A user/listing association with a unique compound key on `{ userId, listingId }`.

### 11.8 Review

A review links transaction, author, target user, rating (1–5), comment, moderation status, and timestamp. Enforce one review by an author per transaction using a unique index.

### 11.9 Report

A report links reporter, target type and ID, reason/category, detail, status (`open`, `in_review`, `resolved`, `dismissed`), assigned/resolving admin, timestamps, and resolution note. Only authorized admins can update resolution fields.

### 11.10 Notification

A notification belongs to one user and contains a type, concise title/body, safe in-app navigation target, read timestamp, and creation timestamp.

### 11.11 Authentication support records

Use separate verification-token/OTP records and refresh-session records. Hash sensitive tokens at rest; expire verification/refresh records; revoke sessions on logout, password reset, or account blocking as appropriate.

### 11.12 Audit events

Record high-value actions such as admin approvals/rejections, account blocking/restoration, report resolution, and completed/cancelled transactions. Do not put passwords, cookies, access tokens, OTPs, or private message bodies in audit logs.

## 12. State Models and Business Workflows

### 12.1 User account lifecycle

```text
Registered / Unverified -> Verified / Active -> Blocked
            |                    |               |
            +--------------------+---------------+--> Deleted (terminal for normal use)
```

- Registration begins as unverified.
- Successful email verification changes the verification state to verified.
- Only active, verified users may perform protected student actions.
- Admins can block an account for misuse and later restore it, subject to policy.
- A blocked or deleted account cannot use normal authenticated actions. Account deletion/retention behaviour must be explicit and not silently break transaction records.

### 12.2 Listing lifecycle

```text
Draft -> Pending Approval -> Active -> Reserved -> Sold (terminal)
                 |             |          |
                 v             |          +-> Active (valid cancellation/expiry)
              Rejected         |
                 |             +-> Removed (terminal)
                 v
          Edit and resubmit -> Pending Approval
```

The exact persistence enum may use `pending` instead of `pending_approval`; keep the label mapping consistent across API/UI/tests. Only the service layer may apply a state transition. Reject impossible transitions such as `Sold -> Active` or reserving `Pending`, `Rejected`, `Removed`, or `Sold` listings.

### 12.3 Sale workflow

1. A verified seller creates a listing.
2. The API validates it and saves it as pending.
3. The administrator approves or rejects it. The seller receives a notification.
4. Once active, students can search, view details, save it, and start a conversation.
5. A buyer reserves the item. The backend atomically checks the listing is still active, creates the transaction, and moves the listing to reserved. A concurrent reservation must fail cleanly.
6. If cancelled or expired under the policy, the item returns to active only if it is still reserved by that transaction.
7. After an on-campus handover, the seller confirms completion. The transaction becomes completed and the listing becomes sold.
8. Participants become eligible to submit reviews according to the review policy.

### 12.4 Exchange workflow

1. A buyer/requester selects an active exchange listing and submits an exchange request; the optional offered item must be active and owned by the requester.
2. The transaction starts pending and is visible to the seller.
3. The seller accepts or declines. On decline, close the request and leave the requested listing active. On acceptance, use a concurrency-safe operation to reserve/lock all involved listings and mark the transaction accepted/reserved.
4. Cancellation/expiry releases only listings held by that transaction.
5. After handover, the seller confirms completion, the transaction becomes completed, and both exchanged listings reach the terminal completed-exchange state represented in the UI as `Sold`/`Exchanged` according to the product's final status labels. Keep the transaction type as `exchange` so the history remains accurate.

The implementation must decide and document whether both parties must confirm exchange handover. The source report explicitly describes seller confirmation; buyer confirmation may be an optional future safety enhancement, not a hidden requirement.

### 12.5 Resource workflow

Upload -> pending moderation -> approved/active or rejected -> edit/resubmit or removed/taken down. Only approved resources are searchable/downloadable by regular verified students. Store a rejection/takedown reason and notify the uploader.

### 12.6 Report workflow

Report submitted -> open -> in review -> resolved or dismissed. The report remains linked to its target even if the target is later removed. Only administrators can assign or resolve reports.

## 13. Search, Indexing, and Data Integrity

- Add indexes for normalized unique email, public code fields, listing status/type/category/created time, and frequent academic/search filters.
- Add text or appropriately designed search indexes for listing titles/descriptions and resource title/subject. Document the selected MongoDB search approach; avoid unbounded regex queries on every collection.
- Add compound indexes for wishlist uniqueness, conversation uniqueness, review uniqueness, and the common admin moderation queue sort order.
- Keep all list endpoints paginated with a safe default and maximum page size.
- Use database-level unique indexes to enforce identifiers and duplicate-prevention rules.
- Use atomic conditional updates and MongoDB transactions for flows that change multiple documents, especially reservation, exchange acceptance, cancellation, and completion. Run MongoDB as a replica set (or use a compatible managed deployment) for transaction support. If a local environment lacks transactions, do not silently drop the integrity guarantees; document the required setup or implement a carefully reviewed conditional-update fallback.
- Never accept arbitrary MongoDB query operators from user input. Parse query parameters into an explicit filter allowlist.

## 14. File and Media Handling

- Use ImageKit for listing photographs and, where configured safely, resource PDFs/docs.
- Use Multer only as controlled multipart parsing; apply strict limits before uploads are forwarded to the storage provider.
- Check extension, declared MIME type, detected file signature, size, and allowed file category. Do not trust `originalname` or the browser-supplied MIME type.
- Generate storage names on the server. Never use client filenames as filesystem paths.
- Keep provider private keys on the backend only.
- Listing images can use approved CDN URLs where public delivery is acceptable; do not expose the storage API private key.
- For resources intended only for verified college members, authorize every download and use private storage plus short-lived signed access or backend-mediated downloads. A hard-to-guess URL is not a sufficient authorization system.
- Define configurable limits for image count, image size, resource file size, and permitted formats in environment/config rather than scattering constants.
- Store storage provider identifiers as well as URLs so files can be deleted/replaced and stale media can be reconciled.
- Handle orphan cleanup if database persistence fails after upload, and clean replaced/deleted media only after authorization and successful persistence.

## 15. Security and Privacy Design

1. Use HTTPS in deployment.
2. Hash passwords with bcryptjs and never return the hash in API responses.
3. Use short-lived access JWTs, separate refresh credentials, secure refresh rotation/revocation, and explicit token claim/algorithm validation.
4. Store refresh-token hashes server-side and use HttpOnly, Secure-in-production, SameSite cookies for the refresh credential. Validate request origin and apply a CSRF strategy to cookie-authenticated refresh/logout actions. Keep access tokens out of persistent browser storage when practical.
5. Use exact CORS allowlists, Helmet/security headers, body-size limits, request rate limits, strict parsing, and safe logging.
6. Validate every incoming payload using shared schemas at the API boundary; perform business-rule validation in services.
7. Escape user content at rendering time and sanitize rich text if rich text is supported. Prefer plain text for chat/reviews.
8. Verify role and object ownership on every protected API and socket event.
9. Do not trust user-supplied `sellerId`, `buyerId`, `ownerId`, `authorId`, `role`, `status`, `isVerified`, `approvedBy`, or similar privileged fields. Derive or assign them in trusted service code.
10. Rate-limit login, registration, email verification/resend, password reset, chat send, reports, and upload routes.
11. Avoid account enumeration in login and recovery error messages.
12. Store secrets only in environment variables/secret manager; commit `.env.example` without real credentials and ignore `.env` files.
13. Do not log credentials, cookies, OTPs, signed file URLs, private file contents, or full sensitive profile objects.
14. On blocking an account, reject future API/socket operations and revoke refresh sessions. Decide how in-progress transactions/reports are handled and preserve auditability.
15. Keep user contact details private and route communication through in-app chat.

## 16. Notifications and Real-Time Behaviour

Notifications must be saved in MongoDB before any best-effort live push. Relevant events include:

- Verification result and account status changes.
- Listing submitted, approved, or rejected.
- New message.
- Reservation created, cancelled, or expired.
- Exchange request received, accepted, or declined.
- Handover completed and review eligibility.
- Resource upload approved/rejected/taken down.
- Report outcome where policy allows notifying the reporter.

If Socket.IO is used, authenticate the socket with the same access-token rules, scope room membership to the user's own ID and authorized conversation IDs, authorize every subscribe/join/message event, and do not trust room IDs submitted by the client. Persisted REST endpoints remain the fallback source of truth.

## 17. Object-Oriented Design Mapping

The source report uses OO analysis/design concepts. Preserve the useful domain separation in JavaScript modules without forcing unnecessary classical inheritance:

- **Encapsulation:** Mongoose models define validated data shape; service functions own business rules and state transitions; controllers handle HTTP only.
- **Abstraction:** Routes expose domain operations rather than database implementation details.
- **Reuse:** Shared authentication, validation, error handling, file, notification, and response utilities are reused by feature modules.
- **Associations:** Students own listings/resources, participate in conversations/transactions, save listings, submit reviews, and create reports.
- **Specialized permissions:** Buyer and seller are student actors in a particular transaction. Admin is a separate privileged role with distinct server authorization.
- **Polymorphic transaction behaviour:** Service logic branches by `txnType` (`sale` or `exchange`) while keeping shared transaction metadata and lifecycle consistent.

## 18. API Surface Overview

All API routes should be versioned under `/api/v1`. The detailed route payload and status-code contract belongs in `codeinstruction.md`; at minimum, modules cover:

| Module | Responsibilities |
|---|---|
| Auth | Register, verify email, resend code, login, refresh, logout, current user, password reset |
| Users | Current profile, profile edit, safe public profile lookup |
| Listings | Create/edit/remove, detail, search/filter/sort, submit/resubmit, moderation state |
| Wishlist | List, add, remove saved listings |
| Conversations/messages | List conversations, open conversation, fetch history, send message, read state |
| Transactions | Reserve, exchange request, accept/decline, cancel, expiry, handover confirmation, history |
| Reviews | Submit eligible review, list safe public reviews, moderation if configured |
| Resources | Browse/search, submit upload, own-resource status, authorized download |
| Reports | File report, view own reports if allowed, admin triage/resolve |
| Notifications | List, unread count, mark read/read all |
| Admin | Dashboard metrics, user status, listing/resource moderation, report queues, audit history |
| Health | Readiness/liveness endpoint without leaking secrets or configuration |

Return consistent JSON response envelopes and documented error codes. Use appropriate HTTP status codes and avoid leaking internal stack traces.

## 19. Administration, Moderation, and Auditability

- Admin dashboard cards should reflect database-backed statistics, not hard-coded demo values.
- Moderation queues must be paginated and sorted predictably.
- Approval/rejection must include acting admin ID and timestamp. Rejection requires a reason.
- Blocking/restoring a user requires a reason and audit entry. Blocked users cannot create listings, message, reserve, review, upload, or use sockets.
- Resource takedown should revoke normal download access and record why it was removed.
- Reports must not permit self-assigned resolution by the reporter.
- Admin activity should be auditable but must avoid sensitive credentials or complete private chat content in logs.

## 20. Test Plan and Acceptance Cases

Run unit tests for validators/services and integration tests against a disposable MongoDB test deployment. Where a feature crosses a route, authorization, database, and notification boundary, add integration coverage. The source report provides these baseline cases; the final status column must be filled with the actual result after execution.

| ID | Module | Test | Expected result |
|---|---|---|---|
| TC01 | Registration | Register with valid college email and required details | Account created in unverified state; verification code/link sent |
| TC02 | Registration | Register with a personal/non-college email | Registration rejected |
| TC03 | Login | Login with correct email and password | Valid session is issued and dashboard becomes available |
| TC04 | Login | Login with incorrect password | Safe error; no authenticated session |
| TC05 | Listing | Submit a valid listing | Saved as pending and visible to admin moderation |
| TC06 | Listing | Submit a listing with required price missing | Validation error; no listing created |
| TC07 | Approval | Admin approves a pending listing | Listing becomes active, searchable, and seller is notified |
| TC08 | Search | Search a subject and apply branch filter | Only matching active listings are returned |
| TC09 | Search | Search for a non-matching keyword | Clear “No items found” state |
| TC10 | Chat | Buyer sends item-related message | Message is persisted and visible only to conversation participants; recipient is notified |
| TC11 | Reservation | Buyer reserves an active listing | Listing becomes reserved and transaction is created consistently |
| TC12 | Reservation | Second buyer tries to reserve an already reserved listing | Request fails safely with unavailable/conflict response |
| TC13 | Handover | Seller confirms valid reserved transaction handover | Transaction completes, listing becomes sold, review becomes available |
| TC14 | Review | Buyer submits a 1–5 rating after completion | Review is stored once and aggregate rating updates |
| TC15 | Resources | Verified user downloads approved PYQ | Authorized file download succeeds |
| TC16 | Resources | Upload unsupported file type or file above configured limit | Upload is rejected with a clear validation error |
| TC17 | Security | Normal student opens an admin endpoint directly | HTTP 403/denied response; no admin data returned |
| TC18 | Report | User reports a listing with a reason | Report is stored and appears in the admin queue |

### Additional mandatory cases

- Unverified student attempts to post, chat, reserve, or upload: denied.
- User A attempts to edit/delete User B's listing, wishlist, conversation, message, resource, or profile: denied.
- User submits `role: admin`, `sellerId`, `status: active`, or `approvedBy` in request body: ignored or rejected; no privilege escalation.
- Expired/used OTP cannot verify an account; too many attempts are throttled.
- Blocked user cannot use an already-established refresh session or socket.
- Concurrent reservation attempts result in at most one successful active reservation.
- Exchange request cannot offer someone else's item or the same item as the requested item.
- Duplicate wishlist and duplicate reviews are prevented by indexes and service validation.
- Unauthorized users cannot download restricted resources by guessing a URL or public code.
- A database/storage failure returns a safe error and does not leave an inconsistent transaction or publicly visible pending file.
- API pagination is bounded and filters cannot inject MongoDB operators.
- Mobile layout, keyboard navigation, validation messages, empty states, and loading/error states are checked.

## 21. Risks and Mitigation

The source report identifies the following risks and mitigations. Treat this as a required risk register during development and demo preparation.

| ID | Risk | Likelihood / Impact in report | Mitigation to implement |
|---|---|---|---|
| R1 | Fake or misleading listings | Medium / High | Approve every listing before publication; provide ratings/reviews, reporting, and admin review. |
| R2 | Unauthorized account/admin access | Medium / High | Strong password hashing, session expiry/rotation, server-side RBAC and ownership checks on every request, protected admin provisioning. |
| R3 | Student personal-data leakage | Low / High | Minimize collected data; hide contact details; use in-app chat; exclude secrets from API/logs; deploy over HTTPS. |
| R4 | Low adoption or too few initial listings | High / High | Seed approved PYQs and demo listings, recruit initial junior/senior batches, and promote via class representatives and notice boards. Seed data must be clearly identified and removable. |
| R5 | Copyrighted or incorrect study material | Medium / Medium | Upload policy, moderation, uploader attestation where appropriate, report/takedown process. |
| R6 | Spam, abuse, inappropriate chat/listings | Medium / Medium | Reporting, blocking, rate limits, clear policies, and basic abuse/keyword signals with moderator review. |
| R7 | Downtime or data loss | Low / High | Scheduled database and file backups, monitoring, restore drills, and a documented recovery procedure. |
| R8 | Buyer/seller dispute or no-show | Medium / Medium | Track item/transaction states, promote campus meet-up, allow reporting, retain relevant timestamps and provide admin review. The platform does not guarantee the physical deal. |
| R9 | Scope creep/time constraints | Medium / Medium | Build in priority order, keep MVP scope fixed, use modular development, and review progress against acceptance tests. |
| R10 | Email/OTP provider failure | Low / Medium | Resend cooldown, provider error handling, monitored retries, reliable email service, and an admin-assisted manual verification procedure with an audit trail. |

## 22. Development Phases

### Phase 0 — Repository and configuration

- Inspect the existing repository before changing files.
- Establish the client/server workspace, environment examples, lint/format/test scripts, and README.
- Verify package availability and compatible versions before installation.

### Phase 1 — Foundation and authentication

- Set up Vite + React and Express 5 with MongoDB/Mongoose.
- Add structured backend configuration, logging, error handling, validation, security middleware, health checks, and database indexes.
- Implement registration, verification, login/logout, refresh handling, profile, and role/ownership middleware.

### Phase 2 — Listings and search

- Implement category data, create/edit/remove listings, file upload, moderation, listing states, query filters, sorting, pagination, and wishlist.

### Phase 3 — Communication and transactions

- Implement conversations/messages, notifications, reservation concurrency controls, exchange accept/decline, cancellation/expiry, handover completion, and review eligibility.

### Phase 4 — Resource library and moderation

- Implement resource upload, approval, authorized download, takedown, reporting, admin queues, and dashboard metrics.

### Phase 5 — Hardening and release readiness

- Run all baseline and additional tests.
- Verify direct API authorization, upload validation, cross-user isolation, concurrency, and mobile/accessibility behaviour.
- Verify `.env`/secret handling, backup/restore documentation, and deployment settings.

Do not mark a phase complete because only its page exists. Its persistence, authorization, validation, error state, and tests must work.

## 23. Observability, Deployment, and Operations

- Use structured logs with request/correlation IDs and redact sensitive values.
- `/health/live` should indicate the process is running; `/health/ready` should verify essential dependencies without revealing credentials.
- Keep production secrets in environment/secret manager, never source control.
- Use a managed or properly configured MongoDB replica set for multi-document transactions and backups.
- Configure the exact deployed frontend origin in CORS, secure cookies for HTTPS, email delivery credentials, and ImageKit credentials.
- Set file and request limits appropriate to expected campus traffic.
- Document build, test, seed-admin, backup, and restore procedures in README or operations documentation.
- Do not include real students' data in demo seeds. Use fabricated demo accounts and clearly document credentials only for local development.

## 24. Future Enhancements

These are not required for the MVP unless explicitly prioritized later:

- Mobile application.
- Push notifications.
- Optional in-app payment processing after a separate security/business review.
- Recommendations based on branch, semester, or interest.
- Expansion from one college to multiple colleges with explicit tenant-aware isolation.
- Buyer confirmation of handover, dispute workflow improvements, and richer seller trust signals.
- Advanced search and analytics.

## 25. Definition of Done

The implementation is ready for a project demonstration only when:

- The application starts from documented commands with environment variables correctly configured.
- Frontend and backend use the requested stack, and MongoDB is the actual source of persisted data.
- Core flows work end-to-end; there are no fake action buttons for required functionality.
- User identities are unique, stable, and server-generated; resources are owned/authorized correctly.
- Admin features are protected on the server.
- File storage, verification email, auth/session handling, and failure states are documented and safely configurable.
- Baseline tests TC01–TC18 and additional authorization/concurrency tests are run and results are recorded.
- The README explains setup, environment configuration, seed data/admin creation, test execution, known limitations, and deployment.
- Known incomplete features are labeled honestly and are not presented as complete.
