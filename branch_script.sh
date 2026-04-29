git commit --amend -m "🧪 Add tests for API interceptors

🎯 **What:** The API service interceptors and token management functions in \`apps/web/src/services/api.ts\` were completely untested.
📊 **Coverage:** Covered both token management (get/set/clear) and Axios interceptors (request header injection, 401 token refresh retry, and auth failure callback on failed refresh).
✨ **Result:** Enhanced test coverage for the core networking and authentication retry logic of the web application, ensuring regressions in token management can be caught early."
