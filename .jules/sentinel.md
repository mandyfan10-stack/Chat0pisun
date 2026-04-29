## 2024-04-29 - Prevent bulk user enumeration in search endpoint
**Vulnerability:** The `/api/users/search` endpoint lacked minimum input length validation, making it susceptible to bulk user enumeration and potential denial-of-service (DoS) via expensive database queries for very short search strings.
**Learning:** Returning 400 Bad Request for short queries can lead to unhandled errors on the frontend. It is better to gracefully return an empty array for short inputs.
**Prevention:** Always enforce a minimum query length (e.g., 3 characters) on search endpoints and gracefully return empty results for short queries to prevent both backend load and frontend error spam.
