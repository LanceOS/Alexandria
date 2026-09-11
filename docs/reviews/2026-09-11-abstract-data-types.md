# Abstract Data Types unit expansion — 2026-09-11

Starting from commit `baf830a`, this release develops the existing **Data Structures and Algorithms → Abstract Data Types** subunit into six connected modules, 18 sections, 36 explained practice prompts, and six runnable C++20 programs. The [manifest](2026-09-11-abstract-data-types-manifest.json) records exact content hashes and identities; the [source ledger](../research/abstract-data-types.md) records the actual book, draft, and paper passages inspected.

## Teaching and publication scope

| Module | Release | Main teaching outcome |
| --- | --- | --- |
| Design a bounded queue from its contract | Existing module, version 3 | Specify FIFO and failure behavior; derive and implement an overflow-safe count-based ring |
| Model a stack and undo | New, version 1 | Restore predecessor snapshots with an explicit bounded-history policy |
| Explain dynamic array growth | New, version 1 | Separate live size from capacity; derive aggregate growth cost and explain allocation/invalidation boundaries |
| Reason about linked storage | New, version 1 | Preserve ownership, reachability, count, and endpoints across node operations |
| Build a queue from two stacks | New, version 1 | Prove FIFO across reversal, protect fallible transfers, and distinguish aggregate from single-call cost |
| Verify a collection contract | New, version 1 | Compare results and full logical state with a model; relate representation to workload |

Every part advances the tutorial and includes two explained reflections. The examples include duplicate values, empty/full cases, no-op versus rejection, wraparound, allocation failure, ownership, and changed workload assumptions where appropriate. Reflections remain ungraded reveals, not mastery assessments. The final model checker repeats the first lesson's original ring code so each listing remains complete and editable independently.

The opening module preserves its module discovery metadata and three stable part IDs, advancing `dsa_design_a_bounded_queue_v2` to `dsa_design_a_bounded_queue_v3`. Five modules are appended within the same subunit. No application behavior, dependencies, migrations, or other topic lessons were changed. Source IDs were retained only for unchanged bibliographic identities; references added by this unit use new module-specific IDs.

## Independent review and applied findings

Authors reviewed source passages, examples, and assumptions; a second reviewer examined each of the six modules. The review covered conceptual development, traces, calculations, C++ lifetime and exception guarantees, scope, attribution, and plausible copied expression. Applied findings were:

- **Two-stack queue assignment:** implicit assignment could replace one vector before allocation for the second failed, leaving a mixed logical queue. The example now explicitly defaults empty construction and deletes whole-object copy/move operations. The prose makes that interface boundary clear. All affected targeted checks were rerun on the final operation code; temporary test fixtures clone their exposed test state instead of relying on the deleted public copy operation.
- **Syntax bridges:** explained optional presence independently of a contained integer's truth value, guarded dereference, pointer member access, nullptr, auto deduction versus ownership, and the simulator's static constexpr limit.
- **Selected write model:** explicitly excluded earlier storage zero-initialization, output assignments, and bookkeeping from the packed-array/ring comparison. Removed an overbroad constant-bookkeeping statement because the packed-array shift loop has linear loop-control work too.
- **Source/version boundaries:** checked vector capacity against N4861 rather than the misleading historical book parenthetical; used C++20 make_unique despite the book's C++11 baseline. Attributed the classic linked and two-stack queue constructions explicitly, and identified the QuickCheck reading as an author manuscript rather than the final published layout.

## Verification

- **Application:** `npm test` passed **163 tests**, with the existing optional real-container isolation suite skipped. That skip is separate from the authored-program sandbox checks below. The suite used normal local subprocess access.
- **Build:** `npm run build` passed TypeScript, whole-catalog validation, client production build, server compilation, and content packaging. After the final prose-only clarification, whole-catalog validation and content packaging passed again.
- **Examples:** all **60 current C++20 programs** compiled warning-clean and matched exact stdout with GCC 16.2.1 and `-std=c++20 -Wall -Wextra -Werror -pedantic-errors -pthread`. The final two-stack example was separately recompiled after its interface fix. Each new program has exactly one following expected-output block with a final newline.
- **Application sandbox:** all **six unit programs** completed through the actual code-runner service and installed `localhost/alexandria-cpp-runner:1` image (GCC 15.3), with exact stdout, empty stderr and compile output, and exit status zero. These are authored-example execution checks, not a fresh exhaustive isolation audit.
- **Ring and capstone:** the displayed capstone checked 10,922 histories (four commands, lengths 0–6, capacities 1 and 3). Independent checking covered 97,655 histories / 561,525 operations at capacities 1, 2, 3, 4, and 7 with negative values and integer extrema, plus 5,000 long drain/refill cycles. Zero capacity was compile-rejected. The capstone detected five safe injected faults: overwrite-before-rejection, changed failure output, wrong wrap, stalled head, and dropped duplicates.
- **Undo:** a separate vector-history oracle checked 820 reachable logical states and 12,300 transitions. It covered every valid position, invalid boundary/extreme values, no-op/full priority, and undo. Draining a copy after every transition compared all hidden snapshots, not just current position and depth.
- **Growth:** checked all 25 simulator states and 1,000 unchanged rejected calls, plus the independent geometric formula over 10,000 mathematical prefixes and the worked totals 35, 44, and 70.
- **Linked queue:** 87,381 histories / 669,924 operations agreed with a deque model; 64 allocation failures preserved state, 65 destruction cases and full rejection were checked, and tracked node allocations/releases matched at 339,154 each. Five symbolic graph diagnostics were checked without dereferencing invalid pointers.
- **Two-stack queue:** the final operation code passed 349,525 finite prefixes, 257 burst/repeated-front scenarios, 128 failed-transfer retries, and 65 failed enqueues. Controlled allocation allowed one successful reservation and then prohibited further allocation during transfer. Compile-time traits confirmed all four whole-object copy/move operations are unavailable.

Temporary oracles and fault-injection fixtures are authoring checks outside the application and repository. Finite testing does not prove every capacity, payload, allocator, platform, or schedule; the lessons separately give invariants and identify their sequential integer models. No additional language standard or compiler result is claimed.

## Source comparison and originality

The source ledger identifies precisely what was read. Manual comparison included relevant source prose, code, diagrams, worked cases, and adjacent exercises in CLRS and Stroustrup, the pinned C++20 draft clauses, and the QuickCheck manuscript's queue/model-testing passages. No distinctive copied paragraph, listing, figure, dataset, exercise, or answer key was found within that scope. Established algorithms and proof/testing methods are credited; independently written teaching does not imply their invention.

Specific distinctions matter beyond changing numbers. The ring uses count and a no-overflow mapping rather than the book's reserved-slot pseudocode. Undo teaches a newly specified snapshot editor and failure priority. The growth program simulates a cost model instead of reproducing TABLE-INSERT. The linked example develops exclusive ownership and iterative cleanup. The two-stack example explains temporary transfer state and reserve-before-mutation. The capstone uses bounded exhaustive C++ histories, preserved failure outputs, and copy-and-drain observation rather than the paper's Haskell random generator and algebraic equations.

An auxiliary direct-wording scan compared **268 authored prose/title/objective/caption fields, 13,716 normalized tokens**, with the two complete local book extracts: **466,841 tokens / 1,677 PDF pages** for CLRS and **462,334 tokens / 1,366 PDF pages** for Stroustrup. Normalization used Unicode NFKC, case folding, punctuation-insensitive word tokens, and joined line-end hyphenation; matching runs began at six tokens. The longest match was **six generic words**, in a common introductory phrase and standard worst-case cost wording. Inspection found no copying issue in those matches. Code, bibliography, and displayed traces were excluded from that scan and compared manually. PDF text extraction can omit glyphs; rendered pages supplemented relevant mathematical and paper passages.

This is a documented comparison of inspected sources, not an exhaustive plagiarism guarantee across all publications. No private book, page image, source extract, or local book path was added to curriculum files or documentation.

## Local publication and reader review

A rehearsal on a temporary SQLite clone added five modules and six versions, revised one module, preserved all 2,343 existing rows, passed integrity/foreign-key checks, and made zero curriculum changes on an exact rerun.

The real API child was stopped gracefully for the official `content:import -- data-structures-algorithms` command and its watcher restarted afterward. The importer created a verified backup named `alexandria-2026-09-11T20-13-17-546Z-0f7462b4`. SHA-256 row comparisons against that backup confirmed that **all 2,343 pre-existing rows across every table remained unchanged**, including content versions and learner data. Integrity and foreign-key checks passed. The catalog now contains **25 topics, 91 unit records, 99 modules, and 297 stable lesson parts**.

All 12 current Data Structures and Algorithms modules, 36 parts, objectives, and complete stored source metadata match the authored definitions. The running reader API independently returned matching releases, lesson content, and public citations for all 12. `/health/ready` reported ready.

Browser review opened the six-module subunit, inspected the first lesson's objectives and prerequisites, revealed feedback and references, and followed every next-section/next-module link through all 18 sections. The final return link reopened the correct learning path. The capstone's Edit and run control populated the complete 3,650-character program in the editable area. Screenshots showed the code editor in dark theme and concluding prose in light theme; dark theme was restored. No account was created or learner completion recorded. This release changes content rather than responsive styling; no new narrow-viewport result is claimed.

The opening lesson is left available in the local browser for review. This task publishes locally; it does not include a new Git commit or push.
