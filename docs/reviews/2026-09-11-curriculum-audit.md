# Curriculum accuracy and reference review

Reviewed **2026-09-11**, after committing the curriculum as **`99a387f9cdb8a58c65b9a8160f0059ed2a51bd27`** (`Expand curriculum with sourced C++ and supporting subject units`). This report assesses that commit. The review is complete; the proposed lesson corrections have **not** been applied or published.

**Assessment:** the lessons are largely accurate within their stated teaching scope, and the worked calculations and runnable C++ examples checked successfully. An unconditional accuracy/reference sign-off is not yet justified. There are **11 correction groups**, **seven recommendations to add more directly applicable sources**, and explicit gaps in book-passage and historical publication verification. These counts distinguish corrections from optional improvements; they are not counts of broken programs or of individual replacement strings.

## Scope and evidence

The review covered every one of the **89 modules**, all **267 lesson parts**, and all **228 source records**, which reference **179 distinct URLs**. It also checked the descriptions and subject boundaries of **25 topic/root units and 66 subunits**, the curriculum map, evidence policy and research ledgers. The manifest records the module/source inventory and SHA-256 identities of the baseline files. It does not itself label every reference as verified. [Coverage manifest](coverage-manifest.json).

Each lesson was read for objectives, prerequisites, explanations, example assumptions, arithmetic or program behavior, practice and reflection answers. Reviewers opened the relevant cited passages, checked the difference between standards, documentation, research and recommendations, and compared edition and publication metadata where accessible. Paper access through a mirror is recorded separately from the official publication identity. Reading a passage was not treated as reproducing a paper's experiments.

| Review area | Modules | Citation records | Distinct cited URLs within area | Detailed evidence |
| --- | ---: | ---: | ---: | --- |
| C++ Basics and advanced topics | 19 | 77 | 63 | [Audit](cpp-basics-advanced-audit.md) |
| C++ core | 22 | 83 | 69 | [Audit](cpp-core-audit.md), [exact proposals](cpp-core-findings.json) |
| Supporting subjects | 22 | 38 | 25 | [Audit](supporting-audit.md), [exact proposals](supporting-findings.json) |
| Application subjects | 26 | 30 | 30 | [Audit](applications-audit.md), [exact proposals](applications-findings.json) |

URLs shared between areas are counted once in the catalog total of 179. A citation record is a module-specific reference, not necessarily a distinct work. The course contains seven distinct research papers cited in ten records, plus a PLOS Perspective cited as practice guidance. It is appropriate for many C++ syntax lessons to cite specifications rather than unrelated research papers.

## Corrections before signing off

The highest-priority correction is the Parnas provenance statement. The remaining items are localized wording, bibliographic or locator corrections. The companion JSON files provide exact file paths, JSON pointers, current values, replacements and supporting evidence. All remain proposed.

| ID | Location / issue | Required correction and basis |
| --- | --- | --- |
| SUP-006 | Software design: information hiding | The earlier research ledger and lesson claim that the 1972 paper was inspected at a ResearchGate URL. That PDF actually contains the 2002 retrospective *The Secret History of Information Hiding*. Replace the inspection provenance with the original 1972 journal scan, which was obtained during this review and supports the lesson. [Original paper](https://www.cse.sc.edu/~mgv/csce330f22/ParnasCriteria.pdf). |
| APP-002 | Machine learning: tensor execution reflection | An absent direct edge does not establish independence: the lesson's `MatVec → Add → ReLU` graph is its own counterexample. Ask about operations with no direct or indirect dependency and no conflicting shared-state access. This is a deduction from the authored graph, consistent with the cited execution model. [TensorFlow, §3](https://www.usenix.org/system/files/conference/osdi16/osdi16-abadi.pdf). |
| APP-001 | Game development: scene-child rename | A stable public method protects its callers, but the scene implementation must maintain any internal lookup affected by the rename. Add that step to the trace. [Godot node paths](https://docs.godotengine.org/en/stable/tutorials/scripting/nodes_and_scene_instances.html). |
| SUP-002 | Parallel computing: Amdahl formula | Group the full denominator explicitly: `1 / (s + (1 - s) / p)`. The existing worked numbers are correct; the prose can be read as a different expression. [LLNL tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial). |
| SUP-003 | Numerical computing: rationalization | Write `x / (sqrt(1 + x) + 1)` with explicit grouping. The worked calculation already uses this expression. The identity is independently derived; the survey supports the cancellation principle. [Goldberg reprint](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html). |
| SUP-005 | Build engineering: reproducible artifacts | Require the specified output artifacts to be identical byte for byte. If normalization is part of producing the declared artifact, document that process; an unspecified equivalence transformation after production is too broad. [Project definition](https://reproducible-builds.org/docs/definition/). |
| SUP-001 | Architecture and performance: two Cachegrind locators | Section 5.7 is Client Requests. Point to §5.2.11, §5.8.1 and §5.8.3 for simulation and its limits. [Valgrind manual](https://valgrind.org/docs/manual/cg-manual.html). |
| SUP-004 | Parallel computing: tutorial author metadata | Add Donald Frederick alongside Blaise Barney and LLNL, as named by the institutional tutorial. [Author credits](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial). |
| CORE-001 | C++ vocabulary types | Qualify that `variant` normally holds an alternative; some throwing modifications can leave it valueless. The constant worked example is unaffected. [N4861 variant](https://timsong-cpp.github.io/cppwp/n4861/variant). |
| CORE-005 | C++ exception guarantee: vector locator | Identify `swap` and its conditional `noexcept` declaration instead of describing `reserve`. Add the default-allocator trait supporting the commit step. [Vector capacity/swap](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity), [default allocator](https://timsong-cpp.github.io/cppwp/n4861/default.allocator). |
| CORE-006 | C++ text streams: `ws` locator | Distinguish exhaustion while extracting whitespace from calling `ws` when the stream already has `eofbit`; sentry construction can add `failbit` in the latter case. The worked parser remains correct. [Input manipulators](https://timsong-cpp.github.io/cppwp/n4861/istream.manip), [input sentry](https://timsong-cpp.github.io/cppwp/n4861/istream.sentry). |

The corrections do not require replacing the curriculum structure or rewriting the programs. They do require an appropriate later content release if learners are to see the corrected explanations and citations.

## Strengthen seven source connections

The following claims were found to be correct, but their current citations do not directly establish all the taught behavior. Add the sources in the structured proposals; do not remove the relevant existing references.

| IDs | Claim needing a closer source | Verified source to add |
| --- | --- | --- |
| CORE-002 | Defaulted equality's result | [N4861 class.eq](https://timsong-cpp.github.io/cppwp/n4861/class.eq) |
| CORE-003 | Unordered-container hashing, equality and iteration order | [N4861 unord.req](https://timsong-cpp.github.io/cppwp/n4861/unord.req) |
| CORE-004 | `count_if` result and predicate count | [N4861 alg.count](https://timsong-cpp.github.io/cppwp/n4861/alg.count) |
| CORE-007 | Deletion through a base pointer and dispatch during construction/destruction | [N4861 expr.delete](https://timsong-cpp.github.io/cppwp/n4861/expr.delete), [class.cdtor](https://timsong-cpp.github.io/cppwp/n4861/class.cdtor) |
| SUP-007 | Property generation and shrinking, beyond coverage-guided fuzzing | [QuickCheck 2.16.0.0 Arbitrary documentation](https://hackage-content.haskell.org/package/QuickCheck-2.16.0.0/docs/Test-QuickCheck-Arbitrary.html); the general method is distinct from its Haskell API. |
| SUP-008 | C++ lifetime versus allocator retention versus Linux mappings | [N4861 basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life), with the separately scoped [GNU allocator documentation](https://sourceware.org/glibc/manual/latest/html_node/Freeing-after-Malloc.html). |
| SUP-009 | Authentication versus object-level authorization | [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) |

## Research references and verification limits

| Work | Appropriate use in the lessons | Verification outcome |
| --- | --- | --- |
| Hoare, *An Axiomatic Basis for Computer Programming* (1969) | Composition, invariants and partial correctness, with termination argued separately | Relevant journal-scan text and identity checked. Historical review-policy evidence was not fully accessible. [Published scan](https://sites.cs.ucsb.edu/~kemm/courses/cs266/acmhoare69.pdf). |
| Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules* (1972) | Choosing boundaries around changeable decisions | Original text checked and supports the claim; prior access provenance is wrong. Historical review-policy verification remains qualified. [Original scan](https://www.cse.sc.edu/~mgv/csce330f22/ParnasCriteria.pdf). |
| Goldberg, *What Every Computer Scientist Should Know About Floating-Point Arithmetic* (1991) | Representation, rounding and cancellation | Relevant authorized edited reprint inspected. Publisher access limited fresh verification of exact volume/pages and historical review classification; it is not current IEEE normative text. [Reprint](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html). |
| Boehm and Adve, *Foundations of the C++ Concurrency Memory Model* (2008) | Historical rationale, with current language rules cited separately | Abstract/introduction, authors, year, pages and proceedings identity checked. The institutional record for the same paper's journal publication explicitly marks peer review. [Paper](https://rsim.cs.illinois.edu/Pubs/08PLDI.pdf), [classification](https://experts.illinois.edu/en/publications/foundations-of-the-c-concurrency-memory-model/). |
| Kalibera and Jones, *Rigorous Benchmarking in Reasonable Time* (2013) | Repetition, variation and effect-size uncertainty | Relevant accepted manuscript and identity checked; official ISMM review policy verified. Repository identifies a corrected version. [Manuscript](https://kar.kent.ac.uk/33611/45/p63-kaliber.pdf), [conference policy](https://csaws.cs.technion.ac.il/~erez/ismm13/). |
| Ongaro and Ousterhout, *In Search of an Understandable Consensus Algorithm* (2014) | Fixed-membership, current-term majority commitment in Raft | Relevant paper sections and official metadata checked; conference refereed-paper policy verified. [Publication](https://www.usenix.org/conference/atc14/technical-sessions/presentation/ongaro), [policy](https://www.usenix.org/conference/atc14/call-for-papers). |
| Abadi and colleagues, *TensorFlow: A System for Large-Scale Machine Learning* (2016) | Historical graph execution model | Relevant paper sections and complete author metadata checked; OSDI's double-blind review policy verified. The authored reflection needs APP-002. [Publication](https://www.usenix.org/conference/osdi16/technical-sessions/presentation/abadi), [policy](https://www.usenix.org/conference/osdi16/call-for-papers). |
| Wilson and colleagues, *Good enough practices in scientific computing* (2017) | Practice guidance for provenance and reproducibility | Correctly identified as a PLOS Perspective; not counted as an experimental validation of the course's teaching methods. [Article](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1005510). |

Inaccessible publisher pages do **not** establish that the historical papers were unreviewed. They limit what this audit can claim to have freshly verified. The supporting report offers neutral wording or explicit qualification while that evidence remains incomplete. Do not automatically downgrade valid research just because an access route failed.

The seven Stroustrup textbook references have verified edition, author, publisher, year, ISBN and section identities. The local books were unavailable and the author-linked sample was blocked. Consequently, this review did not independently verify the printed page-specific passages in Basics 1–6. Basics 7 correctly describes its book citation as further reading with section-title verification. The standard passages were independently checked. [Author's metadata](https://www.stroustrup.com/4th.html), [section identities](https://www.stroustrup.com/4thContents.html).

The 27 Basics current-draft citation records should eventually use a frozen edition, matching the newer C++ units. Rolling framework manuals likewise remain dated observations. These are reproducibility improvements, not evidence that the reviewed elementary claims are wrong. An unavailable supplementary N4950 PDF did not prevent inspection of the frozen HTML actually cited by the lessons.

## Validation and practical limits

- Before the requested commit, `git diff --check` and `npm run content:check` passed.
- During this audit, `npm run content:test-examples` checked **46 complete C++ programs**, with zero failures. Compiler: `g++ (GCC) 16.2.1 20260819 (Red Hat 16.2.1-2)`. Flags: `-std=c++20 -Wall -Wextra -Werror -pedantic-errors -pthread`.
- Supporting and application traces were independently recomputed. No incorrect numerical result was found. Conceptual text traces were not represented as executed engine, hardware or framework code.
- The prior implementation turn's 107 passing tests, production build and database-integrity checks are recorded in [the evidence policy](../curriculum-evidence.md). They were not rerun merely to audit prose and are not proof of factual accuracy.
- The root/subunit/module layout remains consistent. Prerequisites are reading recommendations, and each non-C++ subject currently has two initial modules. This review does not certify exhaustive coverage of any discipline.
- Report QA checked 180 baseline file hashes, the local report links, 33 exact current-value proposals and 13 distinct proposed source IDs, with no mismatches or duplicate source IDs. A separate review confirmed the consolidated findings counts and qualifications.

The review did not reproduce research experiments, prove arbitrary-input or all-schedule correctness, execute every framework, measure performance, or obtain independent academic peer review of the original lessons. Those limits are different from the concrete corrections above.

## Applying the findings later

The exact proposals make the next content revision reviewable. They are not an instruction to run a blind JSON patch against the live catalog. Published module versions and cited source records are immutable in the current importer, whose file workflow installs version 1. Changing a released JSON definition in place would conflict on re-import. A correction release must preserve stable module/part identities, create new version/source identities where required, retain learner history and validate the new content before publishing. [Versioning design](../database-schema.md), [current importer](../../server/content/install-content.ts).

This report preserves the committed baseline and records its errata. No claim is made that learners already see corrected content. Optional refinements, including clearer `vector<bool>` wording, more precise editorial credits, stable reference snapshots and additional publication-access links, remain separately labeled in the detailed reports.
