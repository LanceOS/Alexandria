# Abstract Data Types: inspected sources and teaching design

Date: 2026-09-11. Scope: the six modules in `content/units/data-structures-algorithms/abstract-data-types/`. This follows the [depth standard](../../notes/curriculum-depth.md), [evidence policy](../curriculum-evidence.md), and the preceding [Algorithm Analysis study](algorithm-analysis.md). The [release review](../reviews/2026-09-11-abstract-data-types.md) records verification and the comparison for direct copying.

## Unit design

The learning path develops a bounded FIFO contract, LIFO undo, dynamic array growth, linked ownership, a queue composed from stacks, and a final contract-verification exercise. Each module has three developed parts, two explained reflections per part, objectives, prerequisites, worked and contrasting cases, and one complete C++20 program with exact expected output. The final checker deliberately reuses the first lesson's independently authored ring implementation so learners can connect a representation argument with an independent sequence model.

| Module | Source-supported foundation | Independently developed teaching application |
| --- | --- | --- |
| Design a bounded queue from its contract | FIFO, abstract values, ring representations, fixed-size array and queue-adapter semantics | Count-based ring using all slots, overflow-safe mapping, failure-preserved output, duplicate/wraparound trace, integer-only implementation |
| Model a stack and undo | LIFO, stack representation, adapter observations versus void removal | Three-snapshot marker editor, invalid/no-op/full priority, predecessor restoration, grouped-change failure, snapshot/inverse cost model |
| Explain dynamic array growth | Dynamic tables, geometric aggregate bound, vector capacity and invalidation rules | Capacity-and-cost simulator starting at three with maximum 24, independently worked write totals, spare storage versus live elements |
| Reason about linked storage | Linked traversal and endpoint operations, exclusive ownership | Bounded integer queue with owned chain and borrowed tail, allocate-before-link failure behavior, iterative cleanup, safe symbolic unlink diagnostics |
| Build a queue from two stacks | Classic two-stack queue and amortized per-item counting | Distinct public and transfer invariants, reserve-before-transfer guarantee, mixed batches, absence separate from integer values |
| Verify a collection contract | Model-based stateful testing, abstract operations and operation-count reasoning | Finite four-command enumeration, deque oracle, full ordered-state comparison, packed-array versus ring storage-write model |

“Independently developed” describes the teaching exposition, code, and scenarios. FIFO, stacks, ring buffers, dynamic arrays, linked queues, two-stack queues, invariant proofs, and model-based testing are established material attributed to their sources.

## Books inspected

### Introduction to Algorithms, fourth edition

Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, and Clifford Stein; The MIT Press, 2022. The inspected e-book has ISBN 9780262367509. [Publisher edition page](https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/). Bibliographic identity was verified during the preceding unit study and reused here.

The local reflowed PDF has 1,677 pages. Coordinates below are one-based PDF positions, **not printed-page claims**. Module references use stable chapter and section locators as well.

- Part III introduction, PDF 340: dynamic sets and choosing representations from operations.
- §10.1.3, PDF 346–351: stacks and queues, array representation, full/empty behavior, FIFO/LIFO, and neighboring exercises. Rendered and inspected PDF 347–350. The source queue reserves a physical slot; our count-based ring uses every slot. That difference is explained, not hidden by reusing incompatible formulas.
- §10.2, PDF 352–359: linked forms, search versus known-position modification, predecessors, endpoints, sentinels, and exercises. Rendered PDF 352 and 355. Exercise 10.2-3 identifies linked queues as an established construction; we do not reuse the exercise as a new assignment.
- Chapter 16 introduction and §16.1, PDF 593–596: aggregate analysis without a probability distribution, with per-item stack counting. Source metaphors, MULTIPOP examples, and figures are not reproduced.
- Exercise 10.1-7 at PDF 351 and Exercise 16.3-5 at PDF 608: explicit attribution for the known two-stack queue and its amortized analysis.
- §16.4 and §16.4.1, PDF 608–611: dynamic-table expansion and geometric copy totals. PDF 611 was rendered to inspect the mathematical expression missing from text extraction.
- §16.4.2, PDF 615–622: inspected for the boundary with contraction. Shrink policies are identified as further work, not taught or claimed correct by our append-only simulator.

### The C++ Programming Language, fourth edition

Bjarne Stroustrup; Addison-Wesley, 2013; ISBN 9780321563842. [Author's edition page](https://www.stroustrup.com/4th.html). The book describes a C++11 baseline; current lesson examples target C++20 and exact language/library rules were checked separately.

- §31.2.1, printed 888–890 / PDF 903–905: vector representation and allocation context. The capacity parenthetical on printed 888 is misleading if read as unused slots; N4861 was used to verify that capacity is the total element-holding capacity, with spare capacity equal to capacity minus size.
- §31.5–§31.5.2, printed 920–923 / PDF 935–938: adapters, stack and queue interfaces, and separating observation from void removal. Relevant stack/queue pages were rendered. The lesson does not borrow the book's concurrent queue example or promote its simplified resource/performance statements to guarantees.
- §31.4.2, printed 906–908 / PDF 921–923: linked traversal and predecessor requirements.
- §34.3–§34.3.1, printed 986–990 / PDF 1001–1005: exclusive resource management and ownership transfer. PDF 1002 and 1005 were rendered. The historical absence of standard make_unique discussed in this C++11 book does not apply to our C++20 examples; the current facility was verified in N4861.

The inspected main-text mapping is PDF page = printed page + 15. Source books, extracted text, screenshots, and temporary verification programs stay outside the repository.

## Primary terminology and C++ rules

[NIST queue](https://xlinux.nist.gov/dads/HTML/queue.html), [abstract data type](https://xlinux.nist.gov/dads/HTML/abstractDataType.html), and the existing [big-O reference](https://xlinux.nist.gov/dads/HTML/bigOnotation.html) support terminology. Queue and ADT entries were read for this unit; the big-O entry was inspected in the preceding analysis work and remains a stable reference in the revised opening lesson. The fixed-capacity and failure policies are our stated choices, not part of the general FIFO definition.

The [N4861 C++20 working draft](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf) is identified as a draft, not the published ISO standard. Relevant wording was read in its [pinned HTML rendering](https://timsong-cpp.github.io/cppwp/n4861/); vector clauses were also cross-checked in the official PDF.

- [array.overview]: fixed size, element storage, and the distinction between a physical array size and a queue's logical count.
- [queue], [stack.defn], [sequence.reqmts], [structure.specifications], [deque.overview]: adapter defaults, front/back observations, void pop, and required nonempty states.
- [vector.overview], [vector.capacity], [vector.data], [vector.modifiers]: amortized end insertion, total capacity, live range, invalidation, reserve behavior, maximum size, and no-effects guarantees as applicable to int. The lessons do not claim mandatory vector doubling or a specified exact allocation count.
- [optional.ctor], [optional.observe]: absence, contained-int construction, presence checks, and dereference only when engaged. A contained zero is still present.
- [unique.ptr], [unique.ptr.single.ctor], [unique.ptr.single.asgn], [unique.ptr.single.dtor], [unique.ptr.single.observers], [unique.ptr.create], [new.delete.single]: exclusive ownership, borrowing, transfer, destruction, make_unique, and throwing allocation.
- [dcl.fct.def.delete]: explicitly excluded whole-object copy/move operations. [string.view.template], [string.view.cons], and [lex.string]: literal-label views in the undo example.

Integer-only exception arguments, overflow-safe ring indexing, workload counts, and ownership transitions are deductions about the displayed code under stated assumptions. They are not promises for arbitrary element types or concurrent use.

## Research supporting the final testing method

Koen Claessen and John Hughes, **Testing Monadic Code with QuickCheck**, 2002 Haskell Workshop / ACM. Publication identity and year were checked in the [Chalmers institutional record](https://research.chalmers.se/en/publication/170517) and [official workshop program](https://www.haskell.org/haskell-workshop/2002/index.html). The journal and proceedings versions have different pagination/DOIs; no unverified published page mapping is asserted.

Actual reading used an [author-manuscript mirror](https://blogs.asarkar.com/assets/docs/haskell/Monadic%20QuickCheck%20-%20Claessen%2BHughes.pdf). That PDF has an added cover followed by the manuscript; it is not asserted to be the final ACM typeset edition. Read §1 at PDF 2 and §5 at PDF 5, and inspected nearby §3–§4 at PDF 3–5 for comparison. PDF 5 was rendered because the text extraction loses some glyphs. The inspected support is for specifying stateful behavior using a simpler abstract model, comparing results and resulting abstract state, and reaching states through operations.

The paper's Haskell/QuickCheck implementations, algebraic equations, random generator, and diagrams are not reproduced. Our bounded C++ checker uses a four-command exhaustive generator, explicit empty/full outcomes, preserved output values, a deque model, and copy-and-drain observation for a value-semantic integer ring. It reports a finite checked domain; it does not claim formal proof or generalize a successful test to every input. This is a relevant research foundation, not an assertion that the new curriculum itself was peer reviewed.
