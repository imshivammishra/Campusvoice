# CampusVoice Security Documentation

## Authentication Security

### Password Hashing
- Algorithm: Argon2id
- Never store plaintext passwords
- Password hashes never returned through APIs
- Salt rounds: 12+

### Session Management
- JWT access tokens: 15-minute expiry
- JWT refresh tokens: 7-day expiry
- Tokens stored in HttpOnly cookies (not localStorage)
- Secure cookie flag in production
- SameSite=Lax cookie configuration
- Refresh token rotation on each use
- Session revocation on password change
- Login activity history tracking

### Rate Limiting
- Login attempts: rate limited
- Account lockout: 5 failed attempts = 15-minute lockout
- API rate limiting: 100 requests per 15 minutes

### CSRF Protection
- SameSite=Lax on all authentication cookies
- CSRF token required for state-changing operations

## Authorization Security (RBAC)

### Roles
- SUPER_ADMIN, CHAIRMAN, VICE_CHAIRMAN, PRO_VICE_CHANCELLOR
- REGISTRAR, PRINCIPAL, HOD, TEACHER, STUDENT, CLASS_REPRESENTATIVE

### Permissions
Granular permission-based access control:
- `users:create`, `users:read`, `users:update`, `users:deactivate`
- `elections:create`, `elections:vote`, `elections:manage`, `elections:certify`
- `proposals:create`, `proposals:review`, `proposals:publish`, `proposals:vote`
- `proposals:forward`, `proposals:escalate`
- `management-review:create`, `management-review:review`
- `resolutions:update`, `audit:read`, `institution:configure`

### Enforcement
- Backend guards on every protected API
- Frontend route guards (supplemental only — never trusted)
- Object-level authorization (department/class data restrictions)
- "Never trust frontend role information"

## Anonymous Voting Security

### Privacy Architecture
1. Voter authenticates via JWT
2. Eligibility checked server-side
3. One-time voting authorization token issued
4. Ballot recorded separately from identity
5. Authorization consumed after vote
6. Results calculated independently

### VoterHash
- SHA-256 hash of `userId:electionId:secret`
- One-way, cannot reverse to identity
- Stored in AnonymousBallot for duplicate prevention
- Stored in VotingAuthorization for linkage (consumed after vote)

### Guarantees
- No administrator has ordinary access to individual voting choices
- Duplicate voting prevented server-side (unique index)
- Votes cannot be changed after ballot closes
- Certified results cannot be silently modified

## Student Credential Restrictions

- Students cannot change username
- Students cannot change password through profile
- Students cannot modify institutional identity
- Students cannot change class/department
- Students can edit only permitted profile fields

### Higher Authority Operations
- Authorities can update permitted student/teacher information
- Authorities can deactivate accounts
- Authorities can initiate password resets
- Password resets generate secure reset workflow (not plaintext)
- Administrators cannot retrieve existing passwords
- All credential changes recorded in audit logs

## OWASP Compliance

### OWASP Top 10 Mitigations
1. **Broken Authentication** — Argon2id, JWT, HttpOnly cookies, rate limiting, lockout
2. **Broken Access Control** — Backend permission guards, object-level authorization
3. **Injection** — Mongoose ODM with schema validation, parameterized queries
4. **Insecure Design** — Privacy-by-design voting, separate ballot/identity storage
5. **Security Misconfiguration** — Helmet headers, CORS configuration, secure cookies
6. **Vulnerable Components** — Regular dependency updates
7. **Identification Failures** — Strong session management, token rotation
8. **Software Integrity** — Signed JWTs, secure bootstrapping
9. **Logging Failures** — Comprehensive audit events, no sensitive data in logs
10. **SSRF** — No server-side request forgery vectors

### OWASP ASVS
- Authentication Level 2
- Access Control Level 2
- Cryptography Level 2
- Error Handling Level 2
- Data Protection Level 2
- Communication Security Level 2

## Security Testing

Before institutional deployment:
- [ ] Penetration test by independent security firm
- [ ] OWASP ASVS verification
- [ ] Voting privacy audit
- [ ] RBAC privilege escalation testing
- [ ] Concurrent voting race condition testing
- [ ] File upload vulnerability scanning
