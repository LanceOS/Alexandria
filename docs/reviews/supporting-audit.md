# Supporting-subject content and reference audit

Audit date: **2026-09-11**. Baseline: **99a387f**. Scope: **22 lessons, 38 reference records, 25 distinct cited works**.

Every lesson was read in full, including objectives, prerequisites, all three parts, examples, reflection explanations, and bibliographic fields. The relevant passages of every distinct cited work were freshly inspected; two blocked DOI routes required manuscript mirrors. Parent and subunit ordering was checked against the actual unit metadata. Numerical and state-transition examples were independently recomputed. No curriculum JSON or database was edited.

The lessons are largely technically sound and properly separate general subject matter from C++ mechanisms. No incorrect computed result was found in the published toy traces. The most important defect is reference provenance: the old Parnas ResearchGate PDF is a different 2002 retrospective, despite its filename and running header. The actual 1972 paper supports the lesson and is now documented below. Other corrections concern two ambiguous denominators, strict reproducibility wording, two Cachegrind locators, and a missing LLNL author. Three central claims need better matched primary citations.

Findings are proposals, not applied edits. `error` includes materially ambiguous mathematical or definitional wording; `deficient_citation` means a wrong locator, mistaken provenance, or a substantive source-scope gap; `inaccessible_evidence` records something that could not be positively verified; `optional_enrichment` does not block technical acceptance. P1 marks provenance that should be corrected before giving an unqualified reference sign-off, P2 ordinary correctness/reference corrections, and P3 limited metadata or pedagogical improvements. The machine-readable companion contains exact current strings, JSON pointers, replacement strings, and proposed source objects.

## Complete lesson coverage

| # | Lesson and file | Prerequisites and worked-example check | Sources | Findings |
|---|---|---|---|---|
| 1 | [Decompose a task before choosing syntax](../../content/units/programming-foundations/problem-solving/01-decompose-a-task.json) | Prerequisites appropriate. 94−31=63; ceil(63/15)=5; completed=total gives 0; zero target rejected. | S01, S02 | SUP-010 |
| 2 | [Reason about a loop using an invariant](../../content/units/programming-foundations/state-correctness/01-reason-about-a-loop.json) | Prerequisites appropriate. Prefix invariant and decreasing remaining count checked; [8,0,12] totals 20. | S01 | SUP-010 |
| 3 | [Design a bounded queue from its contract](../../content/units/data-structures-algorithms/abstract-data-types/01-design-a-bounded-queue.json) | Prerequisites appropriate. Capacity-three ring wraps correctly; dequeue A leaves final [B,C,D]; extra enqueue rejected. | S03, S04 | No actionable issue |
| 4 | [Count the work in a search](../../content/units/data-structures-algorithms/algorithm-analysis/01-count-search-work.json) | Prerequisites appropriate. Target 31 visits midpoints 4,6,5 (24,40,31); three comparisons; complexity cost model explicit. | S04, S05 | No actionable issue |
| 5 | [Trace locality with a tiny cache](../../content/units/computer-architecture-operating-systems/memory-hierarchy/01-trace-cache-locality.json) | Prerequisites appropriate. Two-line LRU: AABBCC gives 3 misses; ABCABC gives 6; three-line cache gives 3. | S06 | SUP-001 |
| 6 | [Separate virtual addresses from physical storage](../../content/units/computer-architecture-operating-systems/process-memory/01-separate-addresses-from-storage.json) | Prerequisites appropriate. 4 KiB pages: physical frame 9 plus offset 0x028 gives 0x9028; frame C gives 0xC028. | S07 | SUP-008 |
| 7 | [Make a service contract explicit](../../content/units/software-design-architecture/interface-contracts/01-make-a-service-contract-explicit.json) | Prerequisites appropriate. Availability 4: reserve3 leaves1; reserve2 capacity failure and reserve0 invalid both preserve state. | S01, S02 | SUP-010, SUP-014 |
| 8 | [Hide a changing decision behind a stable boundary](../../content/units/software-design-architecture/responsibility-boundaries/01-hide-a-changing-decision.json) | Prerequisites appropriate. Changing representation remains behind repository operations; no benchmark or universal design proof claimed. | S02, S08 | SUP-006 |
| 9 | [Combine properties with fuzzing](../../content/units/testing-software-quality/generated-testing/01-combine-properties-and-fuzzing.json) | Prerequisites appropriate. [4,0,9] decodes incorrectly to [4,9]; minimal retained [0] produces []; shared reversal blind spot valid. | S09, S10 | SUP-007 |
| 10 | [Test the boundaries of an input domain](../../content/units/testing-software-quality/test-design/01-test-a-partitioned-input-domain.json) | Prerequisites appropriate. Digits-only 1..120 with leading zero policy: all listed valid, invalid and boundary cases checked. | S10, S11 | No actionable issue |
| 11 | [Model a build as a dependency graph](../../content/units/build-release-engineering/build-graphs/01-model-a-build-as-a-graph.json) | Prerequisites appropriate. app→library→codec graph, transitive compile properties, and incremental rebuild reasoning consistent. | S12 | SUP-011 |
| 12 | [Define a reproducible release artifact](../../content/units/build-release-engineering/release-reproducibility/01-define-a-reproducible-artifact.json) | Prerequisites appropriate. Different embedded absolute paths imply different bytes under the explicit hypothetical premises. | S13, S14 | SUP-005 |
| 13 | [Reason about useful bytes in a layout](../../content/units/performance-engineering/locality-optimization/01-reason-about-useful-bytes.json) | Prerequisites appropriate. 1,024×64=65,536; 1,024×4=4,096; 64 packed lines; traffic ratio16, not runtime ratio. | S06, S15 | SUP-001, SUP-013 |
| 14 | [Design a fair benchmark](../../content/units/performance-engineering/measurement-design/01-design-a-fair-benchmark.json) | Prerequisites appropriate. Sample means10.0667 and9.8000; ratio1.0272; invented data correctly disclaimed. | S15, S16 | SUP-015 |
| 15 | [Estimate the limit of parallel speedup](../../content/units/concurrency-parallel-computing/parallel-work/01-estimate-a-parallel-speedup-limit.json) | Prerequisites appropriate. Times1,000/600/400 ms; speedups1/1.67/2.5; limit5; overhead40 yields440 ms and2.27. | S17, S18 | SUP-002, SUP-004 |
| 16 | [Protect a complete state transition](../../content/units/concurrency-parallel-computing/shared-state/01-protect-a-complete-state-transition.json) | Prerequisites appropriate. Indivisible-action interleaving oversells one item twice; full locked transition prevents that trace. | S02, S19, S20 | No actionable issue |
| 17 | [Reason about rounded numbers](../../content/units/numerical-computing/representation-error/01-reason-about-rounded-numbers.json) | Prerequisites appropriate. Three-digit decimal paths give0 and1; both exact-real sums1; rounding assumptions checked. | S21 | SUP-010, SUP-012 |
| 18 | [Rearrange a calculation to retain useful information](../../content/units/numerical-computing/stable-algorithms/01-rearrange-a-sensitive-calculation.json) | Prerequisites appropriate. Four-digit model direct result0; rationalized result5.000e−9; x>0 and exponent limits explicit. | S21 | SUP-003, SUP-010 |
| 19 | [Design an interoperable data record](../../content/units/text-data-formats/interchange-contracts/01-design-an-interoperable-record.json) | Prerequisites appropriate. 9,007,199,254,740,993 exceeds binary64 contiguous integer range; string ID preserves digits; app policies explicit. | S11, S22 | No actionable issue |
| 20 | [Count the right unit of text](../../content/units/text-data-formats/unicode-text/01-count-the-right-text-unit.json) | Prerequisites appropriate. U+00E9→C3 A9; U+0065 U+0301→65 CC81; one versus two code points, one grapheme in this example. | S23 | No actionable issue |
| 21 | [Bound resource consumption at every stage](../../content/units/security-engineering/resource-resilience/01-bound-resource-consumption.json) | Prerequisites appropriate. 64,000/64=1,000 elements; 1,001 rejected;800 needs51,200 bytes; overflow-safe precheck conditions stated. | S11, S24 | No actionable issue |
| 22 | [Validate before changing state](../../content/units/security-engineering/trust-boundaries/01-validate-before-changing-state.json) | Prerequisites appropriate. Trailing junk, out-of-range value and wrong owner rejected before mutation; authn/authz separated. | S11, S25 | SUP-009 |

All 22 lessons have exactly three substantive parts and explicit boundaries. Examples are marked as illustrative traces, not measured output. Algorithm analysis precedes abstract data types; responsibility boundaries precede service contracts; example-based testing precedes generated testing; measurement precedes locality optimization; shared-state reasoning precedes parallel scaling; Unicode precedes JSON; trust boundaries precede resource resilience. The earlier language lessons supply the explicitly named C++ mechanisms where required. No circular prerequisite or unjustified dependency on advanced C++ was found.

## Per-source access and support inventory

Each row represents one distinct cited URL. Lesson numbers preserve every use; exact source IDs and current locators for all 38 records are included in [supporting-findings.json](supporting-findings.json). Access and inspection statements below refer to this audit, not an earlier research ledger.

| ID / lesson uses | Source and kind | Fresh access and support | Metadata / limits |
|---|---|---|---|
| S01 / 1, 2, 7 | [An Axiomatic Basis for Computer Programming](https://sites.cs.ucsb.edu/~kemm/courses/cs266/acmhoare69.pdf)<br>Primary published paper; university-hosted journal scan | Accessible; §§3.3–3.4, §4 and paper metadata inspected. Composition, iteration invariants and partial-correctness limits support the teaching reasoning. | Hoare; CACM 12(10), October 1969. Scan and Oxford author bibliography include continuation p. 583, although ACM indexed metadata lists 576–580. No proof of a particular C++ program is claimed. Separate termination argument is supplied in the lesson; official historical peer-review policy remains unverified. |
| S02 / 1, 7, 8, 16 | [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)<br>Expert recommendations; official project | Accessible; I.1,I.4,I.5,I.7,F.2 and CP.20–22 inspected. Explicit interfaces, pre/postconditions, focused functions, RAII locking and avoiding unknown code under a lock. | Editors Bjarne Stroustrup and Herb Sutter; live page dated 2026-06-14. Advisory, not normative or experimental evidence. Original service and design examples are applications. |
| S03 / 3 | [Dictionary of Algorithms and Data Structures: queue](https://xlinux.nist.gov/dads/HTML/queue.html)<br>Official NIST technical dictionary | Accessible; full queue entry inspected. FIFO behavior and abstract queue operations. | Paul E. Black; modified 2020-12-14. The ring-buffer representation is an independently checked original construction, not a NIST implementation. |
| S04 / 3, 4 | [Dictionary of Algorithms and Data Structures: big-O notation](https://xlinux.nist.gov/dads/HTML/bigOnotation.html)<br>Official NIST technical dictionary | Accessible; full big-O entry inspected. Asymptotic upper bounds and dependence on the cost model. | Paul E. Black; modified 2019-09-06. Big-O is not an exact runtime or necessarily a tight bound. |
| S05 / 4 | [Dictionary of Algorithms and Data Structures: binary search](https://xlinux.nist.gov/dads/HTML/binarySearch.html)<br>Official NIST technical dictionary | Accessible; full binary-search entry inspected. Sorted-array search, logarithmic comparison count, midpoint-overflow caution, and linked-list traversal distinction. | Paul E. Black; modified 2022-04-21. The specific eight-element trace is original. Unit-cost assumptions are explicit. |
| S06 / 5, 13 | [Valgrind User Manual: Cachegrind](https://valgrind.org/docs/manual/cg-manual.html)<br>Official tool documentation | Accessible; §§5.2.11,5.7,5.8.1–5.8.3 inspected. Cache simulation, line-based counting and simulator limitations. | The live section numbers differ from both lesson locators: §5.7 is Client Requests. Toy LRU traces and traffic estimates are not Cachegrind measurements or modern-CPU promises; SUP-001, SUP-013. |
| S07 / 6 | [Linux memory management: Concepts overview](https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html)<br>Official Linux implementation documentation | Accessible; Virtual Memory Primer, Huge Pages, Page cache, Anonymous Memory inspected. Page mappings, page offsets, process isolation and anonymous-demand allocation. | The URL is latest rather than a pinned kernel release; access date is recorded. Does not establish C++ lifetime or user-space allocator retention; SUP-008. Lesson correctly scopes the example to MMU-equipped Linux. |
| S08 / 8 | [On the Criteria To Be Used in Decomposing Systems into Modules](https://doi.org/10.1145/361598.361623)<br>Primary published paper; original journal scan via university mirror | DOI blocked; original scan freshly inspected at https://www.cse.sc.edu/~mgv/csce330f22/ParnasCriteria.pdf. Comparison pp.1055–1056, The Criteria p.1056 and Conclusion p.1058 support hiding changeable decisions. | D.L.Parnas, CACM 15(12), December 1972, pp.1053–1058; journal received/revised stamp present. Old ResearchGate access URL is a different 2002 retrospective. SUP-006. Official historical review policy unverified; do not equate received/revised with complete review verification. |
| S09 / 9 | [libFuzzer: a library for coverage-guided fuzz testing](https://releases.llvm.org/18.1.8/docs/LibFuzzer.html)<br>Official versioned project documentation | Accessible; Introduction, Fuzz Target, Corpus and Sanitizers inspected. Coverage-guided bytes, repeated same-process target calls, seed corpus and sanitizers. | LLVM 18.1.8 matches the citation. Not a source for a full property-generation/shrinking method; SUP-007. No current libFuzzer maintenance-status claim is made. |
| S10 / 9, 10 | [GoogleTest Primer](https://google.github.io/googletest/primer.html)<br>Official project documentation | Accessible; assertions, test independence and repeatability, fixtures inspected. Assertions and isolated, repeatable examples. | Title and contributor attribution match the live project documentation. Framework use does not prove correctness; generic domain partition and round-trip examples are original. |
| S11 / 10, 19, 21, 22 | [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)<br>Expert security guidance; official project | Accessible; Goals, Input Validation Strategies, syntax/semantics, allowlists, lengths/ranges and server-side validation inspected. Early validation, complete accepted formats, bounds and defense layers. | OWASP Cheat Sheet Series; no unsupported publication year. Does not replace destination-specific encoding or authorization. Separate authorization source recommended in SUP-009. |
| S12 / 11 | [cmake-buildsystem(7)](https://cmake.org/cmake/help/v3.31/manual/cmake-buildsystem.7.html)<br>Official versioned build-tool documentation | Accessible; Binary Targets, Build Specification and Usage Requirements, Target Usage Requirements, transitive compile/link properties inspected. Target dependency modeling and PUBLIC/PRIVATE/INTERFACE usage requirements. | CMake 3.31 documentation resolves to page build 3.31.12. Static link dependencies are not identical to compile-interface propagation; lesson caveat is correct. Heading precision improvement SUP-011. |
| S13 / 12 | [Reproducible Builds: Definitions](https://reproducible-builds.org/docs/definition/)<br>Official project definition | Accessible; complete Definitions page inspected. Specified artifacts, source, environment and bit-for-bit reproducibility. | Reproducible Builds project attribution is appropriate. Not security or authenticity proof. Equivalence-transformation wording needs precision; SUP-005. |
| S14 / 12 | [Reproducible Builds: Build path](https://reproducible-builds.org/docs/build-path/)<br>Official project guidance | Accessible; complete Build path page inspected. Embedded source/debug paths and supported compiler prefix mappings can affect build output. | Correct title and project authorship. Tool/format-specific options are not automatic reproducibility guarantees; toy paths are not an executed experiment. |
| S15 / 13, 14 | [Google Benchmark User Guide](https://google.github.io/benchmark/user_guide.html)<br>Official project documentation | Accessible; Runtime and Reporting Considerations, Preventing Optimization, repeated statistics and random-interleaving option inspected. Timing controls, compiler-elision caveats, repeats, warmup and run-order controls. | Current statistics heading is longer than the locator’s descriptive Reporting Statistics label. DoNotOptimize does not forbid every optimization. Lesson appropriately gives no universal measurement recipe or benchmark result. |
| S16 / 14 | [Rigorous Benchmarking in Reasonable Time](https://doi.org/10.1145/2464157.2464160)<br>Primary research; official institutional accepted manuscript | DOI blocked; Kent accepted manuscript cover and §§3,4,12 inspected. Repetition levels, variation, performance-ratio uncertainty and practical effect-size interpretation. | Tomas Kalibera and Richard Jones; ISMM 2013, pp.63–74. Kent calls its version corrected. Official ISMM 2013 site explicitly describes double-blind review. Historic workload measurements are not reproduced. Recommended access-locator update SUP-015; no source-content error found. |
| S17 / 15 | [Introduction to Parallel Computing Tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial)<br>Official institutional tutorial | Accessible; Amdahl’s Law, task decomposition, communication, granularity and Authors inspected. Fixed-work speedup denominator and overhead/granularity limitations. | Names Blaise Barney (retired), Donald Frederick, LLNL. Missing Frederick in current metadata; SUP-004. Prose formula grouping SUP-002. Numeric values are teaching assumptions. |
| S18 / 15 | [OpenMP Application Programming Interface 5.2: Execution Model](https://www.openmp.org/spec-html/5.2/openmpse3.html)<br>Normative API specification | Accessible; complete §1.3 Execution Model inspected. OpenMP 5.2 fork-join execution, tasks and floating-point reduction-order caveat. | Version 5.2 and section 1.3 correct. Applies to OpenMP, not std::thread or all parallel runtimes; lesson respects that boundary. |
| S19 / 16 | [OpenMP 5.2: Structure of the Memory Model](https://www.openmp.org/spec-html/5.2/openmpsu9.html)<br>Normative API specification | Accessible; complete §1.4.1 Structure of the OpenMP Memory Model inspected. Shared/private memory, temporarily inconsistent views, synchronization and race concerns. | OpenMP 5.2 and section 1.4.1 correct. Language-neutral interleaving table is a declared model; not a valid execution claim for racy C++. |
| S20 / 16 | [C++20 working draft N4861: Data races](https://timsong-cpp.github.io/cppwp/n4861/intro.races)<br>Primary C++20 working draft | Accessible; N4861 [intro.races]/2–6 and /21 inspected. Conflicting accesses, synchronization and undefined behavior from a C++ data race. | Pinned N4861, 2020-04-01; §6.9.2.1. Third-party HTML rendering of committee draft. Draft language rules, not official publisher final standard. Atomic individual actions do not by themselves protect a compound invariant. |
| S21 / 17, 18 | [What Every Computer Scientist Should Know About Floating-Point Arithmetic](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)<br>Primary survey; authorized edited reprint | Accessible; reprint note, Rounding Error, Floating-point Formats, Relative Error and Ulps, Guard Digits, Cancellation inspected. Finite representation, intermediate rounding, cancellation and algebraic reformulation rationale. | Oracle explicitly identifies David Goldberg, Computing Surveys, March 1991, authorized edited reprint. Exact volume/pages and historical review classification were not freshly established through accessible official ACM metadata. Not the current IEEE 754 normative text. Toy decimal computations independently verified. SUP-003, SUP-010, optional SUP-012. |
| S22 / 19 | [RFC 8259: The JavaScript Object Notation (JSON) Data Interchange Format](https://www.rfc-editor.org/rfc/rfc8259)<br>Primary Internet standard | Accessible; §§4,6,8.1,9 and status metadata inspected. Duplicate-name interoperability, binary64 exact-integer range, external UTF-8 interchange and parser limits. | RFC 8259, STD 90, Internet Standard, December 2017, T. Bray (editor). Rejecting duplicate names and string IDs are application policy choices, not universal JSON syntax requirements; lesson says so. |
| S23 / 20 | [The Unicode Standard, Version 16.0: General Structure](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-2/)<br>Primary Unicode standard | Accessible; Unicode 16.0.0 chapter 2, §§2.4–2.5,2.11.5,2.12 inspected. Code points, code units, grapheme clusters, canonical equivalence and normalization distinction. | Pinned Unicode 16.0.0. Chapter and cited subsection numbers correct. Bytes independently recomputed. General grapheme handling needs UAX #29 for implementation; lesson does not claim C++ string.size counts graphemes. |
| S24 / 21 | [CWE-400: Uncontrolled Resource Consumption](https://cwe.mitre.org/data/definitions/400.html)<br>Official weakness taxonomy | Accessible; definition, examples, potential mitigations and version data inspected. Finite-resource abuse, bounds and throttling; more than memory can be exhausted. | CWE-400; displayed content version 4.20 matches locator. Mitigations reduce risk, not a proof against all denial of service. Original budget arithmetic assumes positive element size. |
| S25 / 22 | [Secure Software Development Framework Version 1.1](https://csrc.nist.gov/pubs/sp/800/218/final)<br>Official NIST publication overview | Accessible; final publication page, abstract and metadata inspected. Integrating security practices through the development lifecycle. | SP 800-218, SSDF 1.1, February 2022; Souppaya, Scarfone, Dodson. Only overview/abstract is cited and was used; no unseen practice-level claims attributed. Does not provide object-level authorization policy. |

## Publication and peer-review verification

Publication identity and substantive support are separate from peer-review status. A paper hosted by a university or named in a prior ledger is not, by itself, an official review-process record. This audit does not use generic publisher reputation or modern policies as proof of the historical treatment of a particular article.

- **Hoare (1969):** the original journal scan establishes author, venue, volume/issue and the extra continuation page 583. The [Oxford author bibliography](https://www.cs.ox.ac.uk/people/publications/bibtex/Tony.Hoare.html) independently records 576–580, 583. The official [ACM article DOI](https://doi.org/10.1145/363235.363259) exposes author/venue/date/pages in search metadata, but direct article and venue guidance access failed. The received/revised stamp is evidence of editorial processing, not a full review-policy verification. Technical support is verified; official historical peer-review classification remains unresolved.
- **Parnas (1972):** the [actual six-page journal scan](https://www.cse.sc.edu/~mgv/csce330f22/ParnasCriteria.pdf) gives the correct title, author, CACM 15(12), pp.1053–1058, and received/revised dates. The [old ResearchGate PDF](https://www.researchgate.net/profile/David-Parnas/publication/200085877_On_the_Criteria_To_Be_Used_in_Decomposing_Systems_into_Modules/links/55956a7408ae99aa62c72622/On-the-Criteria-To-Be-Used-in-Decomposing-Systems-into-Modules.pdf) instead contains the 2002 retrospective *The Secret History of Information Hiding*, with the older paper title in running headers. This is a concrete prior provenance error, not an inaccessible-evidence assumption. Its retrospective description of a reviewer is not official venue metadata. The [ACM DOI](https://doi.org/10.1145/361598.361623) was blocked; official historical review verification remains unresolved.
- **Kalibera and Jones (2013):** the [Kent repository](https://kar.kent.ac.uk/33611/) and [accepted manuscript](https://kar.kent.ac.uk/33611/45/p63-kaliber.pdf) identify authors, venue, DOI and pp.63–74; the repository notes a corrected version. The official [ISMM 2013 site](https://csaws.cs.technion.ac.il/~erez/ismm13/) explicitly describes program-committee review, double-blind review, rebuttals and an external review committee. The [SIGPLAN conference listing](https://www.sigplan.org/Conferences/ISMM/) establishes the official conference trail. Peer-review classification is supported by venue evidence. The lesson’s historical experimental results were not replicated and are not presented as current measurements.
- **Goldberg (1991):** the [Oracle authorized edited reprint](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) explicitly identifies author, original journal and March 1991. Relevant mathematical passages were read. The official [article page](https://dl.acm.org/doi/10.1145/103162.103163) and [CSUR guidance](https://dl.acm.org/journal/csur/author-guidelines) returned 403. The existing 23(1), pp.5–48 metadata is plausible and widely indexed, but exact volume/pages and historical peer-review classification were not freshly verified through accessible official venue evidence. No assertion that the paper was unreviewed is warranted.

Blocked routes also included CACM author guidance (403), Parnas CMU DOI/item access, a MIT mirror, and two other Parnas mirrors. These failures were not treated as proof that the works do not exist. Search excerpts were used to discover accessible originals, not silently substituted for reading the cited technical passages.

## Findings and exact proposed changes

For citation additions the prose remains unchanged; the structured file supplies complete proposed source objects with globally distinct IDs. Those entries have identical current/replacement prose intentionally. Pending peer-review wording changes are conditional, not a finding that any historical paper was unreviewed.

### SUP-001 — Correct the two Cachegrind section locators

**deficient_citation · P2 · proposed, not applied.** The current locator identifies §5.7 as cache simulation, but that section is Client Requests. The relevant simulation and accuracy material is elsewhere. Both lessons correctly distinguish the original toy models from hardware guarantees.

File: [content/units/computer-architecture-operating-systems/memory-hierarchy/01-trace-cache-locality.json](../../content/units/computer-architecture-operating-systems/memory-hierarchy/01-trace-cache-locality.json); JSON pointer: `/sources/0/locator`.

Current:

```text
Official tool documentation: §5.7 cache simulation and §5.8.1–5.8.3 simulation model and accuracy limits; consulted 2026-09-11. Teaching cache traces use an explicitly simplified model.
```

Proposed:

```text
Official tool documentation: §5.2.11 Cache and Branch Simulation, §5.8.1 Cache simulation specifics, and §5.8.3 Accuracy; consulted 2026-09-11. Teaching cache traces use an explicitly simplified model.
```

File: [content/units/performance-engineering/locality-optimization/01-reason-about-useful-bytes.json](../../content/units/performance-engineering/locality-optimization/01-reason-about-useful-bytes.json); JSON pointer: `/sources/0/locator`.

Current:

```text
Official tool documentation: §5.7 cache simulation and §5.8.1–5.8.3 simulation model and accuracy limits; consulted 2026-09-11. Teaching cache traces use an explicitly simplified model.
```

Proposed:

```text
Official tool documentation: §5.2.11 Cache and Branch Simulation, §5.8.1 Cache simulation specifics, and §5.8.3 Accuracy; consulted 2026-09-11. Teaching cache traces use an explicitly simplified model.
```

Support: [Current manual §§5.2.11, 5.7, 5.8.1 and 5.8.3](https://valgrind.org/docs/manual/cg-manual.html) (relevant passage freshly inspected 2026-09-11).

### SUP-002 — Group the full denominator in Amdahl’s formula

**error · P2 · proposed, not applied.** The prose can be read as 1/s + (1-s)/p, which disagrees with the worked table. The table itself is correct. Explicit parentheses remove a potentially material mathematical ambiguity.

File: [content/units/concurrency-parallel-computing/parallel-work/01-estimate-a-parallel-speedup-limit.json](../../content/units/concurrency-parallel-computing/parallel-work/01-estimate-a-parallel-speedup-limit.json); JSON pointer: `/parts/1/blocks/1/text`.

Current:

```text
The unaccelerated portion limits the result. Expressing the serial fraction as s gives the fixed-workload ideal speedup 1 divided by s plus (1 minus s) divided by p. LLNL’s tutorial presents this reasoning as Amdahl’s Law. The assumptions matter: changing the problem size, algorithm, memory behavior, or serial fraction changes what comparison the formula describes.
```

Proposed:

```text
The unaccelerated portion limits the result. Expressing the serial fraction as s gives the fixed-workload ideal speedup 1 / (s + (1 - s) / p). LLNL’s tutorial presents this reasoning as Amdahl’s Law. The assumptions matter: changing the problem size, algorithm, memory behavior, or serial fraction changes what comparison the formula describes.
```

Support: [Amdahl’s Law: Speedup = 1 / (P/N + S)](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial) (relevant passage freshly inspected 2026-09-11).

### SUP-003 — Group the denominator of the rationalized square-root expression

**error · P2 · proposed, not applied.** The prose “x divided by sqrt(1 + x) plus 1” can mean x/sqrt(1+x)+1. The intended identity and the worked trace use x/(sqrt(1+x)+1). This is a notation defect, not an incorrect numeric trace.

File: [content/units/numerical-computing/stable-algorithms/01-rearrange-a-sensitive-calculation.json](../../content/units/numerical-computing/stable-algorithms/01-rearrange-a-sensitive-calculation.json); JSON pointer: `/parts/0/blocks/2/text`.

Current:

```text
Multiply numerator and denominator by sqrt(1 + x) plus 1. The product of the two conjugates is x, giving x divided by sqrt(1 + x) plus 1. The equivalent expression keeps the small x in its numerator and divides it by a quantity close to two. This is an original worked application of the cancellation principles discussed in Goldberg’s survey.
```

Proposed:

```text
Multiply numerator and denominator by (sqrt(1 + x) + 1). The product of the two conjugates is x, giving x / (sqrt(1 + x) + 1). The equivalent expression keeps the small x in its numerator and divides it by a quantity close to two. This is an original worked application of the cancellation principles discussed in Goldberg’s survey.
```

Support: [Cancellation; algebraic rationalization independently checked for x > 0](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) (relevant passage freshly inspected 2026-09-11).

### SUP-004 — Credit both named LLNL tutorial authors

**error · P3 · proposed, not applied.** The live institutional page names Blaise Barney (retired) and Donald Frederick, followed by LLNL. The current authors array omits Frederick.

File: [content/units/concurrency-parallel-computing/parallel-work/01-estimate-a-parallel-speedup-limit.json](../../content/units/concurrency-parallel-computing/parallel-work/01-estimate-a-parallel-speedup-limit.json); JSON pointer: `/sources/0/authors`.

Current:

```text
["Blaise Barney", "Lawrence Livermore National Laboratory"]
```

Proposed:

```text
["Blaise Barney", "Donald Frederick", "Lawrence Livermore National Laboratory"]
```

Support: [Authors line at end of tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial) (relevant passage freshly inspected 2026-09-11).

### SUP-005 — Keep reproducible-build comparison bit for bit

**error · P2 · proposed, not applied.** The source’s definition requires bit-for-bit identical specified artifacts. An unspecified “equivalence transformation” risks weakening that to behavioral or normalized equivalence after production. Normalization may legitimately be part of producing the declared artifact, but the comparison contract must remain explicit.

File: [content/units/build-release-engineering/release-reproducibility/01-define-a-reproducible-artifact.json](../../content/units/build-release-engineering/release-reproducibility/01-define-a-reproducible-artifact.json); JSON pointer: `/parts/1/blocks/2/text`.

Current:

```text
A cryptographic digest is a compact artifact identifier, not an explanation of a mismatch. Keep the actual artifacts and inspect their differences when a comparison fails. Build separately from clean inputs so one build cannot simply reuse the other’s output. Define the allowed environment variation and document any required equivalence transformation before seeing the result.
```

Proposed:

```text
A cryptographic digest is a compact artifact identifier, not an explanation of a mismatch. Keep the actual artifacts and inspect their differences when a comparison fails. Build separately from clean inputs so one build cannot simply reuse the other’s output. Define the allowed environment variation before comparing results. Require the specified release artifacts to match bit for bit. If normalization is part of artifact production, document it in the build instructions and compare the resulting artifacts; do not ignore differences in the published bytes.
```

File: [content/units/build-release-engineering/release-reproducibility/01-define-a-reproducible-artifact.json](../../content/units/build-release-engineering/release-reproducibility/01-define-a-reproducible-artifact.json); JSON pointer: `/parts/0/blocks/1/text`.

Current:

```text
A reproducible build allows the same source and defined build instructions and environment to produce matching specified artifacts. Decide what the artifact is: an executable, an archive, a container image, or a package with debug symbols. Comparing only the executable while ignoring changing package metadata supports a narrower claim than reproducing the complete release. Record that scope before comparing results.
```

Proposed:

```text
A reproducible build allows the same source and defined build instructions and environment to produce bit-for-bit identical specified artifacts. Decide what the artifact is: an executable, an archive, a container image, or a package with debug symbols. Comparing only the executable while ignoring changing package metadata supports a narrower claim than reproducing the complete release. Record that scope before comparing results.
```

Support: [Reproducible builds and Artifacts definitions](https://reproducible-builds.org/docs/definition/) (relevant passage freshly inspected 2026-09-11).

### SUP-006 — Replace the mistaken Parnas inspection provenance

**deficient_citation · P1 · proposed, not applied.** The ResearchGate URL recorded for the 1972 work actually contains the 2002 retrospective The Secret History of Information Hiding, with the older title in a running header. The original six-page 1972 article has now been inspected at the University of South Carolina mirror and supports the lesson. Repair the provenance rather than changing the design explanation.

File: [content/units/software-design-architecture/responsibility-boundaries/01-hide-a-changing-decision.json](../../content/units/software-design-architecture/responsibility-boundaries/01-hide-a-changing-decision.json); JSON pointer: `/sources/0/locator`.

Current:

```text
Peer-reviewed research: Communications of the ACM 15(12), 1972, pp. 1053–1058; comparison of decompositions and Conclusion. Author-uploaded paper text inspected on ResearchGate 2026-09-11; access URL recorded in research ledger.
```

Proposed:

```text
Published research: Communications of the ACM 15(12), December 1972, pp. 1053–1058; Comparison of the Two Modularizations, The Criteria, and Conclusion. Original journal scan inspected at https://www.cse.sc.edu/~mgv/csce330f22/ParnasCriteria.pdf on 2026-09-11. Publisher DOI access was blocked; official historical review-policy verification remains unresolved.
```

Support: [Original article pp. 1053–1058; comparison pp. 1055–1056, criteria p. 1056, conclusion p. 1058](https://www.cse.sc.edu/~mgv/csce330f22/ParnasCriteria.pdf) (relevant passage freshly inspected 2026-09-11); [PDF pp. 1–2: 2002 Springer collection and The Secret History of Information Hiding](https://www.researchgate.net/profile/David-Parnas/publication/200085877_On_the_Criteria_To_Be_Used_in_Decomposing_Systems_into_Modules/links/55956a7408ae99aa62c72622/On-the-Criteria-To-Be-Used-in-Decomposing-Systems-into-Modules.pdf) (relevant passage freshly inspected 2026-09-11).

### SUP-007 — Add a primary source for generated properties and counterexample shrinking

**deficient_citation · P2 · proposed, not applied.** libFuzzer supports coverage guidance and harness constraints; GoogleTest supports assertions and repeatability. Neither cited passage supplies the lesson’s central generator and shrinking method. A versioned property-testing project reference closes that gap without requiring students to learn Haskell.

File: [content/units/testing-software-quality/generated-testing/01-combine-properties-and-fuzzing.json](../../content/units/testing-software-quality/generated-testing/01-combine-properties-and-fuzzing.json); JSON pointer: `/parts/1/blocks/1/text`.

Current prose, retained unchanged:

> The smaller case explains the fault without unrelated values. Store it as a regression test, record the generator seed or input bytes needed to reproduce the failure, and fix the underlying behavior. Minimization is useful because the shortest clear failure often reveals a missing branch or a mistaken assumption about empty and zero values.

Append these freshly inspected primary sources:

- [QuickCheck 2.16.0.0: Test.QuickCheck.Arbitrary](https://hackage-content.haskell.org/package/QuickCheck-2.16.0.0/docs/Test-QuickCheck-Arbitrary.html) — Official versioned API documentation: Arbitrary, arbitrary, shrink, generator quality and invariant-preserving shrinking; consulted 2026-09-11. A Haskell implementation illustrates the general testing method, not a C++ API.

Support: [Arbitrary and CoArbitrary classes; arbitrary and shrink methods](https://hackage-content.haskell.org/package/QuickCheck-2.16.0.0/docs/Test-QuickCheck-Arbitrary.html) (relevant passage freshly inspected 2026-09-11).

Keep the valid original example and explanation; append the source to the module bibliography.

### SUP-008 — Support the language-lifetime and allocator boundary with matching primary sources

**deficient_citation · P2 · proposed, not applied.** The Linux concepts overview supports virtual pages, physical pages, and demand allocation. It does not establish C++ object-lifetime rules or the user-space allocator retention claim. These claims are correct but cross the sole cited source’s scope.

File: [content/units/computer-architecture-operating-systems/process-memory/01-separate-addresses-from-storage.json](../../content/units/computer-architecture-operating-systems/process-memory/01-separate-addresses-from-storage.json); JSON pointer: `/parts/1/blocks/2/text`.

Current prose, retained unchanged:

> Reserving virtual space also does not necessarily allocate one physical page immediately for every address. Linux anonymous mappings can obtain physical pages on demand. Consequently, virtual size and resident physical memory describe different quantities. Releasing a language-level allocation may leave allocator storage reserved for later reuse, so a process memory graph does not directly count live C++ objects.

Append these freshly inspected primary sources:

- [C++20 working draft N4861: Lifetime](https://timsong-cpp.github.io/cppwp/n4861/basic.life) — C++20 working draft N4861 (2020-04-01), §6.7.3 [basic.life]/1,4,6: object lifetime and limits on use of retained storage; consulted 2026-09-11. Language rules are distinct from Linux mappings.
- [The GNU C Library: Freeing Memory Allocated with malloc](https://sourceware.org/glibc/manual/latest/html_node/Freeing-after-Malloc.html) — Official implementation documentation, §3.2.3.4: freed allocations may be retained for reuse instead of returned immediately to the operating system; consulted 2026-09-11. GNU allocator behavior is an implementation example, not an ISO C++ guarantee.

Support: [N4861 [basic.life]/1,4,6](https://timsong-cpp.github.io/cppwp/n4861/basic.life) (relevant passage freshly inspected 2026-09-11); [§3.2.3.4, paragraph beginning Occasionally, free can actually return memory](https://sourceware.org/glibc/manual/latest/html_node/Freeing-after-Malloc.html) (relevant passage freshly inspected 2026-09-11).

Retain the existing distinction; append these sources. Do not turn the GNU implementation example into a portable allocator guarantee.

### SUP-009 — Cite authorization guidance for object-level access decisions

**deficient_citation · P2 · proposed, not applied.** The input-validation source covers syntax and semantics; the SSDF publication abstract covers lifecycle integration. The central distinction between authentication and authorization and per-resource permission checks needs the matching OWASP reference.

File: [content/units/security-engineering/trust-boundaries/01-validate-before-changing-state.json](../../content/units/security-engineering/trust-boundaries/01-validate-before-changing-state.json); JSON pointer: `/parts/2/blocks/0/explanation`.

Current prose, retained unchanged:

> Authentication establishes an identity; it does not authorize every action on every object. The server must evaluate the relationship between the caller, the operation, and the specific resource before updating it.

Append these freshly inspected primary sources:

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — Expert security guidance: Introduction, Enforce Least Privileges, Deny by Default, and Validate the Permissions on Every Request; consulted 2026-09-11. Application policy determines which caller/resource/action combinations are permitted.

Support: [Introduction; Enforce Least Privileges; Validate the Permissions on Every Request](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) (relevant passage freshly inspected 2026-09-11).

Keep the explanation and original application policy; append the source.

### SUP-010 — Do not mark historical journal review status as freshly verified

**inaccessible_evidence · P3 · proposed, not applied.** Relevant primary paper content is accessible, and published venue identity is established. However, the fresh official ACM/CACM/CSUR pages needed to verify historical peer-review classification returned 403 or a tool access error. Received/revised stamps, a publisher name, and old ledger labels are not a complete official review-policy check. This is an evidence limit, not a claim that these papers were unreviewed. Parnas is handled by SUP-006; ISMM 2013 is positively verified.

File: [content/units/programming-foundations/problem-solving/01-decompose-a-task.json](../../content/units/programming-foundations/problem-solving/01-decompose-a-task.json); JSON pointer: `/sources/0/locator`.

Current:

```text
Peer-reviewed research: Communications of the ACM 12(10), 1969, pp. 576–580, 583; §§3.3–3.4 and §4 on composition, invariants, and termination limits. Published paper inspected 2026-09-11.
```

Proposed:

```text
Published research: Communications of the ACM 12(10), 1969, pp. 576–580, 583; §§3.3–3.4 and §4 on composition, invariants, and termination limits. Published paper inspected 2026-09-11.
```

File: [content/units/programming-foundations/state-correctness/01-reason-about-a-loop.json](../../content/units/programming-foundations/state-correctness/01-reason-about-a-loop.json); JSON pointer: `/sources/0/locator`.

Current:

```text
Peer-reviewed research: Communications of the ACM 12(10), 1969, pp. 576–580, 583; §§3.3–3.4 and §4 on composition, invariants, and termination limits. Published paper inspected 2026-09-11.
```

Proposed:

```text
Published research: Communications of the ACM 12(10), 1969, pp. 576–580, 583; §§3.3–3.4 and §4 on composition, invariants, and termination limits. Published paper inspected 2026-09-11.
```

File: [content/units/software-design-architecture/interface-contracts/01-make-a-service-contract-explicit.json](../../content/units/software-design-architecture/interface-contracts/01-make-a-service-contract-explicit.json); JSON pointer: `/sources/1/locator`.

Current:

```text
Peer-reviewed research: Communications of the ACM 12(10), 1969, pp. 576–580, 583; §§3.3–3.4 and §4 on composition, invariants, and termination limits. Published paper inspected 2026-09-11.
```

Proposed:

```text
Published research: Communications of the ACM 12(10), 1969, pp. 576–580, 583; §§3.3–3.4 and §4 on composition, invariants, and termination limits. Published paper inspected 2026-09-11.
```

File: [content/units/numerical-computing/representation-error/01-reason-about-rounded-numbers.json](../../content/units/numerical-computing/representation-error/01-reason-about-rounded-numbers.json); JSON pointer: `/sources/0/locator`.

Current:

```text
Peer-reviewed research: ACM Computing Surveys 23(1), 1991, pp. 5–48, edited authorized reprint in Oracle Numerical Computation Guide, Appendix D; Rounding Error, Floating-point Formats, and Cancellation inspected 2026-09-11. Not the current IEEE 754 normative text.
```

Proposed:

```text
Published research: ACM Computing Surveys 23(1), 1991, pp. 5–48, edited authorized reprint in Oracle Numerical Computation Guide, Appendix D; Rounding Error, Floating-point Formats, and Cancellation inspected 2026-09-11. Not the current IEEE 754 normative text.
```

File: [content/units/numerical-computing/stable-algorithms/01-rearrange-a-sensitive-calculation.json](../../content/units/numerical-computing/stable-algorithms/01-rearrange-a-sensitive-calculation.json); JSON pointer: `/sources/0/locator`.

Current:

```text
Peer-reviewed research: ACM Computing Surveys 23(1), 1991, pp. 5–48, edited authorized reprint in Oracle Numerical Computation Guide, Appendix D; Rounding Error, Floating-point Formats, and Cancellation inspected 2026-09-11. Not the current IEEE 754 normative text.
```

Proposed:

```text
Published research: ACM Computing Surveys 23(1), 1991, pp. 5–48, edited authorized reprint in Oracle Numerical Computation Guide, Appendix D; Rounding Error, Floating-point Formats, and Cancellation inspected 2026-09-11. Not the current IEEE 754 normative text.
```

File: [content/units/numerical-computing/representation-error/01-reason-about-rounded-numbers.json](../../content/units/numerical-computing/representation-error/01-reason-about-rounded-numbers.json); JSON pointer: `/parts/0/blocks/1/text`.

Current:

```text
Finite representations cannot store every real number exactly. A computation therefore combines input approximation with rounding introduced by operations. More printed digits do not create information that was never represented. Goldberg’s peer-reviewed survey explains representation, rounding error, and cancellation; its historical discussion is useful conceptual background but is not a replacement for the current hardware and language specifications.
```

Proposed:

```text
Finite representations cannot store every real number exactly. A computation therefore combines input approximation with rounding introduced by operations. More printed digits do not create information that was never represented. Goldberg’s published survey explains representation, rounding error, and cancellation; its historical discussion is useful conceptual background but is not a replacement for the current hardware and language specifications.
```

Support: [Official CSUR venue guidance requested 2026-09-11](https://dl.acm.org/journal/csur/author-guidelines) (403 Forbidden); [Official CACM venue guidance requested 2026-09-11](https://cacm.acm.org/author-guidelines/) (403 Forbidden); [Official Hoare article metadata requested 2026-09-11](https://dl.acm.org/doi/10.1145/363235.363259) (direct open blocked; search index exposed bibliographic metadata only); [Official Goldberg article requested 2026-09-11](https://dl.acm.org/doi/10.1145/103162.103163) (403 Forbidden).

Use the neutral proposed wording until official historical evidence is attached, or retain the wording only with a clearly disclosed unresolved verification status. Do not discard the technically relevant sources.

### SUP-011 — Use the exact CMake usage-requirement headings

**optional_enrichment · P3 · proposed, not applied.** The current phrase Transitive Usage Requirements is understandable but is not the exact heading in the inspected CMake 3.31.12 page. This is a locator precision improvement; the PUBLIC/PRIVATE/INTERFACE compile-property lesson and static-link caveat are sound.

File: [content/units/build-release-engineering/build-graphs/01-model-a-build-as-a-graph.json](../../content/units/build-release-engineering/build-graphs/01-model-a-build-as-a-graph.json); JSON pointer: `/sources/0/locator`.

Current:

```text
Official versioned documentation: CMake 3.31, Binary Targets, Build Specification and Usage Requirements, and Transitive Usage Requirements; consulted 2026-09-11.
```

Proposed:

```text
Official versioned documentation: CMake 3.31 (page build 3.31.12), Binary Targets, Build Specification and Usage Requirements, Target Usage Requirements, Transitive Compile Properties, and Transitive Link Properties; consulted 2026-09-11.
```

Support: [Build Specification and Usage Requirements and Target Usage Requirements](https://cmake.org/cmake/help/v3.31/manual/cmake-buildsystem.7.html) (relevant passage freshly inspected 2026-09-11).

### SUP-012 — Demonstrate reassociation without also permuting operands

**optional_enrichment · P3 · proposed, not applied.** The existing decimal trace is numerically correct, but its second expression changes operand order as well as grouping. Keeping a,b,c in the same order makes the non-associativity lesson direct and avoids an unnecessary commutativity inference.

File: [content/units/numerical-computing/representation-error/01-reason-about-rounded-numbers.json](../../content/units/numerical-computing/representation-error/01-reason-about-rounded-numbers.json); JSON pointer: `/parts/1/blocks/0/code`.

Current:

```text
Teaching arithmetic: three significant decimal digits
a = 1.00 x 10^3; b = 1.00; c = -1.00 x 10^3

(a + b) + c:
  exact first sum 1001 -> rounded 1.00 x 10^3
  1000 + (-1000) -> 0

(a + c) + b:
  1000 + (-1000) -> 0
  0 + 1 -> 1
Exact real sum in either grouping: 1
```

Proposed:

```text
Teaching arithmetic: three significant decimal digits
a = 1.00 x 10^3; b = 1.00; c = -1.00 x 10^3

(a + b) + c:
  exact first sum 1001 -> rounded 1.00 x 10^3
  1000 + (-1000) -> 0

a + (b + c):
  1 + (-1000) -> -999 (exact at three significant digits)
  1000 + (-999) -> 1
Exact real sum in either grouping: 1
```

Support: [Floating-point Formats and Rounding Error; decimal trace independently recomputed](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) (relevant passage freshly inspected 2026-09-11).

### SUP-013 — Make array-base alignment explicit in the traffic model

**optional_enrichment · P3 · proposed, not applied.** The model’s 64-line packed scan assumes the packed array begins on a cache-line boundary. The phrase 64-byte aligned cache lines can be made more precise. This is not a correction to the model’s arithmetic.

File: [content/units/performance-engineering/locality-optimization/01-reason-about-useful-bytes.json](../../content/units/performance-engineering/locality-optimization/01-reason-about-useful-bytes.json); JSON pointer: `/parts/1/blocks/0/code`.

Current:

```text
Assumptions: 1,024 records; 64-byte aligned cache lines; cold scan
Each record is 64 bytes; each page count is 4 bytes

Record layout: 1,024 lines = 65,536 bytes fetched
Packed counts: 64 lines = 4,096 bytes fetched
Useful page-count data in either layout: 4,096 bytes
Traffic ratio in this model: 16 to 1
This is a traffic estimate, not a 16x runtime claim.
```

Proposed:

```text
Assumptions: 1,024 records; 64-byte cache lines; cold scan
Record storage and packed counts both begin on cache-line boundaries
Each record is 64 bytes; each page count is 4 bytes

Record layout: 1,024 lines = 65,536 bytes fetched
Packed counts: 64 lines = 4,096 bytes fetched
Useful page-count data in either layout: 4,096 bytes
Traffic ratio in this model: 16 to 1
This is a traffic estimate, not a 16x runtime claim.
```

Support: [§5.8.1: cache lines and model limits; original count independently derived](https://valgrind.org/docs/manual/cg-manual.html) (relevant passage freshly inspected 2026-09-11).

### SUP-014 — Distinguish valid requests from requests with enough capacity

**optional_enrichment · P3 · proposed, not applied.** The opening sentence could make insufficient capacity an invalid input even though the next sentences and worked trace treat it as a separate outcome. State the positive input domain separately from the condition for success.

File: [content/units/software-design-architecture/interface-contracts/01-make-a-service-contract-explicit.json](../../content/units/software-design-architecture/interface-contracts/01-make-a-service-contract-explicit.json); JSON pointer: `/parts/0/blocks/2/text`.

Current:

```text
For our small in-memory service, accept counts from one through the available capacity. A success subtracts exactly that count and returns a new reservation identifier. A capacity failure leaves availability unchanged. Invalid input is reported distinctly. We deliberately exclude network failures and persistent transactions here, because those add uncertainty about what happened after a request was sent.
```

Proposed:

```text
For our small in-memory service, a valid request contains a positive count. It succeeds only when that count does not exceed the available capacity. A success subtracts exactly that count and returns a new reservation identifier. A capacity failure leaves availability unchanged. Invalid input is reported distinctly. We deliberately exclude network failures and persistent transactions here, because those add uncertainty about what happened after a request was sent.
```

Support: [I.5 preconditions and I.7 postconditions; application contract is original](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines) (relevant passage freshly inspected 2026-09-11).

### SUP-015 — Record the accessible accepted benchmarking manuscript

**optional_enrichment · P3 · proposed, not applied.** The DOI is the correct publication identity but direct ACM access failed. Kent supplies an institutional accepted manuscript and labels the repository version as correcting the ISMM version. The lesson’s methodological claims are supported; no historical experimental results are repeated.

File: [content/units/performance-engineering/measurement-design/01-design-a-fair-benchmark.json](../../content/units/performance-engineering/measurement-design/01-design-a-fair-benchmark.json); JSON pointer: `/sources/1/locator`.

Current:

```text
Peer-reviewed research: ISMM 2013, pp. 63–74; §§3–4 and §12 on repetition, sources of variation, and effect-size confidence intervals. Paper text inspected through ResearchGate 2026-09-11; ledger records access URL. Historical experiments are not reproduced here.
```

Proposed:

```text
Peer-reviewed research: ISMM 2013, pp. 63–74; §§3–4 and §12 on repetition, variation, and effect-size confidence intervals. University of Kent accepted manuscript inspected at https://kar.kent.ac.uk/33611/45/p63-kaliber.pdf on 2026-09-11; repository describes it as a corrected version. Review process verified through the official ISMM 2013 Double-Blind Reviewing policy. Historical experiments are not reproduced here.
```

Support: [Accepted-manuscript cover; §§3,4,12](https://kar.kent.ac.uk/33611/45/p63-kaliber.pdf) (relevant passage freshly inspected 2026-09-11); [Repository version note](https://kar.kent.ac.uk/33611/) (relevant passage freshly inspected 2026-09-11); [Submission Information and Double-Blind Reviewing](https://csaws.cs.technion.ac.il/~erez/ismm13/) (relevant passage freshly inspected 2026-09-11).

## Checks, limits, and recommended disposition

All numerical toy checks passed: planner division, prefix sum, queue state, binary-search intervals, cold LRU misses, virtual-page offsets, record-traffic counts, sample means and ratio, Amdahl times and overhead, decimal rounding and rationalization, UTF-8 bytes, and resource budgets. State/error traces were also checked manually for promised mutation behavior. Python Decimal was used with the specified precisions; it was not used to claim a C++ floating-point guarantee. The test tables and JSON policies agree with their declared application contracts.

Original derivations do not require pretending that a source contains the exact invented example. The report therefore distinguishes supporting principles from independently checked local calculations. Source recommendations are not treated as normative language law, platform behavior is scoped to its documented implementation, and historical studies are not generalized into current timing guarantees.

Apply SUP-001 through SUP-009 before describing the curriculum as fully reference-audited. Resolve or disclose SUP-010; the sources remain useful even with neutral publication wording. SUP-011 through SUP-015 improve precision and reproducibility of reading. Retain the original baseline and audit record when updating source provenance. This audit did not edit or reinstall lesson content, run empirical benchmarks, or claim to reproduce published experiments.
