# Algorithm Analysis source ledger

Sources inspected and teaching authored on **2026-09-11**. This release develops the existing **Data Structures and Algorithms → Algorithm Analysis** unit into six modules; it does not add a subunit or claim complete coverage of algorithms. The [release review](../reviews/2026-09-11-algorithm-analysis.md) records execution, catalog, reader, and import QA. This ledger records the evidence behind the teaching, separately from those checks.

## Claim-to-module map

| Module | Main evidence and its use |
| --- | --- |
| Count the work in a search | CLRS §§1.1, 2.2, 3.1–3.2: problem instances, cost models, case dependence, and growth. NIST supports the search and upper-bound terminology. |
| Prove a loop correct | CLRS §§1.1 and 2.1: specification, correctness, initialization, maintenance, and termination. N4861 checks the displayed C++ control flow and index interface. The first-match contract and decreasing variant are developed explicitly for the original loop. |
| Describe growth with bounds | CLRS §§2.2, 3.1–3.3 and Appendix A.1: case functions, upper/lower/tight bounds, logarithms, and arithmetic sums. NIST checks upper-bound terminology; N4861 checks the range-for example. |
| Build and verify binary search | Stroustrup §32.6.1 and NIST: ordered search and boundary versus membership. N4861 supplies the exact library contract and iterator-cost distinction. The half-open invariant, progress argument, and exact custom comparison count are derived in the lesson. |
| Analyze insertion sort | CLRS §§2.1–2.2 and Appendix A.1–A.2: sorted-prefix reasoning, case-dependent counting, arithmetic sums, and bounds. Saved-key conservation, counters, labeled stability traces, and displacement reasoning are original applications. |
| Explain merge sort with a recurrence | CLRS §§2.3.1–2.3.2, 3.3, 4.3–4.4 and Appendix A.1–A.2: merging, recurrence construction, logarithms, substitution, recursion levels, and sums. Original examples distinguish comparisons, writes, full work, and peak auxiliary storage. |

## Textbooks: inspected passages and pagination

**Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, and Clifford Stein, _Introduction to Algorithms_, fourth edition, The MIT Press, 2022.** The [publisher page](https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/) was inspected for bibliographic metadata, including the eBook ISBN **9780262367509**; the URL's hardcover ISBN identifies a different format. The actual passages below were read in the available local digital book, not inferred from that publisher overview.

The consulted CLRS document is a **1,677-page reflowed PDF**. Its one-based PDF coordinates below are **not printed-book page numbers**, and no constant conversion to the print edition is claimed. Module citations use stable chapter and section names. Selected page images were also inspected where equations, figures, or proof structure required visual confirmation.

| CLRS passage | Inspected PDF coordinates | Supported teaching and visual checks |
| --- | --- | --- |
| §1.1, Algorithms | 28–29 | Instances, specifications, and correctness including termination; page 29 rendered and inspected. |
| §2.1, Insertion sort | 44–53 | Prefix invariant and its three proof stages, stable shifting, indexing, and short-circuit reasoning; pages 48–49 rendered and inspected. |
| §2.2, Analyzing algorithms | 53–64 | RAM assumptions, input size, operation counts, best/worst cases, and distribution-dependent average-case statements. |
| §§2.3.1–2.3.2 | 64–76 | Divide/conquer/combine, sorted-input merging, tails, unequal child sizes, recurrence setup, internal levels, and leaves; pages 74 and 76 rendered and inspected. |
| §§3.1–3.2 | 85–103 | Informal and formal asymptotic reasoning, fixed constants, thresholds, upper/lower/tight bounds; page 92 rendered and inspected. |
| §3.3, Logarithms | 107–108 | Domains, bases, and inverse relationships; page 108 rendered and inspected for the change-of-base equation. |
| §4.3, Substitution method | 138–144 | Explicit constants and base cases, inductive substitution, and strengthening a bound; pages 139 and 141 rendered and inspected. |
| §4.4, Recursion-tree method | 144–150 | Node/level work, height, leaf costs, and trees as guides to proofs. The later irregular-recurrence example is outside this teaching scope. |
| Appendix A.1 and A.2 | 1469–1473 and 1475–1478 | Arithmetic sums, induction, and upper/lower bounds; pages 1470–1471 rendered and inspected. No harmonic-series lesson is claimed. |

**Bjarne Stroustrup, _The C++ Programming Language_, fourth edition, Addison-Wesley, 2013, ISBN 9780321563842.** The [author's bibliographic page](https://www.stroustrup.com/4th.html) was inspected. This book has a **C++11 baseline**; it is supporting exposition, not the authority for newer language rules. In the consulted 1,366-page PDF, the inspected main-text pages have a verified offset of **PDF page = printed page + 15**.

| Stroustrup passage | Printed pages | PDF coordinates | Inspected support |
| --- | --- | --- | --- |
| §10.3.1 | 259 | 274 | Integer result types and finite arithmetic cautions. |
| §31.3 and §31.3.5 | 894–895; 900 | 909–910; 915 | Representation costs and valid indexed access. |
| §32.2.1 and §32.3.1 | 928; 931 | 943; 946 | Valid ranges, operation counting, and callable state. |
| §§32.6–32.6.2 | 943; 945–947 | 958; 960–962 | Sorting/stability context, first boundary versus membership, and sorted-input merging. |
| §§33.1.1–33.1.2 | 954–955 | 969–970 | Half-open ranges, past-end positions, and iterator categories. |

All Stroustrup PDF pages in this table were rendered and visually inspected. In particular, the missing-value explanation on printed page 946 was read along with the abbreviated binary-search table on page 945.

The old printing was checked critically: the growth table on printed page 895 contains an incorrect value for 128 squared; the correct value is 16,384. Its average-qualified `sort` complexity statement on page 943 was superseded for this teaching by N4861's comparison guarantee. Nearby page 901 prose about insertion results and deque storage was not used as current authority. Older evaluation-order examples near page 259 were also excluded. These observations are passage-specific checks, not an exhaustive errata audit.

## Standards and official references

The primary language baseline is the [C++20 working draft N4861](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf), dated 2020-04-01. It is **a working draft, not the published ISO edition**. Some clauses were inspected through the explicitly versioned [N4861 HTML rendering](https://timsong-cpp.github.io/cppwp/n4861/); its hosting does not change the source classification.

| Inspected N4861 clauses | Use and limits |
| --- | --- |
| `[stmt.while]/1`, `[stmt.return]/1–2` | Guard-before-body and return control flow. |
| `[support.types.layout]/3`, `[sequence.reqmts]` Table 78, `[vector.overview]`, `[dcl.ref]` | Unsigned size type, indexed access, vector representation, and reference interface. |
| `[stmt.ranged]`, `[support.initlist]` | Range-for and the initializer-list header used by the growth example. |
| §25.8.3 `[alg.binary.search]`; §25.8.3.1 `[lower.bound]` | Partition contract, boundary result, comparisons versus traversal; printed pp. 1100–1101, PDF pp. 1108–1109. |
| §23.3.4.13 `[iterator.concept.random.access]` | Constant-time jumps; printed p. 920, PDF p. 928. |
| §25.2 `[algorithms.requirements]` paragraph 10 | Callable copies and externally observed counter state. |
| §25.8.1.1 `[sort]`; §25.8.5 `[alg.merge]` | Comparison requirements, sorted merge inputs, and tie behavior; these check library claims, not exact counts for custom code. |
| §25.10.15 `[numeric.ops.midpoint]` | Optional integer midpoint alternative inspected; the lesson instead proves its chosen width-based formula. |

Paul E. Black's NIST Dictionary of Algorithms and Data Structures entries were read as **official reference documentation**: [big-O notation](https://xlinux.nist.gov/dads/HTML/bigOnotation.html), modified 2019-09-06, and [binary search](https://xlinux.nist.gov/dads/HTML/binarySearch.html), modified 2022-04-21. They support upper-bound terminology, model dependence, ordered interval halving, midpoint overflow awareness, and comparison/traversal distinctions. They are not benchmark studies or the normative C++ specification.

## Independently written teaching and evidence limits

These lessons contain independently written explanations and implementations of established algorithms and proof methods. “Original” describes the teaching exposition, worked examples, record labels, reflection answers, and hypothetical cost scenarios; it does not mean that Alexandria invented linear search, binary search, sorting, asymptotic notation, or their standard proof methods. The sources above credit those foundations. No book pages, source extracts, figures, or source exercise sets are included in the application. The [source-comparison review](../reviews/2026-09-11-algorithm-analysis-originality.md) records the checks for copied expression and distinctive examples. Textbook exposition and standard clauses are identified as such; no claim of external peer review of these lessons is made.

The binary search counts only its value-to-target comparison. Its exact worst-case count, zero for empty input and `floor(log2 n)+1` otherwise, follows from the displayed updates and an attainable all-left path; it is not an exact-count promise from `std::lower_bound`. Insertion-sort counters distinguish comparisons, shifts, and final writes. Merge-sort analysis includes tail copying and leaf work even when few comparisons occur. Fixed-cost assumptions and input domains accompany growth claims.

The merge recurrence with chosen coefficients and the search-versus-preparation crossover scenarios are explicit mathematical models, not timings or machine-instruction measurements. Average-case reasoning requires a stated distribution. Power-of-two recurrence equalities are not transferred unchanged to odd sizes. Small exhaustive checks support implementation behavior on their bounded domains; invariant and recurrence arguments carry the general reasoning. Compiler checks do not establish optimality, complete input coverage, or performance on other platforms.

The six modules leave amortized analysis, hashing, balanced trees, external-memory models, advanced recurrence methods, and empirical benchmarking for later work. Consult the [release review](../reviews/2026-09-11-algorithm-analysis.md) for the actual validation results, publication status, and execution limitations.
