# Supporting-subject curriculum research ledger

Authored and sources consulted on **2026-09-11**. This ledger covers the eleven supporting-subject roots added alongside the C++ curriculum. Each contains two focused subunits and two complete lessons in total: 33 unit definitions, 22 modules, and 66 ordered lesson parts. These are initial teaching sequences within broad subjects, not a claim that two lessons exhaust each discipline.

The modules follow the existing C++ reader format: objectives, three parts containing explanations and worked traces, a reflection with a revealed explanation, and sources. Every lesson identifies prerequisites and the boundary with C++. Source locators distinguish standards, standards drafts, official documentation, institutional teaching material, expert guidance, and peer-reviewed research. Publication in a peer-reviewed venue is not presented as proof that every teaching recommendation is universally optimal.

## Subject boundaries

| Root | Subunits | Knowledge owned here |
| --- | --- | --- |
| `programming-foundations` | Problem Solving; State and Correctness | Specification, decomposition, invariants, termination reasoning |
| `data-structures-algorithms` | Algorithm Analysis; Abstract Data Types | Cost models, search reasoning, contracts and representations |
| `computer-architecture-operating-systems` | Memory Hierarchy; Process Memory | Cache models, virtual memory and mappings |
| `software-design-architecture` | Responsibility Boundaries; Interface Contracts | Change analysis, hidden decisions, observable API promises |
| `testing-software-quality` | Test Design; Generated Testing | Boundary cases, properties, fuzz targets, evidence limits |
| `build-release-engineering` | Build Graphs; Release Reproducibility | Target requirements, artifact inputs and repeatability |
| `performance-engineering` | Measurement Design; Locality and Optimization | Fair comparisons, uncertainty, traffic hypotheses |
| `concurrency-parallel-computing` | Shared State and Coordination; Parallel Work and Scalability | Atomicity of application operations, progress, decomposition and scaling |
| `numerical-computing` | Representation and Error; Stable Algorithms | Rounding, error measures, stable formulas and conditioning |
| `text-data-formats` | Unicode Text; Interchange Contracts | Encoding, grapheme clusters, record meaning and interoperability |
| `security-engineering` | Trust Boundaries; Resource Resilience | Validation, authorization boundaries, budgets and failure policy |

C++ syntax, lifetime rules, container interfaces, language memory ordering, and coroutine mechanisms remain in C++. Supporting lessons use language-neutral text traces so their principles remain applicable to other implementations.

## Peer-reviewed research inspected

| Source and classification | Material inspected and supported claim | Limits |
| --- | --- | --- |
| C. A. R. Hoare, [An Axiomatic Basis for Computer Programming](https://sites.cs.ucsb.edu/~kemm/courses/cs266/acmhoare69.pdf), *Communications of the ACM* 12(10), 1969, pp. 576–580, 583. Peer-reviewed theoretical paper; university-hosted scan of published text. | §§3.3–3.4 composition and iteration rules; §4 explicitly distinguishes conditional correctness from termination. Supports the conceptual connection between function assumptions, invariants and results. | The reading planner and prefix-sum traces are original applications. They are not reproduced paper experiments. Mathematical reasoning requires compatible arithmetic assumptions; the paper does not specify modern C++. |
| D. L. Parnas, [On the Criteria To Be Used in Decomposing Systems into Modules](https://doi.org/10.1145/361598.361623), *Communications of the ACM* 15(12), 1972, pp. 1053–1058. Peer-reviewed design argument. | Inspected comparison and Conclusion in the [author-uploaded paper text](https://www.researchgate.net/publication/291991118_On_the_Criteria_To_Be_Used). Supports analyzing boundaries around difficult or changeable decisions and comparing change impact. | The catalog/repository design is original. This is a historical design argument with examples, not a modern controlled trial measuring all architectures. The publisher PDF returned access denial; the accessible uploaded paper was read instead. |
| Tomas Kalibera and Richard Jones, [Rigorous Benchmarking in Reasonable Time](https://doi.org/10.1145/2464157.2464160), *ISMM 2013*, pp. 63–74. Peer-reviewed empirical and methodological paper. | Inspected §§3–4 and §12 in the [paper text available through ResearchGate](https://www.researchgate.net/publication/257193308_Rigorous_Benchmarking_in_Reasonable_Time). Supports identifying variation at different experiment levels and reporting effect sizes with uncertainty. The [Kent repository record](https://kar.kent.ac.uk/33611/) corroborates bibliographic details. | Its workload/platform findings are historical. No reported speedup, sample size, or experimental outcome is transferred to this project. Lesson timings are explicitly invented arithmetic illustrations. |
| David Goldberg, [What Every Computer Scientist Should Know About Floating-Point Arithmetic](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html), *ACM Computing Surveys* 23(1), 1991, pp. 5–48. Peer-reviewed tutorial survey, authorized edited reprint in Oracle's Numerical Computation Guide. | Inspected Rounding Error, Floating-point Formats, Relative Error and Ulps, and Cancellation. Supports finite representation, rounding, and information loss in intermediate values. | Three- and four-significant-digit decimal traces are original simplified models, not claims about a C++ implementation. The reprint is not the current normative IEEE 754 specification. No numerical experiment or performance claim is made. |

Unsuccessful early mirror requests were not counted as inspection. The final references above identify the text actually read. An inaccessible QuickCheck paper was considered during research but is **not cited**; the generated-testing lesson relies on official tool documentation and explicitly reasoned original examples.

## Standards and standards drafts inspected

| Source | Material inspected and claim supported | Classification and limits |
| --- | --- | --- |
| [C++20 draft N4861, intro.races](https://timsong-cpp.github.io/cppwp/n4861/intro.races) | Paragraphs 2–6 and 21: conflicting actions, atomic operations, synchronization, and undefined behavior from a data race. Supports the explicit warning that the logical sale interleaving is not the guaranteed behavior of unsynchronized ordinary C++. | Primary standards draft, pinned to C++20; HTML mirror of WG21 draft wording, not the published ISO edition. |
| [OpenMP 5.2, Execution Model](https://www.openmp.org/spec-html/5.2/openmpse3.html) | §1.3 on tasks and the execution model. Supports separating task semantics from operating-system thread assumptions. | Normative OpenMP API specification, version 5.2. Does not specify `std::thread`, generic executors, or all concurrency runtimes. |
| [OpenMP 5.2, Structure of the Memory Model](https://www.openmp.org/spec-html/5.2/openmpsu9.html) | §1.4.1 on shared/private storage, conflicting accesses and retained-object lifetimes. Supports the need for an explicit sharing and synchronization protocol. | Normative OpenMP specification. Its terminology and consequences are not substituted for C++ language rules. The reservation trace states its own simpler atomic-operation assumptions. |
| [Unicode 16.0.0, Chapter 2](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-2/) | §2.5 encoding forms, §2.11.5 grapheme clusters, §2.12 equivalent sequences. Supports separating byte, code-point and editing units and distinguishing canonical equivalence from visual similarity. | Official standard exposition pinned to Unicode 16.0.0. No assertion that code-point count equals display width or that arbitrary lookalikes normalize identically. |
| [RFC 8259](https://www.rfc-editor.org/rfc/rfc8259), December 2017 | §§4, 6, 8.1 and 9: object name uniqueness recommendation, interoperable numeric ranges, UTF-8, and parser limits. | Normative Internet standard. Rejecting duplicate keys and unknown versions are explicitly identified as the example application's stricter policies, not universal JSON grammar rules. |

## Official documentation and guidance inspected

| Source | Inspected material and supported claim | Limits |
| --- | --- | --- |
| NIST DADS: [big-O notation](https://xlinux.nist.gov/dads/HTML/bigOnotation.html), modified 2019-09-06 | Formal bound, distinction from tight growth, and computation models. | Official reference documentation; an operation count is not measured runtime. |
| NIST DADS: [binary search](https://xlinux.nist.gov/dads/HTML/binarySearch.html) | Sorted input, halving a candidate interval and logarithmic comparison growth. | Official reference documentation; constant-time indexed access and comparison costs are explicit lesson assumptions. |
| NIST DADS: [queue](https://xlinux.nist.gov/dads/HTML/queue.html), modified 2020-12-14 | FIFO behavior and abstract operations. | Official reference documentation. The capacity-three ring buffer and rejection policy are original design choices. |
| [Linux memory concepts](https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html) | Virtual Memory Primer, Huge Pages, Page cache and Anonymous Memory. | Official implementation documentation for MMU-equipped Linux. The 4096-byte trace is illustrative, not a universal page size. OS permissions do not establish C++ object validity. |
| [Valgrind Cachegrind manual](https://valgrind.org/docs/manual/cg-manual.html) | Cache simulation and §§5.8.1–5.8.3 model and accuracy limits. | Official tool documentation. Cachegrind approximates hardware; toy cache traces do not predict real cycle counts. |
| [GoogleTest Primer](https://google.github.io/googletest/primer.html) | Independent/repeatable tests, assertions, and fixtures. | Official project documentation and its authors' testing guidance. Does not establish universal empirical test effectiveness or correctness from passing examples. |
| [LLVM 18.1.8 libFuzzer](https://releases.llvm.org/18.1.8/docs/LibFuzzer.html) | Introduction, fuzz target requirements, corpus and sanitizers. | Official versioned tool documentation. Describes coverage-guided execution, not a proof that all inputs have been explored. |
| [CMake 3.31 buildsystem manual](https://cmake.org/cmake/help/v3.31/manual/cmake-buildsystem.7.html) | Binary targets, target commands, public/private/interface properties, and transitive compile/link requirements. | Official versioned documentation. The lesson distinguishes compile propagation from static-library final linking details. |
| Reproducible Builds: [Definitions](https://reproducible-builds.org/docs/definition/) | Source, environment, instructions, and specified artifact identity. | Official project guidance. Reproducibility, authenticity, correctness, and security are separate claims. |
| Reproducible Builds: [Build path](https://reproducible-builds.org/docs/build-path/) | Embedded source paths and compiler prefix-map options. | Official project guidance. No toolchain option or actual release rebuild was executed as part of this lesson. |
| [Google Benchmark User Guide](https://google.github.io/benchmark/user_guide.html) | Timing/repetition controls, preventing optimization, statistics, context and random interleaving. | Official project documentation. Framework facilities do not choose the appropriate workload or statistical model. |
| [LLNL parallel computing tutorial](https://hpc.llnl.gov/documentation/tutorials/introduction-parallel-computing-tutorial) | Amdahl's Law, decomposition, communication, and granularity. | Official institutional teaching material, not labeled as a peer-reviewed paper. Fixed-workload speedup arithmetic assumes ideal division and explicitly stated overhead. |
| [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines), page dated 2026-06-14 | I.1/I.4/I.5/I.7/F.2 for explicit interfaces and focused functions; CP.20/CP.21/CP.22 for ownership of locks, multiple mutexes and callbacks under a lock. | Expert guidance maintained by its authors, not the ISO standard or a peer-reviewed experiment. Module-specific locators identify the applicable rules. |
| [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) | Input Validation Strategies, syntactic/semantic distinction, allowlists and bounds. | Expert security guidance. The lesson's authentication/authorization scenario is a separately explained application design, and validation is not a substitute for contextual safe APIs. |
| [NIST SP 800-218, SSDF 1.1](https://csrc.nist.gov/pubs/sp/800/218/final), February 2022 | Publication overview and abstract on integrating security practices into development. | Official NIST guidance. Only the overview/abstract was inspected; no uninspected numbered SSDF practices are claimed or quoted. |
| [MITRE CWE-400](https://cwe.mitre.org/data/definitions/400.html), CWE 4.20 | Description, consequences and potential mitigations for uncontrolled resource consumption. | Official weakness reference and mitigation guidance. Example budgets are invented application limits, not standards-mandated values. |

## Verification and scope

- `npm run content:check` passed after all 22 supporting modules were written, using the repository's schema and semantic validation.
- All supporting modules have exactly three parts, nonempty objectives, worked text traces, reflection explanations, and module-specific source IDs. Prose totals are 374–411 words per module, excluding code/trace text, headings, objectives, and citations.
- Worked arithmetic, ring-buffer positions, binary-search intervals, cache hit/miss traces, Unicode bytes, JSON fixtures, and example budget calculations were checked. Numerical decimal models were recomputed with their stated precision.
- No supporting module contains executable C++ or shell snippets. The traces are explicitly labeled as models or illustrations. There are therefore no supporting C++ examples needing compiler QA.
- No benchmarks, fuzz campaigns, external imports, release builds, or security experiments are claimed to have been run. Suggested exercises describe future learner activity. Source and content checks establish structure and reviewed explanations, not universal correctness of software learners may later implement.
