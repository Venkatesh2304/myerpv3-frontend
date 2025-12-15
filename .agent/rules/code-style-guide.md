---
trigger: always_on
---

# ERP Billing Refine – Engineering Principles

Purpose
- Provide clear, reusable guidelines for building a clean, modern ERP with Refine, Shadcn, Tailwind, and a Django REST Framework backend.
- Keep the codebase consistent, modular, and fast to iterate.

Stack and Scope
- Frontend: Refine (React meta-framework), Shadcn UI, Tailwind CSS.
- Backend: Django REST Framework (separate project).
- UI Libraries:
  - Prefer Refine-wrapped Shadcn components for CRUD flows (see src/components/refine-ui).
  - Use raw Shadcn components in src/components/ui for generic UI (buttons, alerts, cards, etc.).

Project Structure (suggested)
- src/components/ui: Raw Shadcn components and small composables.
- src/components/refine-ui: Refine-aware components that wrap CRUD logic.
- src/pages/resources: Resource-based pages aligned with Refine resources (list, create, edit, show).
- src/lib: Utilities (api, formatters, constants).
- src/hooks: Reusable hooks (form helpers, permissions, polling).
- src/providers: App-level providers (Refine, Theme, Auth).
- src/types: Shared TypeScript types/interfaces.
- src/styles: Tailwind setup and tokens.
- src/example_pages : They are setup of example pages of a simple blog post refine app .
  
General Principles
- Reuse first: Prefer Refine and Shadcn components before custom code.
- Composition over inheritance: Build small, composable pieces.
- Type safety: Strict TypeScript types for DTOs, forms, and API responses.
- Accessibility: Keyboard, ARIA, color contrast, focus management.
- Performance: Ship only what’s needed; measure; optimize where it matters.
- Consistency: Same patterns for similar pages (CRUD pages should feel identical).
- Minimalism: Clear hierarchy, good spacing, few colors, no visual noise.
- Documentation-in-code: Short, local comments; self-explanatory names.

Refine Usage
- Resources: Define all CRUD endpoints as Refine resources. Keep resource names consistent with DRF endpoints.
- Data hooks: useList/useShow/useCreate/useUpdate/useDelete. Avoid duplicating server data in local state.
- Forms: use a Refine form hook (e.g., useForm) + react-hook-form underneath. Render with Shadcn form controls.
- Routing/Layout: Use the Refine router and a shared layout wrapper. Keep page-level state minimal.
- Caching/Invalidation: Let Refine (React Query) own data caching. Invalidate queries after mutations. Prefer optimistic updates where safe.
- Error/Loading: Use Refine’s error and loading states; render graceful placeholders.

Shadcn + Tailwind
- Tokens: Centralize radii, spacing, font sizes, and colors via Tailwind config.
- Components: Use Shadcn components as-is; avoid re-implementing primitives.
- Variants: Implement variants with class-variance-authority (cva) where needed.
- Theme: Support light/dark. Avoid hardcoded colors; use design tokens/utilities.

CRUD Patterns
- List views: Table with pagination, sort, and filter. Empty states, skeletons, and bulk actions when appropriate.
- Show view: Compact, scannable layout; highlight primary fields; provide inline actions.
- Create/Edit: Single-column simple forms; multi-step only when required; clear validation and inline errors.
- Delete: Confirm dialog with explicit consequences; support undo where feasible (soft delete, optimistic UI).

DRF Integration
- Data provider: Map DRF pagination to Refine (typically count and results). Normalize filters/sorting to DRF query params.
- Validation: Surface DRF validation errors to the form fields (field-level messages).
- Auth: Keep tokens/cookies in a secure store; avoid exposing secrets in client code.

Error Handling and UX
- Loading: Use skeletons/spinners sized to content. Avoid layout shift.
- Empty states: Show helpful guidance and a primary next action.
- Inline feedback: Toasts for success/failure; inline field errors for forms.
- Retry: Provide retry on network failures where safe.

Accessibility
- Keyboard: All interactive elements focusable and operable via keyboard.
- Labels: Inputs have labels and descriptions. Associate error text to fields.
- Focus: Manage focus on dialogs and route changes; return focus when closing.
- Contrast: Meet WCAG AA for text and interactive elements.

Performance
- Data: Paginate lists, avoid N+1 requests, debounce filters/search.
- Rendering: Memoize heavy components; virtualize large tables if needed.
- Bundles: Code split routes; lazy load rarely used pages.
- Images/Icons: Use optimized assets and tree-shake icon sets.

DX and Conventions
- Naming: PascalCase components, camelCase variables, snake_case only for backend DTO mapping.
- Imports: Absolute imports from src/.
- Lint/Format: ESLint + Prettier; CI should block on errors.

PR Checklist (short)
- [ ] Uses Refine/Shadcn before custom components.
- [ ] Types added/updated; no any escapes.
- [ ] Loading, empty, and error states covered.
- [ ] A11y basics: labels, focus, keyboard.
- [ ] No console logs; lint passes.

Additional Principles Added
- Progressive disclosure: Show only what’s necessary; reveal advanced options as needed.
- Observability: Log key client events and errors (non-PII) to aid debugging.
- Internationalization-ready: Avoid concatenating strings; prepare for i18n if required.
- Resilience: Fail gracefully; prefer idempotent actions and safe retries.

References
- Refine docs: https://refine.dev/docs
- Shadcn UI: https://ui.shadcn.com/

Notes
- Check llms.txt for a compact map of available Shadcn components and MCP details in .vscode/mcp.json.
- Prefer wrappers in src/components/refine-ui for CRUD flows; fall back to src/components/ui primitives where needed.