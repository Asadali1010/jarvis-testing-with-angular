# KAN-85: Feature Design Plan — Editable Profile

> Epic KAN-83 · Continuous Product Enhancement  
> Depends on: [KAN-84 Implementation Analysis](./KAN-84-implementation-analysis.md)  
> Baseline: read-only profile at `src/app/features/profile/`

---

## 1. Feature Scope

Enable authenticated users to edit their own profile information on the existing `/profile` route. The page retains its current read-only **view mode** as the default and adds an **edit mode** toggled in-place (no separate route or child route).

### In scope

- Toggle between view and edit modes on `/profile`
- Edit self-service fields: first name, last name, phone, address, bio, company
- Save changes via `ProfileService.updateProfileForCurrentUser`
- Cancel returns to view mode without persisting
- Inline validation matching existing `UserService` rules for shared fields
- Success and error feedback after save attempt
- Activity log entry on successful save

### Out of scope

- Changing email (tied to auth identity; display read-only in edit mode)
- Changing role, department, or status (admin-managed via `/users`)
- Avatar file upload (display only; optional URL field deferred)
- Password change (handled on `/settings`)
- Separate `/profile/edit` route

---

## 2. View / Edit Mode Design

### State

```typescript
// ProfileComponent
readonly mode = signal<'view' | 'edit'>('view');
readonly saveMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
readonly isSaving = signal(false);
```

### Mode transitions

| Action | From | To | Side effects |
|--------|------|----|--------------|
| Page load | — | `view` | Load profile via existing `computed` |
| Click "Edit profile" | `view` | `edit` | Patch reactive form from current profile; clear messages |
| Click "Cancel" | `edit` | `view` | Reset form; clear messages |
| Click "Save changes" (valid) | `edit` | `view` | Call service, show success banner |
| Click "Save changes" (invalid) | `edit` | `edit` | Show field errors, stay in edit |
| Successful save | `edit` | `view` | Profile computed re-reads updated user |

### View mode (unchanged baseline)

Preserve existing layout:
- Page header with title and subtitle
- Profile card with identity block (avatar + name + role)
- Definition list of all fields
- Primary action: **Edit profile** button in card header (top-right)

When `profile()` is `null`, show existing empty state — no edit button.

### Edit mode

Replace the `<dl>` details block with a reactive form. Keep the identity block (avatar + name + role) visible above the form as context — name/role update live from form values on save.

Read-only fields shown as disabled-style rows above editable inputs:
- **Email** — "Contact your administrator to change your email."
- **Role** — display only
- **Department** — display only
- **Member since** — display only

---

## 3. UpdateProfileInput

Add to `core/models/user.model.ts`:

```typescript
/** Fields a user may update on their own profile. */
export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  bio?: string;
  company?: string;
}

export type ProfileMutationResult =
  | { success: true; user: User }
  | { success: false; error: string };
```

### Field rules

| Field | Required | Max length | Validation |
|-------|----------|------------|------------|
| `firstName` | Yes | — | Non-empty after trim |
| `lastName` | Yes | — | Non-empty after trim |
| `phone` | Yes | — | `UserService.isValidPhone()` (10–15 digits) |
| `address` | No | 200 chars | Trimmed; empty → `undefined` |
| `bio` | No | 500 chars | Trimmed; empty → `undefined` |
| `company` | No | 100 chars | Trimmed; empty → `undefined` |

Validation messages (match existing `UserFormComponent` tone):
- "First name is required."
- "Last name is required."
- "Phone is required."
- "Enter a valid phone number."

---

## 4. ProfileService.updateProfileForCurrentUser Algorithm

Add to `core/services/profile.service.ts`:

```typescript
updateProfileForCurrentUser(input: UpdateProfileInput): ProfileMutationResult
```

### Pseudocode

```
1. auth ← authService.currentUser()
   IF auth is null:
     RETURN { success: false, error: 'Sign in to update your profile.' }

2. normalized ← normalize input (trim strings, empty optionals → undefined)

3. validationError ← validateProfileInput(normalized)
   IF validationError:
     RETURN { success: false, error: validationError }

4. profile ← getProfileForCurrentUser()

5. IF profile is null:
     // Should not happen when auth exists, but guard anyway
     RETURN { success: false, error: 'Profile not found.' }

6. IF profile.id === 'auth-user':
     // Fallback profile — user not in directory yet
     result ← userService.createUser({
       firstName: normalized.firstName,
       lastName: normalized.lastName,
       email: auth.email,
       phone: normalized.phone,
       role: profile.role,           // preserve fallback defaults
       department: profile.department,
       status: profile.status,
       address: normalized.address,
       bio: normalized.bio,
       company: normalized.company,
     })
     IF result.success:
       activityService.recordProfileChange(
         `${result.user.firstName} ${result.user.lastName}`,
         result.user.id,
       )
     RETURN result mapped to ProfileMutationResult

7. ELSE (matched directory user):
     result ← userService.updateUser(profile.id, {
       firstName: normalized.firstName,
       lastName: normalized.lastName,
       phone: normalized.phone,
       address: normalized.address,
       bio: normalized.bio,
       company: normalized.company,
       // intentionally omit: email, role, department, status
     })
     IF result.success:
       activityService.recordProfileChange(
         `${result.user.firstName} ${result.user.lastName}`,
         result.user.id,
       )
     RETURN result mapped to ProfileMutationResult
```

### Private helper: `validateProfileInput`

Reuse `UserService.isValidPhone()` and mirror `UserService.validateUserInput` checks for the subset of fields. Keep validation in `ProfileService` to avoid widening `UpdateUserInput` semantics.

### Dependency injection

Inject `ActivityService` into `ProfileService` (currently only Auth + User).

---

## 5. UI Layout and Copy

### Page header (view mode)

| Element | Copy |
|---------|------|
| `<h2>` | Your profile |
| Subtitle | Review your account details and workspace identity. |
| Primary CTA | Edit profile |

### Page header (edit mode)

| Element | Copy |
|---------|------|
| `<h2>` | Edit profile |
| Subtitle | Update your contact information and bio. |

### Form field labels

| Control | Label | Notes |
|---------|-------|-------|
| firstName | First name | `autocomplete="given-name"` |
| lastName | Last name | `autocomplete="family-name"` |
| phone | Phone | `type="tel"`, `autocomplete="tel"` |
| address | Address | Optional suffix: `(optional)` |
| bio | Bio | Optional; `<textarea rows="3">` |
| company | Company | Optional suffix: `(optional)` |

### Read-only rows (edit mode)

| Label | Helper text |
|-------|-------------|
| Email | Contact your administrator to change your email. |
| Role | — (display formatted role label) |
| Department | — |
| Member since | — (formatted date) |

### Action buttons (edit mode)

| Button | Type | Label |
|--------|------|-------|
| Cancel | `button` | Cancel |
| Save | `submit` | Save changes |

Disable both buttons while `isSaving()` is true. Save button shows "Saving…" during request.

### Feedback messages

| Scenario | Type | Copy |
|----------|------|------|
| Save success | success | Profile updated successfully. |
| Service error | error | `{result.error}` (passthrough) |
| Unauthenticated save | error | Sign in to update your profile. |

Display in a banner above the form/card with `role="status"` (success) or `role="alert"` (error). Use `--color-success` / `--color-danger` borders consistent with settings page patterns.

### Empty state (unchanged)

> Sign in to view your profile information.

---

## 6. Component Implementation Notes

### Form setup

```typescript
readonly form = this.fb.nonNullable.group({
  firstName: ['', Validators.required],
  lastName: ['', Validators.required],
  phone: ['', Validators.required],
  address: [''],
  bio: [''],
  company: [''],
});
```

Use `effect()` or an `enterEditMode()` method to patch form when switching to edit:

```typescript
enterEditMode(): void {
  const user = this.profile();
  if (!user) return;
  this.form.patchValue({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    address: user.address ?? '',
    bio: user.bio ?? '',
    company: user.company ?? '',
  });
  this.saveMessage.set(null);
  this.mode.set('edit');
}
```

### Save handler

```typescript
async onSave(): Promise<void> {
  this.form.markAllAsTouched();
  if (this.form.invalid) return;

  this.isSaving.set(true);
  this.saveMessage.set(null);

  const result = this.profileService.updateProfileForCurrentUser({
    firstName: this.form.value.firstName!.trim(),
    lastName: this.form.value.lastName!.trim(),
    phone: this.form.value.phone!.trim(),
    address: this.form.value.address?.trim() || undefined,
    bio: this.form.value.bio?.trim() || undefined,
    company: this.form.value.company?.trim() || undefined,
  });

  this.isSaving.set(false);

  if (result.success) {
    this.saveMessage.set({ type: 'success', text: 'Profile updated successfully.' });
    this.mode.set('view');
    return;
  }

  this.saveMessage.set({ type: 'error', text: result.error });
}
```

### CSS additions

Extend `profile.component.css` following `UserFormComponent` conventions:
- `.profile-actions` — flex row, top-right in card header (view mode)
- `.profile-form` — grid gap matching `.profile-details`
- `.form-field`, `.field-error`, `.form-actions` — reuse token names from user form
- `.profile-banner--success` / `.profile-banner--error` — feedback banners
- `.profile-readonly` — muted read-only field rows in edit mode

### Accessibility

- Edit button: `aria-label="Edit profile"` if icon-only; prefer visible text
- Form: `aria-labelledby="profile-heading"`
- Error fields: `aria-describedby` linking input to error span
- Focus first invalid field on failed submit
- Success banner: `role="status"` with `aria-live="polite"`

---

## 7. SSR and Hydration Notes

| Concern | Handling |
|---------|----------|
| Prerendered `/profile` | Renders empty/unauthenticated state; acceptable |
| Auth from localStorage | Available only after client hydration via `LocalStorageAuthStorage` |
| Form initialization | Only patch form on explicit edit action (browser-only); never in constructor |
| `UserService` seed data | SSR uses `SEED_USERS` clone; browser merges localStorage — profile for admin matches after hydration |
| Saving | Inherently client-side (localStorage persistence); no server API |
| Hydration mismatch | Avoid rendering edit form by default; `mode` defaults to `'view'` on both server and client |

No changes to `app.routes.server.ts` required.

---

## 8. Test Cases

### ProfileService (`profile.service.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| S1 | `updateProfileForCurrentUser` when unauthenticated | `{ success: false, error: 'Sign in to update your profile.' }` |
| S2 | Update matched user (admin@example.com) | Success; user in `UserService` has new firstName; `updatedAt` changed |
| S3 | Update with invalid phone | `{ success: false, error: 'Enter a valid phone number.' }` |
| S4 | Update with empty firstName | `{ success: false, error: 'First name is required.' }` |
| S5 | Update fallback profile (unknown email) | Creates new user via `createUser`; returns success with real id (not `auth-user`) |
| S6 | Successful update records activity | `ActivityService` activities includes `type: 'profile_change'` |
| S7 | Optional fields cleared | Empty address/bio/company stored as `undefined` |

### ProfileComponent (`profile.component.spec.ts`)

| # | Test | Expected |
|---|------|----------|
| C1 | View mode shows "Edit profile" button when authenticated | Button visible |
| C2 | Click "Edit profile" switches to edit mode | Form visible, `<dl>` hidden |
| C3 | Edit mode pre-fills form with current profile values | firstName = "Admin", phone matches seed |
| C4 | Cancel returns to view mode without saving | Mode = view; original values in `<dl>` |
| C5 | Save with valid changes updates displayed name | View mode shows new firstName after save |
| C6 | Save with invalid phone shows field error | Error span visible; stays in edit mode |
| C7 | Save success shows success banner | Banner text contains "Profile updated successfully." |
| C8 | Read-only fields not editable | No input for email, role, department |
| C9 | No edit button when unauthenticated | Empty state only (existing test extended) |
| C10 | Existing view-mode tests still pass | Avatar, details, no placeholder text |

### Test setup notes

- Reuse `InMemoryAuthStorage` pattern from existing specs
- Stub `localStorage` via `vi.stubGlobal` (already in profile.service.spec.ts)
- Provide `PLATFORM_ID: 'browser'` for UserService persistence
- Import `ReactiveFormsModule` in ProfileComponent test bed after form added

---

## 9. Acceptance Criteria Summary

- [ ] `UpdateProfileInput` and `ProfileMutationResult` defined in user model
- [ ] `ProfileService.updateProfileForCurrentUser` implements algorithm above
- [ ] `/profile` defaults to view mode; edit mode toggles in place
- [ ] Users can edit firstName, lastName, phone, address, bio, company
- [ ] Email, role, department, member since remain read-only
- [ ] Validation and error copy match conventions in user form
- [ ] Successful save persists to localStorage via UserService and records activity
- [ ] Fallback profiles (`id: 'auth-user'`) are promoted to real user records on first save
- [ ] All test cases S1–S7 and C1–C10 pass
- [ ] No SSR hydration regressions (view mode only on initial render)
