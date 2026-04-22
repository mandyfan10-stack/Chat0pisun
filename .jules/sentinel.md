## 2025-04-19 - [Fix Hardcoded JWT Secret Fallback]
**Vulnerability:** The application used a weak, hardcoded string (`'secret'`) as a fallback for the `JWT_SECRET` environment variable.
**Learning:** Hardcoding a fallback secret makes tokens easily forgeable if the environment variable is accidentally missing, fundamentally undermining the security of JWT-based authentication.
**Prevention:** Always fail securely by throwing an error or exiting when critical cryptographic material (like a secret key) is missing, rather than attempting to fall back to an insecure default.
## 2025-04-21 - [Restrict Overly Permissive CORS Configurations]
**Vulnerability:** The API used `cors: { origin: '*' }` for Socket.IO and `app.use(cors())` for Express, which allowed cross-origin requests from any domain, making the application susceptible to CSRF attacks and unauthorized data access.
**Learning:** Hardcoding wildcard CORS origins exposes backend APIs unnecessarily to unauthorized clients, which is an easily exploitable architectural flaw in highly scalable services.
**Prevention:** Always restrict allowed CORS origins using an environment variable like `ALLOWED_ORIGINS` which strictly validates the domain before accepting the request, or fallback to standard development ports for local testing.
