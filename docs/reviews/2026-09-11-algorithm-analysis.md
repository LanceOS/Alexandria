# Algorithm Analysis unit expansion — 2026-09-11

Starting from commit `c80479a`, this release develops one existing subunit: **Data Structures and Algorithms → Algorithm Analysis**. It now contains six connected modules, 18 lesson sections, 36 explained practice prompts, and eight complete C++20 programs. The [release manifest](2026-09-11-algorithm-analysis-manifest.json) records content hashes, publication identities, and counts.

## Teaching progression

| Module | What the learner develops |
| --- | --- |
| Count the work in a search | A membership contract, named operation counts, contrasting cases, and preparation costs. |
| Prove a loop correct | A first-match contract, a preserved prefix invariant, justified returns, and a decreasing termination measure. |
| Describe growth with bounds | Best/worst/expected functions, fixed-constant upper/lower/tight bounds, triangular sums, and integer halving. |
| Build and verify binary search | A first-not-less-than boundary, duplicate policy, safe midpoint, interval proof, exact custom comparison bound, and oracle checks. |
| Analyze insertion sort | Sorted-prefix and saved-key reasoning, stability, comparisons versus shifts, and input-sensitive growth. |
| Explain merge sort with a recurrence | Stable merging, odd-length traces, buffer/stack accounting, recurrence levels and leaves, and a preparation/query/update capstone. |

Each section contains two practice prompts with explanations. Programs have fixed inputs and a following expected-output block; their existing editor lets learners modify them and sign in to execute them in the C++ sandbox. Reflections remain self-guided rather than automatically graded. The sequence introduces its mathematical notation and explains unfamiliar C++ syntax adjacent to its first use.

The [source ledger](../research/algorithm-analysis.md) records passages actually inspected in *Introduction to Algorithms*, fourth edition, and *The C++ Programming Language*, fourth edition, alongside NIST references and the identified C++20 draft N4861. The reflowed algorithm book uses chapter/section citations rather than invented print-page conversions. The explanations, implementations, and teaching examples are independently written applications of established algorithms and proof methods, whose foundations are attributed to the sources. Source books and extracts stay outside the repository. A subsequent [source-comparison review](2026-09-11-algorithm-analysis-originality.md) checks prose, examples, programs, and exercises before committing this release.

## Review findings applied

Independent review checked the lesson sequence, algorithm contracts, proofs, cost models, arithmetic, C++ interfaces, and source support. Corrections before publication included:

- Explicit initializer-list headers and explanations of range-for, aggregate results, iterator distances, casts, and postfix indexing.
- A definition of floor/ceil and a derivation of the halving count for arbitrary positive integers, including its tight logarithmic bound.
- Positive-domain assumptions for multivariable costs, with query-loop overhead retained when inputs may be empty.
- Constant setup work in the empty binary-search cost expression; zero comparisons do not mean zero full work.
- Distinct, adequately sized merge-buffer preconditions and explicit counter-overflow limits for instrumented examples.
- Wording that distinguishes a comparison leading to a shift from the Boolean result of the displayed stopping test.
- Final newlines in two expected-output blocks, found by byte-for-byte execution checking.

Older textbook statements were checked against the relevant C++20 draft rather than carried forward uncritically. The ledger identifies those passage-specific findings. This is internal technical and teaching review, not external academic peer review or a measured learning-outcome study.

## Verification

- **Application suite:** `npm test` passed 163 tests, with the opt-in container-isolation suite skipped. The run used the subprocess access required by existing operator-command tests. No application or runner implementation changed in this release.
- **Production build:** `npm run build` passed TypeScript checks, complete catalog validation, client/server compilation, and packaging. After final content-only wording/output corrections, topic validation and content packaging passed again.
- **Authored examples:** the complete catalog run passed 52 programs and found only the two final-newline mismatches above. After correction, all eight Algorithm Analysis programs passed the focused run. Together these verify all 54 current C++ programs with GCC 16.2.1 and `-std=c++20 -Wall -Wextra -Werror -pedantic-errors -pthread`, including exact stdout and empty stderr.
- **Application sandbox:** all eight new unit programs also ran through `createCodeRunner` using the installed rootless `localhost/alexandria-cpp-runner:1` image. Every run succeeded with exact expected stdout, empty stderr, and no compiler diagnostics. This exercised the same execution service used by the application; it was separate from the opt-in adversarial isolation suite.
- **Independent finite checks:** first-match search passed 5,465 generated oracle comparisons and input-preservation checks. Binary boundary search passed 9,009 searches over 1,287 sorted vectors, including invariant/progress checks, membership, comparison-bound attainment, and 16 extreme midpoint arithmetic cases. Insertion and merge sort each passed 9,841 small-array checks; these covered inversion/shift counts, record preservation, stability, and odd-length merge writes. Sorted/reverse insertion formulas were also checked for sizes 0–128.
- **Mathematical examples:** count traces, fixed-constant inequalities, integer-halving counts, the exact toy recurrence, and workload crossovers were independently calculated. Sorting becomes cheaper at 24 queries in the static hypothetical model, 25 when preserving order adds a copy, and 39 with ten modeled replacements. These are explicit accounting examples, not benchmarks.
- **Execution limits:** optional sanitizer harnesses could not link against the host's missing sanitizer runtime libraries. No sanitizer result is claimed. Finite tests support implementation checks; the written invariants and recurrence reasoning establish the general arguments.

## Local publication and reader verification

The import was first rehearsed on a temporary copy of the live database. It added five modules and six versions, revised one existing module, preserved all 2,271 pre-existing rows, and passed SQLite integrity and foreign-key checks. An immediate rerun added or revised nothing.

For the actual release, the verified API child process was stopped gracefully while its development watcher and Vite process remained available. The official importer created a verified backup at:

`/home/lance/.local/share/alexandria-backups/alexandria-2026-09-11T19-39-02-541Z-10c84e52`

It published version 3 of `dsa_count_search_work_module`, preserving its module/part identities and earlier releases, plus five new version-one modules in the same subunit. No topic, unit, migration, or unrelated module definition changed. Full-row SHA-256 comparisons against the import backup confirmed that all **2,271 prior rows across 25 tables** remained intact. The database passed integrity and foreign-key checks. This instance had no learner records to migrate; application tests separately cover version-linked completion preservation.

The catalog now has **25 topics, 91 unit records, 94 modules, and 282 stable lesson parts**. The new release added 13 bibliography records and 15 version-to-source citations. All seven latest modules in the Data Structures and Algorithms topic, all 21 parts, objectives, and complete stored bibliographic fields match the authored files. The running reader API independently returned matching public content and citations for those same seven modules, including the unchanged queue lesson.

The watcher restarted successfully, and `/health/ready` returned ready. Browser review followed the actual next-section and next-module links through all 18 sections, ending at the return-to-learning-path link for Algorithm Analysis. It also checked the six-module outline, first-lesson objectives, reflection reveal at the beginning and capstone, the populated editable C++ area, and visible book references. Desktop screenshots were inspected in dark and light themes; a narrow viewport showed no page/content horizontal overflow. No account was created or learner completion recorded during these checks.

The unit teaches a coherent introductory analysis method. Advanced recurrence methods, amortized analysis, hashing, balanced trees, external-memory models, and empirical benchmarking remain outside this release.
