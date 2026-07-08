# Dormi — Design System

Derived from `src/app/globals.css` and shared components. Do not introduce new colors outside tokens.

## Color strategy

Restrained: tinted neutrals (gray scale) + emerald primary ≤10% surface.

| Token | Value | Use |
|-------|-------|-----|
| `--primary` | `#059669` | Primary actions, links, focus ring |
| `--primary-hover` | `#047857` | Hover on primary |
| `--primary-light` | `#d1fae5` | Subtle highlights, empty-state icon bg |
| `--primary-tint` | `#ecfdf5` | Accent backgrounds |
| `--destructive` | `#ef4444` | Delete, destructive confirm |
| `--success` / `--warning` / `--info` | semantic | Status only |

Body: white / gray-50. Sidebar: white with gray-200 border.

## Typography

- Font: Geist Sans (`--font-geist-sans`)
- Page title: `PageHeader` — `text-xl sm:text-2xl font-semibold`
- Section: `text-base font-semibold`
- Body: `text-sm`; muted: `text-sm text-gray-600` (not gray-500 on gray-50 for body copy)
- **No** arbitrary pixel sizes (`text-[11px]`) in auth or forms — use `text-xs` / `text-sm`

## Layout

- Dashboard max width: `max-w-7xl` in shell main
- Spacing rhythm: `space-y-6` between page sections
- Cards: use for bounded entities only; not every text block
- **Card hover:** border OR subtle shadow — not both as decoration

## Required components

| Pattern | Component | Rule |
|---------|-----------|------|
| List page header | `PageHeader` | title + description + actions |
| Tables | `DataTable` | loading skeleton, `EmptyState` when empty |
| Empty lists | `EmptyState` | icon + title + description + optional CTA link |
| Filters | `FilterBar` | search + selects + clear; prefer URL sync |
| Confirm delete | `ConfirmDialog` | destructive variant |
| Status | `StatusBadge` | always include text label |
| Wayfinding | `BreadcrumbBar` | all dashboard routes |

## Auth

- `AuthLayout`: centered card, flat `bg-gray-50`, logo block above card
- No split gradient panels, decorative circles, or tracked uppercase eyebrows

## Motion

150–250ms transitions on hover/focus only. No page-load choreography.

## Accessibility

- Icon-only buttons: use `IconActionButton` with required `label` prop (maps to `aria-label` via i18n)
- Focus: `focus-visible:ring-2 focus-visible:ring-ring`
- Status: never color alone — pair badge color with text

## URL filter sync

List pages with shareable filters use `useFilterParams` (`src/hooks/use-filter-params.ts`):

- Read/write `useSearchParams` via `router.replace` (no scroll)
- Debounce search keys (~300ms) before writing URL
- Omit params that match defaults; `clearAll` resets to defaults
- Golden pages: Invoices, Tenants, Rooms

## i18n

All user-facing strings in `src/messages/messages.json` — codes referenced via `useT("code")`.
