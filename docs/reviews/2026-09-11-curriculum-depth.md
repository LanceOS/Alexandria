# Curriculum depth expansion — 2026-09-11

Baseline: `bf3f048`, the previously reviewed correction release. This expansion covers **all 89 modules across 25 topics**, retaining the 91 unit records, 267 stable lesson-part identities, and the shared three-part reader. It implements the user's requirement that efficient learning come from organization while each module still teaches its objectives in depth.

## Teaching changes

Every module now develops its conceptual model and assumptions, walks through the original example step by step, works through a contrasting or boundary case, and provides explained practice and a recap. The additional material is distributed across the existing parts. Topics include control-flow state traces, ownership and invalidation, concurrency ordering, numerical reasoning, API contracts, domain boundaries, failure cases, and transfer to changed inputs.

Each part contains a meaningful practice checkpoint after the required teaching. The original final reflections are retained; new checkpoints ask learners to predict, derive, compare, debug, or apply an idea and explain the answer. The current reader reveals these solutions without grading or persisting attempts. The lessons retain all 46 complete C++20 programs, their expected outputs, and the original application and supporting-subject traces.

The standing [curriculum depth and teaching standard](../../notes/curriculum-depth.md) applies to every current and future unit, subunit and module. It is linked from module planning, content authoring, the curriculum map, the evidence policy and the project README. It requires detailed teaching, two worked cases, meaningful practice with explanations, explicit assumptions and limitations, source review, and preserved publication history. Word counts and reading times are not acceptance criteria.

The [release manifest](2026-09-11-depth-release.json) records every changed module, prior/new release identities, file hashes, per-part prose and checkpoint counts, and source additions. Its counting method excludes code, lists, headings, objectives and citations; counts indicate scope rather than educational effectiveness.

The final catalog contains 100,620 explanatory words by that method, up from 36,055, and **269 explained practice checkpoints** across all 267 parts. All 241 existing lesson bibliography records remain, with **23 focused references added** and two existing source locators extended. These figures describe the authored scope; the per-module ledgers provide the substantive teaching and evidence review.

## Evidence and independent review

Four authoring ledgers record topic-specific teaching changes, inspected documentation and research, calculations, and limitations:

- [C++ Basics and advanced modules: 19 modules](2026-09-11-depth-cpp-basics-advanced.md)
- [Core C++: 22 modules](2026-09-11-depth-cpp-core.md)
- [Supporting computing subjects: 22 modules](2026-09-11-depth-supporting.md)
- [Application subjects: 26 modules](2026-09-11-depth-applications.md)

Internal reviewers read expansions outside their own authoring scope. C++ additions were checked for type, value, lifetime, ordering and edition assumptions; supporting and application additions were checked for mathematical/state-trace consistency, failure behavior, prerequisites and citation support. Original numerical examples were independently calculated. This is an internal editorial and technical review, not external academic peer review or a study demonstrating learning outcomes.

The review produced the following applied corrections:

| Finding | Applied change |
| --- | --- |
| Pimpl copy wording could imply that an implicit copy of a `unique_ptr` owner performs a bitwise copy. | Explain that `unique_ptr` is noncopyable and the example explicitly deletes copying; copying a raw owning address is a distinct hypothetical design. |
| The cross-runtime ownership lesson overclaimed object-lifetime termination for every vector element invalidated by `erase`. | Explain invalidation and loss of the original element identity, with a focused standards-draft reference. |
| A dropout practice answer assumed a model was in training mode without establishing it in the prompt. | State the initial training mode; keep evaluation behavior separate from gradient recording. |
| Raft client retry material was absent from the cited conference-paper sections. | Add the authors' extended technical report §8 as a separately labeled source. Retain the peer-reviewed conference paper for commitment rules; its §8 is implementation/evaluation, not client interaction. |
| The busy-commit SQLite example needed a more precise source locator. | Include transaction documentation §2.3 for commit/busy behavior. |
| Seventy drafts placed every reflection in the final part. | Move suitable explained checkpoints into earlier parts after their prerequisites, making prompts self-contained where needed. |
| Four Basics drafts still had a part without a checkpoint. | Relocate or refine self-contained practice and add a one-iteration countdown task; confirm a checkpoint in every catalog part. |
| A new parser test case rejected every very long digit sequence despite permitting unlimited leading zeros. | Specify a concrete above-range sequence for defined rejection, and explicitly accept a long zero prefix followed by 1 under the existing contract. |

Primary language claims use the pinned C++20 working draft N4861, with later-edition boundaries labeled explicitly. New documentation references support additional cases, including compiler options, reference collapsing, container construction/invalidation, duration rounding, build generation, grapheme segmentation, GPU comparison rules and independent file opens. Peer-reviewed research supports relevant underlying ideas; official specifications, expert guidance and technical reports retain their distinct classifications.

Existing bibliography records remain intact. The original book-access and historical journal review-policy limitations remain disclosed in the earlier ledgers; no inaccessible book passage is newly represented as inspected. Hypothetical timings and simplified models are labeled. No hardware, GPU, Qt, Python-binding, ML-runtime, network-consensus or real-time execution result is claimed for conceptual application traces. Large specifications were consulted at relevant passages, not exhaustively read end to end.

## Validation and publication

- `npm test`: **113 tests passed**, including shared-reader contracts, whole-catalog installation, revision publication, rollback, stable identities and preservation of version-linked learner records. This run used normal subprocess access for the existing operator-command tests.
- `npm run build`: passed TypeScript checks, complete catalog validation, client/server production compilation and content packaging.
- `npm run content:test-examples`: **46 complete C++20 programs passed** under GCC 16.2.1 with `-std=c++20 -Wall -Wextra -Werror -pedantic-errors -pthread`; stdout matched the authored expectations. No other compiler result is claimed. Original executable listings remained unchanged through final checkpoint placement.
- Final content audit confirmed all 91 unit definitions and 89 module discovery identities remain unchanged, all 267 part IDs remain stable, every part contains an explained checkpoint, and all original runnable programs, output blocks and illustrative traces remain intact.
- Stopped the verified Alexandria development process group, captured read-only row hashes, then ran `npm run content:import -- --all`. The official importer created a verified backup and published **89 new versions**, adding no modules or unit records. Fifty-three version-one lessons became version two; 36 version-two lessons became version three.
- Backup: `/home/lance/.local/share/alexandria-backups/alexandria-2026-09-11T17-44-55-950Z-b8ec4f23`.
- [Database verification](2026-09-11-depth-database-verification.json): every one of the **1,627 pre-existing rows across 24 tables** was preserved by full-row SHA-256 comparison. All 89 latest lesson definitions and complete bibliography metadata match the files. SQLite integrity and foreign-key checks pass. There are now 214 historical/current module versions, 642 part versions, and 295 physical bibliography records; the current lessons reference 264 of those records.
- Restarted the development server successfully on its existing ports. [Reader API verification](2026-09-11-depth-reader-verification.json) matched all **89 current versions, 267 parts and 264 public citation records** with the authored files. The check compares the API's documented public citation fields; publisher/ISBN metadata was checked in the database verification.
- Browser review confirmed the C++ learning path, the expanded first lesson, navigation into its second section, the contrasting output trace and the newly placed reflection. Revealing the explanation displayed the full worked answer. A screenshot check confirmed readable paragraphs, practice and navigation in the existing dark layout. Presentation code was unchanged; this pass does not claim a new exhaustive theme/device audit.

These checks establish content consistency, finite example execution, source-review provenance, publication and sampled presentation. They do not claim that the catalog exhausts every discipline, that every possible runtime behavior was executed, or that the original tutorials received external academic peer review.
