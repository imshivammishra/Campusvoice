# CAMPUSVOICE - DEVELOPMENT PLAN

## Phase 1: Project Setup & Shared Package
- [ ] Create monorepo directory structure (frontend, backend, shared, infrastructure, scripts, documentation)
- [ ] Initialize shared TypeScript package with types, Zod schemas, constants
- [ ] Initialize backend NestJS app with modular architecture
- [ ] Initialize frontend Next.js App Router with Tailwind + shadcn/ui
- [ ] Configure MongoDB Atlas connection, Redis, environment variables

## Phase 2: Authentication & RBAC (Foundation)
- [ ] User schema (Student, Teacher, Authority roles)
- [ ] Argon2id password hashing, no plaintext passwords
- [ ] JWT access + refresh tokens, HttpOnly cookies
- [ ] Login / logout / password reset / account deactivation
- [ ] Rate limiting, account lockout, security audit logs
- [ ] Permission-based guards (NestJS guards)
- [ ] Super Admin bootstrap (deployment-time only)
- [ ] Registration approval workflow

## Phase 3: CR Election System
- [ ] Election schemas, nomination, voting authorization
- [ ] Anonymous ballot storage (separate from identity)
- [ ] Weekly scheduler (BullMQ), idempotent & recoverable
- [ ] CR role assignment (atomic), term expiration
- [ ] Election result certification, tie-breaking

## Phase 4: Concern & Proposal System
- [ ] Student concerns, teacher proposals
- [ ] Proposal audiences, voting sessions
- [ ] CR forwarding to teachers/HOD/Principal
- [ ] Management accountability proposals

## Phase 5: Escalation & Resolution
- [ ] Hierarchical escalation system
- [ ] Authority actions, deadlines, reminders
- [ ] Resolution tracking

## Phase 6: Support Chat (Socket.IO)
- [ ] Real-time messaging, private tickets
- [ ] Access controls, attachments, read status

## Phase 7: Notifications
- [ ] In-app + email notifications
- [ ] BullMQ queues, preferences, retry handling

## Phase 8: Dashboards
- [ ] Student, Teacher, CR, HOD, Principal, Registrar, VC, Pro-VC, Chairman, Super Admin

## Phase 9: Testing & QA
- [ ] Unit, integration, RBAC, voting concurrency tests
- [ ] E2E tests for all critical acceptance tests (TEST 1-24)
- [ ] Security tests (OWASP ASVS / Top 10)

## Phase 10: Deployment & Documentation
- [ ] Docker/PM2 config, Nginx, HTTPS/Certbot
- [ ] GitHub Actions CI/CD
- [ ] .env.example, bootstrap instructions, README
