# Client architecture

The React application lives in `client/src/`. The entry sequence is `main.tsx` → `App.tsx` → `pages/WorkspacePage.tsx`. `WorkspacePage` combines the library and curriculum features with the application shell, browser navigation, connection status, and theme preference.

Vite's root remains `client/`, and `client/index.html` loads `/src/main.tsx`. Public assets remain in `client/public/`. In particular, `public/theme.js` applies the saved or system theme before React renders; the theme hook maintains it after startup. Production assets still build to `dist/client/`, served by the existing Fastify server.

## Shared application code

| Location under `client/src/` | Responsibility |
| --- | --- |
| `components/layout/` | `AppShell`, sidebar, topbar, about dialog, and page footer |
| `components/ui/` | Reusable buttons, fields, badges, icons, and empty states |
| `hooks/` | Shared resource loading, theme state, browser navigation, mobile navigation, and entrance animation |
| `utils/` | General navigation and class-name helpers |
| `pages/` | Application-level composition of feature entry points |
| `types/` | Client-wide types such as navigation destinations and filters |
| `tests/` | Shared navigation, UI, and architecture checks |
| `styles/` | Design tokens, reusable UI styles, layout rules, and shared helpers |

`AppShell` owns the persistent workspace and its interactions: the mobile drawer, focus trap, native about dialog, page footer, and layout. It receives the feature navigation through a render prop and page content through `children`. It does not fetch the library or inspect curriculum data. Route changes can move focus, while changes to the search query leave focus in the search field.

The old root `library/` UI package has moved to `components/ui/`. Its public `index.ts` exports the reusable primitives and icons. The design system lives in `styles/design-system.css`; `layout.css` holds the workspace layout, and `global.css` holds helpers used by more than one feature.

## Feature modules

`modules/library/` owns subject navigation, library loading, filtering, topic cards, and the library page. `modules/curriculum/` owns curriculum loading, the unit overview, module reader, section navigation, content blocks, and further-reading links.

Each feature groups the code that changes with that feature:

| Feature location | Responsibility |
| --- | --- |
| `components/` | Pieces of the feature interface |
| `pages/` | Feature pages and larger view composition |
| `hooks/` | Feature-specific data and behavior |
| `utils/` | Pure selection, validation, navigation, and formatting logic |
| `tests/` | Tests for those behaviors and components |
| `types.ts` or `types/` | Feature-specific props and client models |
| `styles/` | Feature styles, loaded through the public entry |
| `index.ts` | The small public API used outside the feature |

The library entry exports its page, navigation component, loading hook, and public prop types. The curriculum entry exports its page and public props. Components such as a code block or a topic card remain internal unless another consumer needs them.

## Import boundaries

- Global pages compose features through their public entries, such as `../modules/library` and `../modules/curriculum`.
- Code within a feature can import its own implementation files directly. Imports from another feature must use that feature's public `index.ts`, rather than reaching into its components, hooks, or utilities.
- Shared components, hooks, and utilities must not import feature modules. Features depend on this shared code; the application page supplies any feature-specific data or callbacks to the shell.
- API contracts used by both browser and server remain in the repository's root `shared/` directory. Feature prop types belong to the feature; general client-only types belong in `client/src/types/`.

The client architecture test checks these import boundaries. Keeping them explicit lets a feature change its internal files without requiring changes across the application.

## Adding another feature

Create `modules/<feature>/` when a new area has its own behavior. Give it a public `index.ts` and the page or components needed for that behavior, then compose its exports from an application page. Add hooks, utilities, types, styles, and tests as their responsibilities emerge; do not create empty folders or placeholder layers just to copy the directory structure.

Keep feature-only logic inside the feature. Move a helper into shared code when it serves multiple features and can work without importing either one. Export only what callers need, and keep tests for private behavior beside the feature that owns it.

## Validation

| Command | Scope |
| --- | --- |
| `npm test` | All client and server tests |
| `npm run test:client` | Shared client tests and tests inside feature modules |
| `npm run test:server` | Server, database, and content tests |
| `npm run typecheck` | TypeScript checks |
| `npm run build` | Type checks, curriculum validation, and production output |

`scripts/test.mjs` discovers `.test.ts` and `.test.tsx` files recursively and runs them with Node's test runner and the existing `tsx` runtime. The refactor adds no dependencies. Pure utilities and rendered output can be checked in these tests; use the browser to verify keyboard navigation, native dialogs, responsive layouts, and both themes after interaction or styling changes.
