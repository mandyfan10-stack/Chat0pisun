## 2025-04-19 - [Fix Hardcoded JWT Secret Fallback]
**Vulnerability:** The application used a weak, hardcoded string (`'secret'`) as a fallback for the `JWT_SECRET` environment variable.
**Learning:** Hardcoding a fallback secret makes tokens easily forgeable if the environment variable is accidentally missing, fundamentally undermining the security of JWT-based authentication.
**Prevention:** Always fail securely by throwing an error or exiting when critical cryptographic material (like a secret key) is missing, rather than attempting to fall back to an insecure default.
