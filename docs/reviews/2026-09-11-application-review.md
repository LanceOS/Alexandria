# Application implementation review — 2026-09-11

Reviewed the current account, reading-progress, XP, weekly-goal, milestone, reader-navigation, and practice implementations, along with their authentication, database, content, and deployment boundaries. The concrete findings below were fixed. No additional blocking functional defects were found in this review's scope.

## Findings and corrections

| Finding | Correction and verification |
| --- | --- |
| A second tab could switch the shared session cookie between the first tab's session lookup and progress request, displaying the new account's progress under the previous name. | Progress reads now require the matching session CSRF token. The client sends it, invalidates state across tabs, refreshes on focus, and rejects superseded responses. Full-app tests reject mismatched cookie/token pairs; browser checks confirmed cross-tab sign-out and account switching. |
| Superseded requests continued until timeout, and reader continuation mutated a ref during rendering without including the content version in its identity. | Requests support caller cancellation and abort when superseded or unmounted. Reader continuation uses state/effects keyed by route and content version. Tests cover cancellation and response-body timeouts; browser checks confirmed that marking a section read preserves the current section and Back returns to the overview. |
| Canceled weekly-goal drafts could survive cancellation or account changes. | Editing begins with the saved value, cancellation restores it, and account changes reset the draft. Ordinary focus refreshes preserve an active edit. Browser checks covered each transition. |
| Practice validation accepted choices that render identically, despite grading them by different array indices. | Validation now rejects duplicate visible choices, non-object entries, unsupported fields, and invalid/bounded identifiers. Malformed-data regression tests pass. |
| Reading optional practice JSON during application startup coupled the entire library's availability to that asset. | Practice loads on demand, caches successful loads, and permits retry after a failed load. Tests confirm that damaged practice data does not block library startup, repairs recover, and stale lesson versions do not receive mismatched quests. |
| Keyboard focus could be lost when checking an answer or retrying, and a collapsed completed quest lacked an accessible completion label. | Submission focuses feedback; Tab reaches retry; retry focuses the first answer. Completed summaries include a text label. Browser checks verified focus transitions and preservation of collapsed disclosures. |

## Verification

- `npm test`: **142 tests passed**, including new full-application security and persistence tests.
- `npm run build`: passed TypeScript checks, full curriculum validation, and production client/server packaging.
- `npm run content:test-examples`: **46 C++20 lesson examples** compiled with warnings treated as errors and matched their expected output.
- All **10 practice answers** were checked against compiled C++20 examples, including prompted fixes and fragments.
- Live API checks: readiness returned 200; **25 topics, all 89 modules, and all 10 practice quests** were served successfully.
- Live database read-only checks: `quick_check` returned `ok`; `foreign_key_check` returned no errors; all six expected migrations were applied.
- Browser checks used isolated temporary accounts: sign-in, saved sections and XP, goal cancellation, cross-tab sign-out/account switching, continuation, Back navigation, and keyboard practice interactions.
- Full-app tests cover request origin, request marker, CSRF and account isolation, encoded API paths, restart persistence, duplicate-save XP stability, and logout revocation. Existing version-history and timezone/DST tests remain passing.
- `git diff --check`: passed.

The running installation remained available after the fixes. Interactive tests did not write to its learner records. The production bundle was rebuilt; the development server loaded the updated source.

## Verification limit

`npm audit` was attempted twice, but the registry's security-advisory endpoint reset the connection (`ECONNRESET`). Dependency vulnerability status therefore remains unverified. No dependency versions were changed based on incomplete advisory information.

Practice remains an optional self-check with visit-local feedback. Reading completion and activity milestones do not claim assessed mastery.


## C++ code area follow-up

Added lazy C++20 editors beside lesson/practice examples and starter scratchpads in C++ sections without code. The local rootless Podman image is installed and pinned to the reviewed GCC toolchain. Compilation and execution are isolated from application storage with bounded resources and no network. Runs do not write learner evidence or award XP. See [Code area and runner](../code-runner.md).

Validation covered 163 application/unit tests, eight real-container checks, and the production build. Browser checks covered anonymous editing through sign-in, stdin/output, compilation errors, timeout feedback, stopping, draft cleanup on sign-out, keyboard tab navigation, mobile sizing, and both themes. A browser-only form-default-action defect was corrected: stopping now prevents the click from submitting a second run when React changes the button back to Run. The correction was rechecked interactively.

The existing application reports healthy readiness and available execution. The temporary test containers were removed; no database migration was needed for the code area.
