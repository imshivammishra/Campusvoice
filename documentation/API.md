# CampusVoice API Documentation

Base URL: `https://api.campusvoice.example.com/api/v1`

All API responses follow this structure:

```json
{
  "success": true,
  "data": null,
  "message": null,
  "error": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Authentication

### POST /auth/login
Authenticate a user and set HttpOnly cookies.

**Body:**
```json
{
  "usernameOrEmail": "string",
  "password": "string"
}
```

**Cookies set:**
- `cv_access_token` - JWT access token (15 min expiry, HttpOnly)
- `cv_refresh_token` - JWT refresh token (7 day expiry, HttpOnly, path=/auth)

### POST /auth/logout
Clear authentication cookies and revoke refresh token.

### POST /auth/refresh
Refresh access token using refresh token cookie.

### POST /auth/password-reset/request
Request a password reset token (sent to email).

### POST /auth/password-reset/confirm
Confirm password reset with token.

### GET /auth/me
Get current authenticated user.

## Users

### GET /users
List users (requires `users:read`).

### GET /users/:id
Get user by ID (requires `users:read`).

### PATCH /users/:id/permissions
Update user permissions (requires `users:update`).

### PATCH /users/:id/deactivate
Deactivate a user account (requires `users:deactivate`).

### GET /users/me/profile
Get current user profile.

## Registrations

### POST /registrations
Create a registration request (public for students/teachers, authorized for authorities).

### GET /registrations
List pending registrations (requires `users:read`).

### PATCH /registrations/:id/approve
Approve a registration and create user account (requires `users:create`).

### PATCH /registrations/:id/reject
Reject a registration (requires `users:create`).

## Elections (CR Elections)

### POST /elections
Create a CR election (requires `elections:create`).

### GET /elections
List elections.

### GET /elections/election/:electionId
Get election by election ID.

### POST /elections/nominate
Nominate a candidate (requires `elections:vote`).

### POST /elections/withdraw
Withdraw candidacy (requires `elections:vote`).

### GET /elections/:electionId/candidates
Get candidates for an election.

### POST /elections/:electionId/certify
Certify election results (requires `elections:certify`).

## Voting

### POST /voting/authorize
Request a one-time voting authorization token.

### POST /voting/vote
Cast an anonymous vote.

### GET /voting/results/:electionId
Get voting results (anonymous - no voter identities).

### GET /voting/has-voted/:electionId
Check if user has voted in an election.

## Proposals

### POST /proposals
Create a proposal/concern.

### GET /proposals
List proposals.

### GET /proposals/pid/:proposalId
Get proposal by proposal ID.

### PATCH /proposals/:id/publish
Publish a proposal for voting (requires `proposals:publish`).

### PATCH /proposals/:id/forward
Forward a proposal to an authority (requires `proposals:forward`).

### PATCH /proposals/:id/escalate
Escalate a proposal (requires `proposals:escalate`).

### PATCH /proposals/:id/start-voting
Start voting on a proposal.

### PATCH /proposals/:id/close-voting
Close voting on a proposal.

### PATCH /proposals/:id/certify
Certify proposal results.

## Management Reviews

### POST /management-reviews
Create a management review proposal.

### GET /management-reviews
List management reviews.

### GET /management-reviews/rid/:reviewId
Get review by ID.

### POST /management-reviews/:id/respond
Respond to a management review.

## Escalations

### POST /escalations
Create an escalation.

### GET /escalations
List escalations.

### POST /escalations/:id/respond
Respond to an escalation.

## Resolutions

### POST /resolutions
Create a resolution.

### GET /resolutions
List resolutions.

### PATCH /resolutions/:id/status
Update resolution status.

## Support

### POST /support
Create a support ticket.

### GET /support
List support tickets.

### GET /support/:id/messages
Get ticket messages.

### POST /support/:id/messages
Add a message to a ticket.

### POST /support/:id/read
Mark ticket messages as read.

## Notifications

### GET /notifications
Get user notifications.

### POST /notifications
Create a notification.

### PATCH /notifications/:id/read
Mark notification as read.

## Audit

### GET /audit
Read audit logs (requires `audit:read`).

## Admin

### GET /admin/stats
System statistics (requires `audit:read`).

## API Documentation (Swagger)

Interactive API documentation is available at:
`https://api.campusvoice.example.com/api/docs`

## Security

- All passwords are hashed with Argon2id
- JWT access tokens are short-lived (15 minutes)
- Refresh tokens are stored in HttpOnly cookies
- Rate limiting on authentication endpoints
- Account lockout after 5 failed login attempts
- CSRF protection via SameSite=Lax cookies
- No passwords ever returned through APIs
- Anonymous voting: ballots stored separately from voter identity
