## 2025-04-19 - [Fix Hardcoded JWT Secret Fallback]
**Vulnerability:** The application used a weak, hardcoded string (`'secret'`) as a fallback for the `JWT_SECRET` environment variable.
**Learning:** Hardcoding a fallback secret makes tokens easily forgeable if the environment variable is accidentally missing, fundamentally undermining the security of JWT-based authentication.
**Prevention:** Always fail securely by throwing an error or exiting when critical cryptographic material (like a secret key) is missing, rather than attempting to fall back to an insecure default.
## 2025-04-21 - [Restrict Overly Permissive CORS Configurations]
**Vulnerability:** The API used `cors: { origin: '*' }` for Socket.IO and `app.use(cors())` for Express, which allowed cross-origin requests from any domain, making the application susceptible to CSRF attacks and unauthorized data access.
**Learning:** Hardcoding wildcard CORS origins exposes backend APIs unnecessarily to unauthorized clients, which is an easily exploitable architectural flaw in highly scalable services.
**Prevention:** Always restrict allowed CORS origins using an environment variable like `ALLOWED_ORIGINS` which strictly validates the domain before accepting the request, or fallback to standard development ports for local testing.

## 2026-04-22 - [Missing Input Length and Result Limits on Search Endpoint]
**Vulnerability:** The `/api/users/search` endpoint lacked minimum input length validation and did not limit the number of returned results, making it susceptible to bulk user enumeration and potential denial-of-service (DoS) via expensive wildcard database queries.
**Learning:** Unrestricted search endpoints are a common vector for data scraping and resource exhaustion, especially when utilizing open-ended `contains` ORM operations.
**Prevention:** Always enforce minimum query lengths (e.g., `q.length >= 3`) and strictly limit the maximum number of returned database rows (e.g., `take: 10`) on publicly accessible search endpoints.

## 2026-04-24 - [Unvalidated Request Payload Types Leading to Injection and Crashes]
**Vulnerability:** The API implicitly assumed properties like `req.body.email` and `req.query.q` were strings without explicit validation. Attackers could send JSON arrays or objects (e.g. `{"email": {"$gte": ""}}`) bypassing initial checks and causing methods like `bcrypt.hash`, `bcrypt.compare`, or ORM queries to crash the server (500 Internal Server Error) or behave unexpectedly.
**Learning:** Destructuring request payloads does not enforce primitive typing. Assuming inputs are strings leaves the system vulnerable to Type Injection and resource exhaustion attacks (DoS).
**Prevention:** Always strictly validate the type of incoming request properties (e.g., `typeof email === 'string'`) before passing them to internal functions or ORM operations.

## 2024-03-24 - Unsafe Test Secrets in Environment Configuration
**Vulnerability:** A hardcoded test secret ('test-jwt-secret-with-enough-length') was used as a fallback for the JWT_SECRET environment variable if NODE_ENV was set to 'test'. This allowed attackers to potentially manipulate NODE_ENV to bypass authentication if the environment configuration was compromised or incorrectly deployed.
**Learning:** Hardcoded secrets in code, even for specific non-production environments, pose a significant risk as they might be exposed or unintentionally used in other contexts.
**Prevention:** Rely strictly on external environment variables for secrets, even in test environments. Use test setup files to mock or provide these environment variables explicitly during testing, instead of hardcoding fallback values directly in the application's environment configuration parsing logic.
