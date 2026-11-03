# CampusVoice Database Design

## Primary Database: MongoDB Atlas

## Collections

### User
Authentication and authorization data for all users (students, teachers, authorities).

**Key indexes:**
- `username` (unique)
- `email` (unique)
- `studentId` (unique, partial)
- `employeeId` (unique, partial)
- `institutionId + role`
- `departmentId + role`
- `classId + role`

**Security:** Password hashes are never exposed through APIs. Refresh tokens stored in array field.

### Institution
College/university information.

### Department
Academic departments within an institution.

### Class
Class/section groupings within a department.

### RegistrationApproval
Pending account approvals for all authority roles.

**Key indexes:**
- `email` (unique)
- `username` (unique)
- `status`

### CRElection
Weekly Class Representative elections.

**Key indexes:**
- `electionId` (unique)
- `classId + status`
- `opensAt + closesAt`
- `status`

### CRCandidate
Candidates for CR elections.

**Key indexes:**
- `electionId + studentId` (unique)

### AnonymousBallot
Anonymous votes. No user identity stored.

**Key indexes:**
- `ballotId` (unique)
- `electionId`
- `voterHash + electionId` (unique — prevents duplicate voting)

### VotingAuthorization
One-time voting authorization tokens. Links user to election anonymously via voterHash.

**Key indexes:**
- `token` (unique)
- `userId + electionId` (unique)
- `consumed + expiresAt`

### CRAssignment
CR term assignments. Tracks who is CR for which class and when.

**Key indexes:**
- `classId + isActive`
- `studentId`
- `termEndsAt`

### Proposal
Student concerns, teacher proposals, and management reviews.

**Key indexes:**
- `proposalId` (unique)
- `createdBy`
- `status`
- `classId + status`
- `department + status`
- `type`

### ManagementReview
Management accountability proposals.

**Key indexes:**
- `reviewId` (unique)
- `createdBy`
- `status`

### Escalation
Hierarchical escalation records.

**Key indexes:**
- `escalationId` (unique)
- `proposalId`
- `fromAuthority`
- `toAuthority`

### Resolution
Resolution tracking for proposals and escalations.

**Key indexes:**
- `resolutionId` (unique)
- `status`

### SupportTicket
Private support and grievance tickets.

**Key indexes:**
- `ticketId` (unique)
- `createdBy`
- `status`

### SupportMessage
Messages within support tickets.

**Key indexes:**
- `ticketId + createdAt`

### Notification
In-app and email notifications.

**Key indexes:**
- `userId + createdAt`
- `isRead`

### AuditEvent
Security audit log. Immutable record of all significant actions.

**Key indexes:**
- `createdAt`
- `userId + createdAt`
- `entityType + entityId`

### Session
User session tracking.

## Transaction Boundaries

MongoDB transactions (with replica set) are used for:
1. CR role assignment (revoke old CR, assign new CR, update permissions atomically)
2. Vote recording (save ballot, consume authorization, update vote count)
3. Registration approval (create user, update registration status)

## Privacy Architecture

- **AnonymousBallot** contains only: ballotId, electionId, choice, voterHash, castAt, ip
- **VotingAuthorization** links user to election but is consumed after voting
- **voterHash** is a one-way SHA-256 hash that cannot be reversed to identity
- No collection stores both user identity AND ballot choice

## Indexing Strategy

All queries use indexes. Compound indexes support:
- Vote authorization uniqueness (user + election)
- Duplicate vote prevention (voterHash + election)
- CR assignment lookup (class + active status)
- Audit trail querying (user + time)

## TTL Indexes

- VotingAuthorizations: expire after voting window
- Password reset tokens: expire after 1 hour
- Refresh tokens: expire after 7 days
