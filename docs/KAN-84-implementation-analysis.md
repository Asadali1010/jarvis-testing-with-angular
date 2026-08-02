# KAN-84: Implementation Analysis — Editable Profile Feature

> Epic KAN-83 · Continuous Product Enhancement  
> Analysis date: 2026-08-01  
> Scope: codebase readiness for self-service profile editing on `/profile`

---

## 1. Application Structure (`src/app/`)

The app follows a conventional Angular feature-sliced layout with three top-level concerns under `src/app/`:

```
src/app/
├── app.ts / app.html          # Root component (RouterOutlet only)
├── app.routes.ts              # Top-level route table
├── app.routes.server.ts       # SSR prerender config
├── app.config.ts              # DI providers, hydration, zoneless CD
├── app.config.server.ts       # Server-side app config
│
├── core/                      # Cross-cutting domain logic
│   ├── constants/             # AUTH_CREDENTIALS, storage keys
│   ├── directives/            # focus-trap.directive
│   ├── guards/                # auth.guard, guest.guard
│   ├── models/                # user.model, settings.model, activity.model
│   └── services/              # Auth, User, Profile, Settings, Theme, Activity
│
├── layout/                    # Persistent chrome (authenticated shell)
│   ├── shell/                 # ShellComponent — header + sidebar + footer + outlet
│   ├── header/                # Page title, theme toggle, user menu, logout
│   ├── sidebar/               # Nav links (Dashboard, Users, Settings, Profile)
│   └── footer/
│
└── features/                  # Lazy-loaded route features
    ├── auth/                  # Login page + auth.routes
    ├── shell/                 # shell.routes — child routes under layout
    ├── dashboard/             # Stats, widgets, activity timeline
    ├── users/                 # CRUD table + user-form, user-detail, confirm-dialog
    ├── settings/              # Appearance, notifications, security, preferences
    └── profile/               # Read-only profile page (target of this epic)
```

### Key architectural patterns

| Pattern | Usage |
|---------|-------|
| Standalone components | All components use `imports: [...]` — no NgModules |
| Signal-based state | `signal`, `computed`, `effect` in services and components |
| Lazy loading | Route-level `loadComponent` / `loadChildren` |
| Injectable services | `providedIn: 'root'` for all domain services |
| Platform guards | `isPlatformBrowser(PLATFORM_ID)` before localStorage access |
| Zoneless change detection | `provideZonelessChangeDetection()` in app config |

---

## 2. Routing and Guards

### Route hierarchy

```
/  → redirect → /dashboard

/login                    guestGuard → auth feature (LoginComponent)
/                         authGuard  → shell feature
  └── ShellComponent
        /dashboard        DashboardComponent
        /users            UsersComponent
        /settings         SettingsComponent
        /profile          ProfileComponent   ← enhancement target
/**                       redirect → /dashboard
```

**Files:** `app.routes.ts`, `features/shell/shell.routes.ts`, `features/auth/auth.routes.ts`

### Guards

| Guard | File | Behavior |
|-------|------|----------|
| `authGuard` | `core/guards/auth.guard.ts` | Allows access when `AuthService.isAuthenticated()`; otherwise redirects to `/login` |
| `guestGuard` | `core/guards/guest.guard.ts` | Allows `/login` only when unauthenticated; otherwise redirects to `/dashboard` |

Both guards are functional (`CanActivateFn`) and inject `AuthService` + `Router`.

### SSR routing

`app.routes.server.ts` sets `renderMode: RenderMode.Prerender` for `**`. All routes—including `/profile`—are statically prerendered. Auth state is not available at prerender time; components must tolerate empty/unauthenticated state on first paint and hydrate client-side.

---

## 3. Services and State

### State management overview

There is no NgRx or external store. State lives in root injectable services backed by Angular signals and browser `localStorage`.

| Service | State mechanism | Persistence key |
|---------|----------------|-----------------|
| `AuthService` | `signal` for token + user | `app.auth.token` (via `AUTH_STORAGE`) |
| `UserService` | `signal<User[]>` | `app.users` |
| `ProfileService` | Stateless — derives from Auth + User | None (computed lookup) |
| `SettingsService` | Multiple signals | `app.settings` |
| `ThemeService` | `signal<ThemeMode>` | `app.theme` + `data-theme` on `<html>` |
| `ActivityService` | `signal<ActivityEvent[]>` | `app.activities` |

### AuthService

- `AuthUser` is minimal: `{ email: string }` only.
- Login validates against hard-coded `AUTH_CREDENTIALS` (`admin@example.com` / `Admin@123`).
- `currentUser` and `isAuthenticated` are `computed` signals.
- Storage is abstracted behind `AUTH_STORAGE` injection token (default: `LocalStorageAuthStorage`).

### UserService

- Full CRUD for admin user management with validation, pagination, bulk ops.
- `updateUser(id, UpdateUserInput)` merges partial input, validates, persists, records activity.
- `UpdateUserInput = Partial<CreateUserInput>` — includes admin fields (role, department, status).
- Seed data includes 5 users; first user email matches auth credentials.

### ProfileService (current — read-only)

```typescript
getProfileForCurrentUser(): User | null
```

Algorithm today:
1. Read `authService.currentUser()` — return `null` if absent.
2. Find matching user in `userService.users()` by case-insensitive email.
3. If found, return the `User` record.
4. Otherwise return `buildFallbackProfile(email)` with hard-coded defaults and `id: 'auth-user'`.

**Gap:** No write path. Fallback profiles are ephemeral (rebuilt on every read) and never persisted.

### ActivityService

Already exposes `recordProfileChange(userName, userId?)` with type `'profile_change'`. Ready for profile update integration.

---

## 4. Styling Tokens and UI Conventions

### Global design tokens (`src/styles.css`)

Defined on `:root` / `[data-theme='light']` and overridden in `[data-theme='dark']`:

| Token | Light value | Purpose |
|-------|-------------|---------|
| `--color-bg` | `#f8fafc` | Page background |
| `--color-bg-elevated` | `#ffffff` | Cards, inputs |
| `--color-bg-muted` | `#f1f5f9` | Secondary buttons, avatar gradient |
| `--color-border` | `#e2e8f0` | Borders |
| `--color-text` | `#0f172a` | Primary text |
| `--color-text-muted` | `#64748b` | Labels, secondary text |
| `--color-primary` | `#2563eb` | Primary actions |
| `--color-primary-hover` | `#1d4ed8` | Primary hover |
| `--color-primary-contrast` | `#ffffff` | Text on primary |
| `--color-danger` | `#dc2626` | Validation errors |
| `--color-success` | `#16a34a` | Success messages |
| `--color-focus-ring` | `#93c5fd` | Focus outlines |
| `--radius-sm/md/lg` | `0.375/0.5/0.75rem` | Border radius |
| `--shadow-sm/md` | subtle box-shadows | Elevation |
| `--font-sans` | Segoe UI stack | Typography |
| `--transition-theme` | 0.25s ease | Theme transitions |

Tailwind CSS v4 is imported globally (`@import 'tailwindcss'`) but components primarily use component-scoped CSS with these custom properties.

### Existing form patterns (reference: `UserFormComponent`)

- `ReactiveFormsModule` with `FormBuilder.nonNullable.group`
- Grid layout: 2 columns at `min-width: 640px`, full-width optional fields
- Field structure: `<label>` + `<input>` + conditional `.field-error[role="alert"]`
- Actions: `.btn.btn-secondary` (Cancel) + `.btn.btn-primary` (Save)
- Server errors: `.form-error[role="alert"]` above actions
- Focus: `outline: 2px solid var(--color-focus-ring)`

### Profile page styling (`profile.component.css`)

- Max width `48rem`, card with `--color-bg-elevated` + `--shadow-sm`
- Identity block: avatar (4.5rem, gradient fallback) + name + role
- Details: `<dl>` grid, 2 columns on sm+, bio spans full width
- Empty state: dashed border, centered muted text

---

## 5. Current Profile Feature (baseline)

**Route:** `/profile` (auth-protected, sidebar nav item present)

**Component:** `ProfileComponent` — standalone, uses `DatePipe`, injects `AuthService` + `ProfileService`.

**View mode only:**
- Header: "Your profile" / "Review your account details and workspace identity."
- Displays avatar (image or initials), name, role label
- Read-only `<dl>`: Email, Phone, Address, Bio, Company, Department, Role, Member since
- Empty state when unauthenticated: "Sign in to view your profile information."

**Tests:** `profile.component.spec.ts` (4 cases), `profile.service.spec.ts` (3 cases).

---

## 6. Risks and Constraints

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Fallback profile not persisted** | High | `updateProfileForCurrentUser` must create a real `User` record (via `UserService.createUser`) when `id === 'auth-user'`, or introduce a dedicated profile-overrides store |
| **SSR prerender + auth** | Medium | Profile page prerenders without auth; edit form must only initialize in browser after hydration; avoid reading localStorage during SSR |
| **Field authority mismatch** | Medium | Self-service edits must restrict writable fields (no role/department/status/email); reuse `UserService` validation for shared fields only |
| **Stale computed profile** | Medium | `ProfileComponent.profile` is a `computed` calling synchronous `getProfileForCurrentUser()` — after updates, `UserService.users()` signal must update to trigger re-render |
| **Duplicate email on fallback create** | Low | Guard create path with existing email check before inserting fallback-upgraded record |
| **No unsaved-changes guard** | Low | Consider confirming navigation away from dirty edit form (future enhancement) |
| **Activity conflation** | Low | Use `recordProfileChange` (not `recordUserUpdate`) for self-service edits to distinguish admin vs self edits in timeline |

---

## 7. Phased Enhancement Plan

### Phase 1 — Model and service layer (KAN-85 backend)

| Task | Files |
|------|-------|
| Add `UpdateProfileInput` interface | `core/models/user.model.ts` |
| Add `ProfileMutationResult` type alias | `core/models/user.model.ts` |
| Implement `ProfileService.updateProfileForCurrentUser()` | `core/services/profile.service.ts` |
| Unit tests for update paths (matched user, fallback create, validation, unauthenticated) | `core/services/profile.service.spec.ts` |

### Phase 2 — Component view/edit modes (KAN-85 UI)

| Task | Files |
|------|-------|
| Add `mode` signal (`'view' \| 'edit'`) to ProfileComponent | `features/profile/profile.component.ts` |
| Add reactive form mirroring editable fields | `features/profile/profile.component.ts` |
| Update template: view mode (existing) + edit mode (form) + action bar | `features/profile/profile.component.html` |
| Extend styles for form fields, success/error banners, action buttons | `features/profile/profile.css` |
| Component tests for edit flow | `features/profile/profile.component.spec.ts` |

### Phase 3 — Polish and integration

| Task | Files |
|------|-------|
| Wire `ActivityService.recordProfileChange` on successful save | `core/services/profile.service.ts` |
| Verify dashboard activity timeline reflects profile changes | `features/dashboard/` (read-only check) |
| Accessibility pass: form labels, focus management, live regions for save feedback | profile component |
| Manual SSR smoke test: prerendered HTML + client hydration edit flow | — |

### Phase 4 — Future considerations (out of scope)

- Avatar upload (currently URL-only on `User.avatar`)
- Email change with re-authentication
- Unsaved-changes route guard
- Optimistic UI with loading states

---

## 8. Files Expected to Change

| File | Change type |
|------|-------------|
| `core/models/user.model.ts` | Add types |
| `core/services/profile.service.ts` | Add update method |
| `core/services/profile.service.spec.ts` | Add tests |
| `features/profile/profile.component.ts` | View/edit modes, form |
| `features/profile/profile.component.html` | Dual-mode template |
| `features/profile/profile.component.css` | Form + feedback styles |
| `features/profile/profile.component.spec.ts` | Edit flow tests |

No routing, guard, or layout changes required — `/profile` route and nav link already exist.
