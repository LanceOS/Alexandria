# Curriculum correction release — 2026-09-11

This release applies the findings from the [full curriculum audit](2026-09-11-curriculum-audit.md) of commit `99a387f`. The original audit, finding proposals, and coverage manifest remain unchanged as historical evidence. The [release manifest](2026-09-11-curriculum-correction-releases.json) identifies every revised file, version, changed bibliographic identity, and content hash.

## Applied findings

| Finding | Resolution |
| --- | --- |
| CORE-001 | Applied: Qualify variant’s one-alternative description. |
| CORE-002 | Applied: Cite the rule that defines defaulted equality’s result. |
| CORE-003 | Applied: Support the unordered-container comparison with its own requirements. |
| CORE-004 | Applied: Support count_if’s behavior and linear predicate bound. |
| CORE-005 | Applied: Point the exception lesson’s vector citation to swap. |
| CORE-006 | Applied: Limit the ws locator’s no-failbit statement to the relevant condition. |
| CORE-007 | Applied: Add the direct deletion and construction-dispatch contracts. |
| CORE-008 | Applied: Make the Guidelines locators specific and identify editorial roles. |
| CORE-009 | Applied: Link an actual include-guard explanation. |
| CORE-010 | Applied: Name vector<bool> as the contiguity exception. |
| SUP-001 | Applied: Correct the two Cachegrind section locators. |
| SUP-002 | Applied: Group the full denominator in Amdahl’s formula. |
| SUP-003 | Applied: Group the denominator of the rationalized square-root expression. |
| SUP-004 | Applied: Credit both named LLNL tutorial authors. |
| SUP-005 | Applied: Keep reproducible-build comparison bit for bit. |
| SUP-006 | Applied: Replace the mistaken Parnas inspection provenance. |
| SUP-007 | Applied: Add a primary source for generated properties and counterexample shrinking. |
| SUP-008 | Applied: Support the language-lifetime and allocator boundary with matching primary sources. |
| SUP-009 | Applied: Cite authorization guidance for object-level access decisions. |
| SUP-010 | Applied: Do not mark historical journal review status as freshly verified. |
| SUP-011 | Applied: Use the exact CMake usage-requirement headings. |
| SUP-012 | Applied: Demonstrate reassociation without also permuting operands. |
| SUP-013 | Applied: Make array-base alignment explicit in the traffic model. |
| SUP-014 | Applied: Distinguish valid requests from requests with enough capacity. |
| SUP-015 | Applied: Record the accessible accepted benchmarking manuscript. |
| APP-001 | Applied: A stable public scene operation does not automatically repair internal node paths. |
| APP-002 | Applied: No direct edge does not imply independent graph nodes. |
| APP-O01 | Clarified device-side reuse versus host recycling and destruction in the Vulkan trace. |
| APP-O02 | Added verified USENIX publication metadata and recorded the ATC 2014 and OSDI 2016 review-policy evidence. |
| BAS-R01 | Pinned all 27 Basics standards references to 25 individually checked N4861 sections; corrected the edition-specific assignment and auto locators. |
| BAS-L01 | Marked all seven book references as further reading, retained verified metadata/section identities, and removed unverified page claims. |

## Release and evidence boundaries

- 36 of 89 modules receive version 2; stable topic, unit, module, and lesson-part identities are unchanged. Each module retains three lesson parts and the shared reader layout.
- The latest catalog contains 241 citation records, including 13 added direct references. Corrections to 31 bibliographic records receive new source IDs; locator-only changes reuse their source identity in the new release.
- The importer publishes revisions through the existing immutable-release schema. It accepts the next sequential release for an installed module, allows a fresh database to start at the current selected version, and makes no curriculum writes for an exact latest-version rerun. It rejects conflicting, skipped, and older releases. No schema migration or historical-record rewrite is required.
- The current research ledgers record the corrected source support and inspection provenance. The Parnas citation now identifies the original 1972 paper rather than the unrelated retrospective previously inspected.
- Historical review-policy verification for the Hoare, Parnas, and Goldberg papers remains unresolved. Their learner-facing references now use neutral published-research wording; this does not assert that the papers were unreviewed. The fourth-edition Stroustrup text remains inaccessible for passage/page verification. Its book references are explicitly further reading; the taught language rules were independently checked in N4861.

## Validation and installation

- Independent verification matched every structured proposal: 27 findings, 30 replacement pointers, 3 deliberate unchanged-evidence checks, and 13 added reference objects. All 36 manifest hashes and version mappings match the final files; all 89 stable module IDs and 267 stable part IDs match the baseline.
- `npm test`: **113 passed**, including revision publication, exact reruns, historical content and learner-completion preservation, fresh version-2 installation, collision rejection, and atomic rollback. The full suite used normal subprocess access for its existing account-command test.
- `npm run build`: passed TypeScript, catalog validation, client build, server compilation, and content packaging. `git diff --check` passed.
- `npm run content:test-examples`: **46 passed** with GCC 16.2.1 and `-std=c++20 -Wall -Wextra -Werror -pedantic-errors -pthread`; every program produced its expected output.
- The local `content:import -- --all` published **36 revisions**, adding no stable module identities. It created verified backup `alexandria-2026-09-11T16-51-46-773Z-37a0b5c3` in the configured backup directory.
- Post-import comparison preserved **all 1,321 pre-existing rows across all 24 database tables**, including the original 89 published releases and every existing learner/account record. The database now holds 125 releases and 272 bibliographic records, retaining old bibliography alongside the current 241 citation records. SQLite integrity and foreign-key checks passed.
- All 89 latest database lesson definitions, objectives, parts, source metadata, and locators match the authored files. The running app's public reader API served version 2 with matching reference URLs and locators for all 36 corrected modules. No presentation code changed.

These checks confirm the applied corrections, executable examples, and publication behavior. They do not close the specifically disclosed historical review-policy and inaccessible-book evidence limits above.
