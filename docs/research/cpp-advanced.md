# Advanced C++ evidence ledger

Reviewed 2026-09-11. The lesson prose and worked examples are original. This ledger records the sources inspected to check their claims; it does not assert that the lessons themselves have undergone academic peer review.

## Source policy

N4861 is a pinned C++20 working draft. N4950 is a pinned C++23 working draft and is used only to identify later features mentioned in the prose. Both contain primary committee wording; neither is presented as a purchased published ISO edition. The Core Guidelines are expert recommendations, and the GNU ABI manual is toolchain-specific documentation. The Boehm–Adve PLDI paper is peer-reviewed historical research, not a replacement for C++20 rules.

For the paper, the abstract and introduction were inspected in the [SFU-hosted full-text copy](https://www.cs.sfu.ca/~ashriram/Courses/CS7ARCH/papers/boehm-pldi-2008.pdf); publication metadata was cross-checked against the [University of Illinois record](https://experts.illinois.edu/en/publications/foundations-of-the-c-concurrency-memory-model-2/). The lesson uses only the high-level rationale for language-level concurrency semantics, not claims about later memory-model revisions. No paper text or diagrams are reproduced.

## Lesson-to-evidence map

### Reading dependent names

Lesson: [dependent-names](../../content/units/cpp/advanced-templates/01-dependent-names.json).

- [C++20 working draft N4861: temp.res](https://timsong-cpp.github.io/cppwp/n4861/temp.res): Primary standards draft, [temp.res]: dependent type names and typename. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: temp.dep](https://timsong-cpp.github.io/cppwp/n4861/temp.dep): Primary standards draft, [temp.dep]: dependent names and dependent base classes. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: temp.names](https://timsong-cpp.github.io/cppwp/n4861/temp.names): Primary standards draft, [temp.names]: the template disambiguator. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.

### Forwarding arguments without changing their category

Lesson: [forwarding-arguments](../../content/units/cpp/advanced-templates/02-forwarding-arguments.json).

- [C++20 working draft N4861: temp.deduct.call](https://timsong-cpp.github.io/cppwp/n4861/temp.deduct.call): Primary standards draft, [temp.deduct.call]: forwarding-reference deduction. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: forward](https://timsong-cpp.github.io/cppwp/n4861/forward): Primary standards draft, [forward]: std::forward and std::move return expressions. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life): Primary standards draft, [basic.life]: object and reference lifetime boundaries. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.

### Computing and checking constants

Lesson: [constant-evaluation](../../content/units/cpp/compile-time-programming/01-constant-evaluation.json).

- [C++20 working draft N4861: dcl.constexpr](https://timsong-cpp.github.io/cppwp/n4861/dcl.constexpr): Primary standards draft, [dcl.constexpr]: constexpr variables and functions; immediate functions. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: expr.const](https://timsong-cpp.github.io/cppwp/n4861/expr.const): Primary standards draft, [expr.const]: constant expression requirements and disallowed evaluated operations. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: dcl.constinit](https://timsong-cpp.github.io/cppwp/n4861/dcl.constinit): Primary standards draft, [dcl.constinit]: static initialization without implied const qualification. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.

### Selecting an implementation with if constexpr

Lesson: [type-directed-branches](../../content/units/cpp/compile-time-programming/02-type-directed-branches.json).

- [C++20 working draft N4861: stmt.if](https://timsong-cpp.github.io/cppwp/n4861/stmt.if): Primary standards draft, [stmt.if]: discarded substatements during template instantiation. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: expr.prim.req](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.req): Primary standards draft, [expr.prim.req]: requires expressions. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: concept.convertible](https://timsong-cpp.github.io/cppwp/n4861/concept.convertible): Primary standards draft, [concept.convertible]: convertible_to constraints. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++ working draft N4950: stmt.if](https://timsong-cpp.github.io/cppwp/n4950/stmt.if): Primary standards draft: C++23 if consteval, paragraphs 4–6; edition boundary only. Consulted 2026-09-11; not the published ISO edition.

### Objects, storage, and representation

Lesson: [object-representations](../../content/units/cpp/object-model-memory/01-object-representations.json).

- [C++20 working draft N4861: basic.types](https://timsong-cpp.github.io/cppwp/n4861/basic.types): Primary standards draft, [basic.types]: trivially copyable byte round trips and representations. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life): Primary standards draft, [basic.life]: lifetime start and end conditions. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: bit.cast](https://timsong-cpp.github.io/cppwp/n4861/bit.cast): Primary standards draft, [bit.cast]: constraints and valid result representations. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.

### Give a memory resource an explicit lifetime

Lesson: [memory-resource-lifetimes](../../content/units/cpp/object-model-memory/02-memory-resource-lifetimes.json).

- [C++20 working draft N4861: mem.res.monotonic.buffer](https://timsong-cpp.github.io/cppwp/n4861/mem.res.monotonic.buffer): Primary standards draft, [mem.res.monotonic.buffer]: allocation, deallocation, release, and synchronization limits. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: mem.poly.allocator.class](https://timsong-cpp.github.io/cppwp/n4861/mem.poly.allocator.class): Primary standards draft, [mem.poly.allocator.class]: polymorphic allocator resource relationship. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity): Primary standards draft, [vector.capacity]: reserve and invalidation. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.

### Own threads and protect shared state

Lesson: [scoped-threads-locks](../../content/units/cpp/concurrency-cpp/01-scoped-threads-locks.json).

- [C++20 working draft N4861: thread.jthread.class](https://timsong-cpp.github.io/cppwp/n4861/thread.jthread.class): Primary standards draft, [thread.jthread.class]: thread ownership, cooperative stop requests, and joining. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: thread.lock.guard](https://timsong-cpp.github.io/cppwp/n4861/thread.lock.guard): Primary standards draft, [thread.lock.guard]: scope-based lock ownership. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: intro.races](https://timsong-cpp.github.io/cppwp/n4861/intro.races): Primary standards draft, [intro.races]: conflicting accesses and data races. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [Foundations of the C++ Concurrency Memory Model](https://doi.org/10.1145/1375581.1375591): Peer-reviewed PLDI 2008 paper, pp. 68–78; abstract and introduction inspected in the SFU-hosted full-text copy. Historical rationale for language-level race semantics, not the C++20 specification; consulted 2026-09-11

### Publish a result with release and acquire

Lesson: [atomic-publication](../../content/units/cpp/concurrency-cpp/02-atomic-publication.json).

- [C++20 working draft N4861: atomics.order](https://timsong-cpp.github.io/cppwp/n4861/atomics.order): Primary standards draft, [atomics.order]: release/acquire synchronization and relaxed ordering. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: atomics.wait](https://timsong-cpp.github.io/cppwp/n4861/atomics.wait): Primary standards draft, [atomics.wait]: value checks, notification, and transient changes. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: intro.races](https://timsong-cpp.github.io/cppwp/n4861/intro.races): Primary standards draft, [intro.races]: happens-before and non-atomic accesses. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++ working draft N4861: atomics.types.operations](https://timsong-cpp.github.io/cppwp/n4861/atomics.types.operations): Primary standards draft: atomic::wait effects and notify_one; paragraphs 29–33. Consulted 2026-09-11; not the published ISO edition.

### Trace a coroutine’s suspension points

Lesson: [coroutine-suspension](../../content/units/cpp/coroutines-async/01-coroutine-suspension.json).

- [C++20 working draft N4861: dcl.fct.def.coroutine](https://timsong-cpp.github.io/cppwp/n4861/dcl.fct.def.coroutine): Primary standards draft, [dcl.fct.def.coroutine]: promise interface, initial and final suspension. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: expr.await](https://timsong-cpp.github.io/cppwp/n4861/expr.await): Primary standards draft, [expr.await]: awaiter protocol. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: coroutine.handle.resumption](https://timsong-cpp.github.io/cppwp/n4861/coroutine.handle.resumption): Primary standards draft, [coroutine.handle.resumption]: resume/destroy preconditions and thread identity. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.

### Keep coroutine inputs alive across suspension

Lesson: [coroutine-lifetimes](../../content/units/cpp/coroutines-async/02-coroutine-lifetimes.json).

- [C++20 working draft N4861: dcl.fct.def.coroutine](https://timsong-cpp.github.io/cppwp/n4861/dcl.fct.def.coroutine): Primary standards draft, [dcl.fct.def.coroutine]: parameter copies and coroutine state destruction. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life): Primary standards draft, [basic.life]: reference and object lifetime. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: coroutine.handle.resumption](https://timsong-cpp.github.io/cppwp/n4861/coroutine.handle.resumption): Primary standards draft, [coroutine.handle.resumption]: destruction requires a suspended coroutine. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++ working draft N4950: coro.generator](https://timsong-cpp.github.io/cppwp/n4950/coro.generator): Primary standards draft: C++23 generator overview; later-library distinction only. Consulted 2026-09-11; not the published ISO edition.

### Separate a public interface from its implementation

Lesson: [implementation-boundaries](../../content/units/cpp/library-engineering/01-implementation-boundaries.json).

- [C++ Core Guidelines: I.27, consider Pimpl for a stable library ABI](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Ri-pimpl): Expert guidance, I.27; an idiom with allocation/indirection tradeoffs, not normative language wording; consulted 2026-09-11
- [GNU libstdc++ ABI Policy and Guidelines](https://gcc.gnu.org/onlinedocs/libstdc++/manual/abi.html): Official toolchain documentation, ABI definition and compatibility policy; GNU-specific scope; consulted 2026-09-11
- [C++20 working draft N4861: unique.ptr.single.dtor](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr.single.dtor): Primary standards draft, [unique.ptr.single.dtor]: unique_ptr destructor and deleter requirements. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: unique.ptr.dltr.dflt](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr.dltr.dflt): Primary standards draft, [unique.ptr.dltr.dflt]: default deletion requires a complete type. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.

### Declare and check a library’s feature baseline

Lesson: [feature-compatibility](../../content/units/cpp/library-engineering/02-feature-compatibility.json).

- [C++20 working draft N4861: version.syn](https://timsong-cpp.github.io/cppwp/n4861/version.syn): Primary standards draft, [version.syn]: feature-test macro definitions, including __cpp_lib_span. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [C++20 working draft N4861: views.span](https://timsong-cpp.github.io/cppwp/n4861/views.span): Primary standards draft, [views.span]: non-owning views over contiguous objects. Pinned N4861 text; consulted 2026-09-11. Draft wording is not the published ISO edition.
- [GNU libstdc++ ABI Policy and Guidelines](https://gcc.gnu.org/onlinedocs/libstdc++/manual/abi.html): Official toolchain documentation; distinction between API and ABI and compatibility inputs; consulted 2026-09-11
- [C++ working draft N4950: expected](https://timsong-cpp.github.io/cppwp/n4950/expected): Primary standards draft: C++23 expected objects and header synopsis; minimum-edition distinction. Consulted 2026-09-11; not the published ISO edition.

## Verification and limits

The 12 complete advanced C++ examples compiled and ran with GCC 16.2.1 in C++20 mode using `-Wall -Wextra -Werror -pedantic-errors -pthread`. Their standard output matched the authored output. Run `npm run content:test-examples -- cpp` to repeat this check, including the core and Basics examples. Successful runs do not prove absence of undefined behavior for arbitrary inputs or correctness under every concurrency schedule. The examples use finite safe values, explicit ownership, and the source-backed synchronization arguments described in the lessons.

No hardware performance claims, cross-compiler ABI experiments, cancellation-runtime guarantees, or universal compiler-support claims are inferred from these executions. The coroutine owner is a deliberately restricted single-thread teaching example.
