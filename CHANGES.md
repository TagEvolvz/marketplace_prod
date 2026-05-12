# Production Hardening Changelog

## Files Added

### backend/src/config/env.ts
Zod schema that validates all environment variables at process startup.
The application exits immediately with a clear, field-level error message if
any required variable is missing or malformed. This replaces scattered
`process.env` reads with a single typed `env` object imported throughout
the codebase.

### backend/src/schemas/index.ts
All request schemas in one file: body, query params, and route params.
Uses Zod with coercions, transforms, and strict type constraints. Covers:
auth, products, cart, orders, reviews, vendor, admin flows.
Replaces express-validator which had weaker type inference and required
hand-rolled error formatting.

### backend/src/middleware/zodValidate.ts
Middleware factory that parses `req.body`, `req.query`, and `req.params`
against a Zod schema. Overwrites each field with the coerced/transformed
value so controllers receive clean typed data. Formats validation failures
into the standard `{ success, message, code, errors }` shape.

### backend/src/middleware/requestId.ts
Stamps every incoming request with a UUID (`req.requestId`). Reuses the
`X-Request-ID` header if upstream set one. Echoes the ID in the response
header. Allows log lines from different middleware layers to be correlated
against a single request in production log aggregators.

### backend/src/config/cache.ts
Typed cache layer over the raw Redis client. Enforces:
- Consistent key namespacing (`namespace:resource:id`)
- Explicit TTL constants in one place (`TTL` object)
- `withCache()` — standard cache-aside helper, eliminates duplicated
  read/write/return patterns across services
- `invalidateGroup()` — pattern-based cache invalidation so a single
  product update clears all related list query caches atomically

### backend/vitest.config.ts
Vitest configuration replacing Jest. Includes path aliases, coverage
thresholds (70% lines/functions), and excludes scripts and type files.

### frontend/src/__tests__/setup.ts
Global test setup: mocks react-hot-toast and socket.io-client, suppresses
known React test noise from console.error.

### frontend/src/__tests__/auth.slice.test.ts
Unit tests for the auth Redux slice covering:
- All synchronous reducers (setCredentials, setUser, updateUser, logout)
- restoreSession thunk: fulfilled, rejected paths
- loginUser thunk: fulfilled, pending, rejected paths
- fetchCurrentUser thunk: fulfilled, rejected with state cleanup

### frontend/src/__tests__/cart.slice.test.ts
Unit tests for the cart Redux slice covering:
- itemCount derivation from item quantities on setCart
- clearCart resets to null/zero
- setCartLoading toggle
- Cart replacement on successive setCart calls

### frontend/src/__tests__/ProtectedRoute.test.tsx
Component tests for ProtectedRoute covering:
- Renders nothing while isLoading (prevents premature redirect)
- Redirects unauthenticated users to /auth/login
- Renders outlet when authenticated with no role restriction
- Redirects to default "/" on role mismatch
- Honours custom redirectPath
- Grants access for any of multiple allowed roles
- Backward-compatible `roles` prop

### backend/src/__tests__/auth.service.test.ts (replaced)
Unit tests for AuthService using Vitest mocks, no database connection:
- register: duplicate email, successful creation, token return
- login: unknown email, wrong password, deactivated account, success, token persistence
- refreshToken: missing token, stale/revoked token, valid rotation
- logout: targeted token removal, graceful no-op for unknown user
- ApiError: static helpers, status codes, validation errors array

## Files Modified

### backend/src/server.ts
- Added `import './config/env'` as the first statement — env validation
  runs before any network or database connections are attempted
- Added `import { requestId } from './middleware/requestId'` — applied
  before all other middleware so every request is stamped immediately
- `initMonitoring()` is now called at startup (was defined but never called)
- Removed wildcard CORS (`*`) — origin list now uses validated `env` values
- Morgan `skip` function only suppresses successful requests in production,
  logs everything in development

### backend/src/middleware/index.ts
- Error handler now includes a `code` field in every response body
  (BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, etc.)
- Error handler logs to Winston with `requestId` for correlation
- Rate limiter `keyGenerator` uses `req.requestId` instead of raw IP
  (more reliable behind proxies / load balancers)
- Removed `express-validator` import — all validation now via zodValidate
- Fixed `authorize` to accept variadic roles for cleaner call sites

### backend/src/routes/index.ts
- Replaced all `validate(...)` calls with `zodValidate(schema)`
- Added missing query param validation on product list, order list,
  vendor order list endpoints
- Added body validation on cart update endpoint (was missing previously)
- Added param validation on admin user/vendor ID routes

### backend/src/services/product.service.ts
- All `cacheGet`/`cacheSet`/`cacheDel`/`cacheDelPattern` calls replaced
  with `withCache`, `invalidateKey`, `invalidateGroup` from `config/cache`
- Cache keys now use `CacheKey.*` builders — no ad-hoc string literals
- TTL values now reference `TTL.*` constants — one place to tune
- Invalidation on create/update/delete clears both the detail key and all
  list query keys for both the global product namespace and the vendor's
  own namespace, preventing stale list results after mutations
- `ProductFilters` interface updated to accept both string and number for
  numeric fields (Zod coerces query strings to numbers before the service
  sees them)

### backend/package.json
- Replaced Jest + ts-jest with Vitest and @vitest/coverage-v8
- Added `zod` to runtime dependencies
- Removed `express-validator`
- Removed `xss-clean` (superseded by express-mongo-sanitize + Helmet CSP)

### backend/.env.example
- Added all fields required by the Zod env schema
- Added inline comments explaining constraints (min length, prefix format)
- Grouped by concern with section headers

### frontend/vite.config.ts
- Added `test` block: jsdom environment, setup file reference, coverage
  thresholds, include/exclude patterns

### .github/workflows/ci-cd.yml
- Removed all emojis from job names and step descriptions
- Updated backend test job to use `npm run test:ci` (vitest)
- Added minimal env vars to backend test job so env validation passes
- Frontend test job runs `vitest --run --coverage` explicitly
- Added `fail-fast: false` on lint matrix so one package failure does not
  abort the other
- Removed MongoDB/Redis service containers from test job (unit tests are
  now fully in-memory, no infrastructure required)
