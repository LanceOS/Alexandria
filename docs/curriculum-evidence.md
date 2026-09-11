# Curriculum evidence and authoring policy

All subjects use the existing C++ layout: a topic and root unit, child subunits, modules with objectives and exactly three lesson parts, worked examples, explained reflections, and public sources. The same client components render every subject. The curriculum map distinguishes C++ language mechanisms, broader computing principles, and domain applications.

The standing [curriculum depth standard](../notes/curriculum-depth.md) requires substantial teaching throughout those parts: conceptual reasoning, step-by-step and contrasting worked cases, practice with explained answers, and relevant limitations. Organization supports efficient learning; brevity alone is not a teaching goal. The [depth expansion review](reviews/2026-09-11-curriculum-depth.md) records the latest teaching and source checks across all 89 modules.

The [follow-up audit of commit 99a387f](reviews/2026-09-11-curriculum-audit.md) covers all 89 modules and records outstanding corrections, source additions and verification limits. Read it alongside the initial ledgers below: it identifies mistaken Parnas inspection provenance and other citation issues. The [correction release](reviews/2026-09-11-curriculum-corrections.md) records the applied findings and validation. Historical audit files retain their original observations; the current ledgers describe the corrected references.

## Match a claim to the right evidence

1. **Language or protocol rules:** inspect the applicable standard, a clearly identified standards draft, or a normative API specification. Record the edition and section. A working draft is not the published ISO standard, and a proposal is not an adopted feature.
2. **Tool or library behavior:** inspect official documentation or the project's own source documentation. Record the version where available, otherwise the consultation date and the limits of that snapshot.
3. **Research findings:** use a relevant peer-reviewed paper and verify its authors, venue, year, and the portion supporting the claim. Distinguish a journal/conference paper from a preprint, tutorial, or expert recommendation. Explain assumptions and avoid turning a result from one experiment into a universal guarantee.
4. **Engineering recommendations:** identify them as guidance, with their reasoning and applicable context. The C++ Core Guidelines and OWASP guidance are useful recommendations, not language standards or experimental proof.
5. **Original examples and deductions:** state the model and inputs, show the reasoning, and cite the rules used to check it. Mark hypothetical timings and simplified traces explicitly; do not imply that they are measured results.

Use primary documentation for exact C++ semantics. Research is included where it explains an algorithm, design rationale, or empirical result; attaching an unrelated paper to each syntax lesson would not improve its evidence. The lessons themselves are original instructional material and have not been externally peer reviewed.

## Inspect before citing

Open and read the relevant source passage. A title in search results is insufficient. If only an abstract or official publication overview is accessible, restrict the attributed claim to that material and record the limitation. Do not invent book page numbers, paper sections, experimental outcomes, or a claim of having read inaccessible text.

Store a public URL and useful locator in each module's `sources`. Include authors and known publication metadata. Use unique citation IDs per module. Source locators identify whether the reference is standards material, official documentation, research, or guidance. Research ledgers record what was inspected and what it supports. They do not contain private files or copyrighted page extracts.

The current evidence ledgers are:

- [Original C++ Basics](cpp-basics-content.md)
- [Core C++](research/cpp-core.md)
- [Advanced C++](research/cpp-advanced.md)
- [Supporting subjects](research/supporting-subjects.md)
- [Application tracks](research/application-tracks.md)

## Verify lessons as well as files

- Run `npm run content:check` to validate schemas, ordering, identities, source URLs, and reader limits across the catalog. Structural validation does not establish factual accuracy.
- Run `npm run content:test-examples` to compile and execute the reviewed C++ listings and compare their expected output. The baseline is C++20. Keep the compiler version and flags in review records.
- Independently check mathematical traces, boundary cases, units, and assumptions. Mark pseudocode and hypothetical examples as such. A sequential trace is not evidence of every concurrent schedule.
- Review lifetime, ownership, bounds, failure paths, and standard-version claims against the cited material. A passing example does not prove behavior outside its stated inputs.
- Check the learning path, objectives, three sections, reflection reveal, next-module navigation, and source links in the shared reader. Check both themes and narrow layouts when changing presentation code.
- Import only after review. Existing published definitions are immutable in this importer. Keep stable module and part identities; publish revisions with the next `version` and a new `versionId` through the documented [import workflow](../content/README.md#import-and-publication). Preserve source IDs only when their bibliographic metadata is unchanged.

Do not describe the initial set of lessons as exhaustive coverage of every nuance in a subject. The units establish a coherent home for deeper modules; additions should extend that structure without duplicating the same foundational lesson across subjects.

## Initial expansion verification — 2026-09-11

- `npm test`: 107 tests passed. The successful run used normal subprocess access because the restricted execution environment prevented an existing authentication-command subprocess test from running correctly.
- `npm run build`: passed, including TypeScript, complete catalog validation, client production build, server compilation, and content packaging.
- `npm run content:test-examples`: all 46 complete C++20 programs compiled and produced the expected output with GCC 16.2.1, using `-Wall -Wextra -Werror -pedantic-errors -pthread`. No Clang or platform-specific application-runtime result is claimed.
- The local `--all` import created a verified backup and added 82 modules. The resulting database has 25 topics, 91 unit records (25 roots and 66 subunits), 89 modules, 267 lesson parts, and 228 source records. Reused citations have separate module-specific records.
- SHA-256 comparisons of every pre-existing content row confirmed that all 130 rows across the nine content and citation tables were preserved. SQLite integrity and foreign-key checks passed.
- Browser review confirmed the expanded C++ hierarchy and a new Systems programming topic through the shared overview and reader. Objectives, section navigation, worked-example layout, reflection reveal, and source links rendered correctly. The development server was restarted successfully after import.

These checks establish structural, execution, import, and sampled presentation results. The linked ledgers separately document the factual review and its boundaries.

## Correction release — 2026-09-11

The [applied-findings report](reviews/2026-09-11-curriculum-corrections.md) records 36 published lesson revisions, 13 added references, and the remaining evidence limits. All 113 tests, the production build, and all 46 C++ examples passed. The local import preserved all 1,321 existing database rows; all 89 current lesson definitions match the authored files, and the reader API serves all 36 corrected versions with matching references.

## Depth expansion — 2026-09-11

The [depth expansion report](reviews/2026-09-11-curriculum-depth.md) records 89 further lesson revisions, 269 explained practice checkpoints across all 267 parts, 23 added references, and the applied independent-review findings. The expanded teaching follows the permanent standard in `/notes`. All 113 tests, the production build and 46 C++20 examples passed. Local publication preserved all 1,627 pre-existing database rows; every latest module, lesson part and public reference matches its authored definition. The report and four authoring ledgers retain the evidence and execution limits.
