## 2025-04-19 - [Fix Hardcoded JWT Secret Fallback]
**Vulnerability:** The application used a weak, hardcoded string (`'secret'`) as a fallback for the `JWT_SECRET` environment variable.
**Learning:** Hardcoding a fallback secret makes tokens easily forgeable if the environment variable is accidentally missing, fundamentally undermining the security of JWT-based authentication.
**Prevention:** Always fail securely by throwing an error or exiting when critical cryptographic material (like a secret key) is missing, rather than attempting to fall back to an insecure default.

## 2025-04-20 - [Fix Overly Permissive CORS Configuration]
**Vulnerability:** The application allowed all origins (`*`) for both Express and Socket.IO CORS configuration.
**Learning:** Allowing all origins (`*`) opens the application up to cross-origin attacks where malicious websites can make unauthorized requests on behalf of the user. This is especially dangerous when APIs deal with authenticated state or sensitive actions like messaging.
**Prevention:** Always use an explicit whitelist of allowed origins. Use environment variables (like `ALLOWED_ORIGINS`) to easily configure allowed domains for different environments without hardcoding or resorting to wildcards.
