# C++ core curriculum research ledger

Authored and checked 2026-09-11. Scope: the eleven core subunits at sibling positions 1–11, two lessons each. Existing C++ root metadata and Basics are preserved. The examples target hosted C++20 and contain only deterministic local computation and standard output. C++23 expected and print are discussed only as later-standard facilities, never used in the C++20 programs.

Language and library semantics were verified by opening the linked section pages of the fixed C++20 working draft N4861. This draft is the baseline, rather than the evolving latest working draft. Section identifiers are normative-style draft locators; explanatory notes and examples remain informative. The draft specifies behavior, not a particular compiler’s diagnostics or implementation strategy. All lesson exposition and runnable examples are original.

The C++ Core Guidelines page was also consulted as design guidance (RAII and the Rule of Zero), not as a normative language specification. Its June 14, 2026 version was accessed on 2026-09-11. The final lessons cite R.1 for RAII and C.20 for the Rule of Zero, while independently explaining the language and owning-member mechanisms; the guidelines do not impose an additional language rule.

GCC documentation supports the description of compilation stages and -c only. It does not establish universal compiler command syntax. Compiler output checks establish the observed behavior of the supplied examples, not universal absence of defects in all future inputs.


## Lesson-to-source audit

Each source ID is module-specific and globally unique. URLs may recur when multiple lessons require the same rule. No private source paths or copied book excerpts are published.

### Initialize values and read deduced types

- Content: `content/units/cpp/types-initialization/01-initialization-and-deduction.json`
- Original explanatory words (paragraphs plus reflection): 451
- Primary standards draft: [C++20 working draft N4861: dcl.init](https://timsong-cpp.github.io/cppwp/n4861/dcl.init) — N4861, [dcl.init]; consulted 2026-09-11. Default initialization, value initialization, and initialization contexts.
- Primary standards draft: [C++20 working draft N4861: dcl.init.list](https://timsong-cpp.github.io/cppwp/n4861/dcl.init.list) — N4861, [dcl.init.list]; consulted 2026-09-11. List initialization, initializer-list constructor selection, and narrowing conversions.
- Primary standards draft: [C++20 working draft N4861: dcl.spec.auto](https://timsong-cpp.github.io/cppwp/n4861/dcl.spec.auto) — N4861, [dcl.spec.auto]; consulted 2026-09-11. Placeholder type deduction from initializers.
- Primary standards draft: [C++20 working draft N4861: vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity) — N4861, [vector.capacity]; consulted 2026-09-11. size versus capacity; reserve and invalidation on reallocation.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Conversions and domain types

- Content: `content/units/cpp/types-initialization/02-conversions-and-domain-types.json`
- Original explanatory words (paragraphs plus reflection): 445
- Primary standards draft: [C++20 working draft N4861: conv.integral](https://timsong-cpp.github.io/cppwp/n4861/conv.integral) — N4861, [conv.integral]; consulted 2026-09-11. Integral conversions and representable destination values.
- Primary standards draft: [C++20 working draft N4861: dcl.enum](https://timsong-cpp.github.io/cppwp/n4861/dcl.enum) — N4861, [dcl.enum]; consulted 2026-09-11. Scoped enumeration types and underlying types.
- Primary standards draft: [C++20 working draft N4861: dcl.typedef](https://timsong-cpp.github.io/cppwp/n4861/dcl.typedef) — N4861, [dcl.typedef]; consulted 2026-09-11. An alias declaration does not introduce a distinct type.
- Primary standards draft: [C++20 working draft N4861: conv.fpint](https://timsong-cpp.github.io/cppwp/n4861/conv.fpint) — N4861, [conv.fpint]; consulted 2026-09-11. Floating-integral conversion, truncation, and representability requirements.
- Primary standards draft: [C++20 working draft N4861: expr.mul](https://timsong-cpp.github.io/cppwp/n4861/expr.mul) — N4861, [expr.mul]; consulted 2026-09-11. Usual arithmetic conversions and integer division truncation.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Parameters, results, and borrowing

- Content: `content/units/cpp/functions-interfaces/01-parameters-and-results.json`
- Original explanatory words (paragraphs plus reflection): 446
- Primary standards draft: [C++20 working draft N4861: expr.call](https://timsong-cpp.github.io/cppwp/n4861/expr.call) — N4861, [expr.call]; consulted 2026-09-11. Parameter initialization and function calls.
- Primary standards draft: [C++20 working draft N4861: dcl.init.ref](https://timsong-cpp.github.io/cppwp/n4861/dcl.init.ref) — N4861, [dcl.init.ref]; consulted 2026-09-11. Reference initialization and assignment through a reference.
- Primary standards draft: [C++20 working draft N4861: basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life) — N4861, [basic.life]; consulted 2026-09-11. Object lifetime begins and ends; access outside lifetime is restricted.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Overloads and local callable objects

- Content: `content/units/cpp/functions-interfaces/02-overloads-and-lambdas.json`
- Original explanatory words (paragraphs plus reflection): 468
- Primary standards draft: [C++20 working draft N4861: over.ics.rank](https://timsong-cpp.github.io/cppwp/n4861/over.ics.rank) — N4861, [over.ics.rank]; consulted 2026-09-11. Ranking exact matches, promotions, and other conversions.
- Primary standards draft: [C++20 working draft N4861: expr.prim.lambda.capture](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.lambda.capture) — N4861, [expr.prim.lambda.capture]; consulted 2026-09-11. Value and reference captures and their relationship to object lifetime.
- Primary standards draft: [C++20 working draft N4861: dcl.spec.auto](https://timsong-cpp.github.io/cppwp/n4861/dcl.spec.auto) — N4861, [dcl.spec.auto]; consulted 2026-09-11. Placeholder type deduction from initializers.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Owners, borrowers, and scope

- Content: `content/units/cpp/lifetime-ownership/01-owners-and-borrowers.json`
- Original explanatory words (paragraphs plus reflection): 438
- Primary standards draft: [C++20 working draft N4861: basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life) — N4861, [basic.life]; consulted 2026-09-11. Object lifetime begins and ends; access outside lifetime is restricted.
- Primary standards draft: [C++20 working draft N4861: span.overview](https://timsong-cpp.github.io/cppwp/n4861/span.overview) — N4861, [span.overview]; consulted 2026-09-11. span is a view of contiguous objects owned elsewhere.
- Primary standards draft: [C++20 working draft N4861: string.view.template](https://timsong-cpp.github.io/cppwp/n4861/string.view.template) — N4861, [string.view.template], string_view represents borrowed constant character access; invalidation follows underlying pointers; consulted 2026-09-11.
- Primary standards draft: [C++20 working draft N4861: vector.modifiers](https://timsong-cpp.github.io/cppwp/n4861/vector.modifiers) — N4861, [vector.modifiers]; consulted 2026-09-11. Insertion and erase invalidation requirements.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### RAII and exclusive ownership

- Content: `content/units/cpp/lifetime-ownership/02-raii-and-unique-ownership.json`
- Original explanatory words (paragraphs plus reflection): 439
- Primary standards draft: [C++20 working draft N4861: class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor) — N4861, [class.dtor]; consulted 2026-09-11. Implicit destructor invocation and reverse destruction order.
- Primary standards draft: [C++20 working draft N4861: unique.ptr](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr) — N4861, [unique.ptr]; consulted 2026-09-11. Exclusive ownership and move-only unique_ptr operations.
- Primary standards draft: [C++20 working draft N4861: forward](https://timsong-cpp.github.io/cppwp/n4861/forward) — N4861, [forward]; consulted 2026-09-11. std::move and std::forward are casts with specified reference results.
- Advisory design guidelines: [C++ Core Guidelines: R.1](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-raii) — R.1; page dated June 14, 2026; consulted 2026-09-11. Advisory guidance on RAII or the Rule of Zero, distinct from normative C++ language requirements.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Classes that maintain a useful invariant

- Content: `content/units/cpp/classes-value-semantics/01-invariants-and-operations.json`
- Original explanatory words (paragraphs plus reflection): 444
- Primary standards draft: [C++20 working draft N4861: class.base.init](https://timsong-cpp.github.io/cppwp/n4861/class.base.init) — N4861, [class.base.init]; consulted 2026-09-11. Member initialization order precedes the constructor body.
- Primary standards draft: [C++20 working draft N4861: class.ctor](https://timsong-cpp.github.io/cppwp/n4861/class.ctor) — N4861, [class.ctor], constructor declaration and initialization of class objects; consulted 2026-09-11.
- Primary standards draft: [C++20 working draft N4861: class.copy.ctor](https://timsong-cpp.github.io/cppwp/n4861/class.copy.ctor) — N4861, [class.copy.ctor]; consulted 2026-09-11. Implicit memberwise copy/move and special-member declaration conditions.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Copying, moving, and comparing values

- Content: `content/units/cpp/classes-value-semantics/02-copy-move-and-comparison.json`
- Original explanatory words (paragraphs plus reflection): 443
- Primary standards draft: [C++20 working draft N4861: class.copy.ctor](https://timsong-cpp.github.io/cppwp/n4861/class.copy.ctor) — N4861, [class.copy.ctor]; consulted 2026-09-11. Implicit memberwise copy/move and special-member declaration conditions.
- Primary standards draft: [C++20 working draft N4861: class.copy.assign](https://timsong-cpp.github.io/cppwp/n4861/class.copy.assign) — N4861, [class.copy.assign]; consulted 2026-09-11. Memberwise copy/move assignment of bases and members.
- Primary standards draft: [C++20 working draft N4861: class.compare.default](https://timsong-cpp.github.io/cppwp/n4861/class.compare.default) — N4861, [class.compare.default]; consulted 2026-09-11. C++20 defaulted comparison declarations and restrictions.
- Primary standards draft: [C++20 working draft N4861: forward](https://timsong-cpp.github.io/cppwp/n4861/forward) — N4861, [forward]; consulted 2026-09-11. std::move and std::forward are casts with specified reference results.
- Primary standards draft: [C++20 working draft N4861: lib.types.movedfrom](https://timsong-cpp.github.io/cppwp/n4861/lib.types.movedfrom) — N4861, [lib.types.movedfrom]; consulted 2026-09-11. Valid but unspecified states of moved-from standard-library objects.
- Advisory design guidelines: [C++ Core Guidelines: C.20](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-zero) — C.20; page dated June 14, 2026; consulted 2026-09-11. Advisory guidance on RAII or the Rule of Zero, distinct from normative C++ language requirements.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Sequence containers and invalidation

- Content: `content/units/cpp/library-data-containers/01-sequences-and-invalidation.json`
- Original explanatory words (paragraphs plus reflection): 430
- Primary standards draft: [C++20 working draft N4861: vector.overview](https://timsong-cpp.github.io/cppwp/n4861/vector.overview) — N4861, [vector.overview]; consulted 2026-09-11. Storage management and operation complexity.
- Primary standards draft: [C++20 working draft N4861: vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity) — N4861, [vector.capacity]; consulted 2026-09-11. size versus capacity; reserve and invalidation on reallocation.
- Primary standards draft: [C++20 working draft N4861: vector.modifiers](https://timsong-cpp.github.io/cppwp/n4861/vector.modifiers) — N4861, [vector.modifiers]; consulted 2026-09-11. Insertion and erase invalidation requirements.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Keys, records, and alternative values

- Content: `content/units/cpp/library-data-containers/02-keys-and-vocabulary-types.json`
- Original explanatory words (paragraphs plus reflection): 446
- Primary standards draft: [C++20 working draft N4861: associative.reqmts](https://timsong-cpp.github.io/cppwp/n4861/associative.reqmts) — N4861, [associative.reqmts]; consulted 2026-09-11. Unique keys, comparison ordering, and operation complexity.
- Primary standards draft: [C++20 working draft N4861: variant](https://timsong-cpp.github.io/cppwp/n4861/variant) — N4861, [variant]; consulted 2026-09-11. A variant manages a value of one of its declared alternative types.
- Primary standards draft: [C++20 working draft N4861: dcl.struct.bind](https://timsong-cpp.github.io/cppwp/n4861/dcl.struct.bind) — N4861, [dcl.struct.bind], structured binding of tuple-like values, hidden object, and reference qualification; consulted 2026-09-11.
- Primary standards draft: [C++20 working draft N4861: map.access](https://timsong-cpp.github.io/cppwp/n4861/map.access) — N4861, [map.access]; consulted 2026-09-11. map indexing delegates to try_emplace; at reports missing keys.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Algorithms and half-open ranges

- Content: `content/units/cpp/iterators-algorithms-ranges/01-algorithms-and-half-open-ranges.json`
- Original explanatory words (paragraphs plus reflection): 445
- Primary standards draft: [C++20 working draft N4861: iterator.requirements.general](https://timsong-cpp.github.io/cppwp/n4861/iterator.requirements.general) — N4861, [iterator.requirements.general]; consulted 2026-09-11. Half-open ranges, sentinels, and dereferenceability.
- Primary standards draft: [C++20 working draft N4861: alg.find](https://timsong-cpp.github.io/cppwp/n4861/alg.find) — N4861, [alg.find]; consulted 2026-09-11. Search returns the first match or the end iterator.
- Primary standards draft: [C++20 working draft N4861: alg.sorting](https://timsong-cpp.github.io/cppwp/n4861/alg.sorting) — N4861, [alg.sorting]; consulted 2026-09-11. Ordering requirements and sorting complexity.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Lazy range pipelines

- Content: `content/units/cpp/iterators-algorithms-ranges/02-lazy-range-pipelines.json`
- Original explanatory words (paragraphs plus reflection): 440
- Primary standards draft: [C++20 working draft N4861: range.filter](https://timsong-cpp.github.io/cppwp/n4861/range.filter) — N4861, [range.filter]; consulted 2026-09-11. Predicate filtering and iteration behavior.
- Primary standards draft: [C++20 working draft N4861: range.transform](https://timsong-cpp.github.io/cppwp/n4861/range.transform) — N4861, [range.transform]; consulted 2026-09-11. Transformation of elements through a view.
- Primary standards draft: [C++20 working draft N4861: iterator.requirements.general](https://timsong-cpp.github.io/cppwp/n4861/iterator.requirements.general) — N4861, [iterator.requirements.general]; consulted 2026-09-11. Half-open ranges, sentinels, and dereferenceability.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Optional results and complete parsing

- Content: `content/units/cpp/error-handling/01-optional-results-and-parsing.json`
- Original explanatory words (paragraphs plus reflection): 420
- Primary standards draft: [C++20 working draft N4861: optional](https://timsong-cpp.github.io/cppwp/n4861/optional) — N4861, [optional], optional owns storage for a contained value and tracks its initialization state; consulted 2026-09-11.
- Primary standards draft: [C++20 working draft N4861: optional.observe](https://timsong-cpp.github.io/cppwp/n4861/optional.observe) — N4861, [optional.observe]; consulted 2026-09-11. Engagement tests, dereference preconditions, and value access.
- Primary standards draft: [C++20 working draft N4861: charconv.from.chars](https://timsong-cpp.github.io/cppwp/n4861/charconv.from.chars) — N4861, [charconv.from.chars]; consulted 2026-09-11. Error codes, the stopping pointer, and integer conversion behavior.
- Primary standards draft: [C++23 working draft N4950: expected](https://timsong-cpp.github.io/cppwp/n4950/expected) — N4950, [expected]; consulted 2026-09-11. Supports the explicitly marked C++23 facility discussion only; not used in the C++20 program.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Exceptions and state guarantees

- Content: `content/units/cpp/error-handling/02-exceptions-and-state-guarantees.json`
- Original explanatory words (paragraphs plus reflection): 436
- Primary standards draft: [C++20 working draft N4861: except.ctor](https://timsong-cpp.github.io/cppwp/n4861/except.ctor) — N4861, [except.ctor]; consulted 2026-09-11. Stack unwinding and destruction of constructed subobjects.
- Primary standards draft: [C++20 working draft N4861: except.spec](https://timsong-cpp.github.io/cppwp/n4861/except.spec) — N4861, [except.spec]; consulted 2026-09-11. Non-throwing exception specifications and termination.
- Primary standards draft: [C++20 working draft N4861: vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity) — N4861, [vector.capacity]; consulted 2026-09-11. size versus capacity; reserve and invalidation on reallocation.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Text streams and extraction state

- Content: `content/units/cpp/library-services/01-text-streams-and-extraction.json`
- Original explanatory words (paragraphs plus reflection): 443
- Primary standards draft: [C++20 working draft N4861: string.streams](https://timsong-cpp.github.io/cppwp/n4861/string.streams) — N4861, [string.streams]; consulted 2026-09-11. String-backed stream classes and their interfaces.
- Primary standards draft: [C++20 working draft N4861: istream.formatted.reqmts](https://timsong-cpp.github.io/cppwp/n4861/istream.formatted.reqmts) — N4861, [istream.formatted.reqmts]; consulted 2026-09-11. Formatted extraction and stream error state.
- Primary standards draft: [C++20 working draft N4861: istream.manip](https://timsong-cpp.github.io/cppwp/n4861/istream.manip) — N4861, [istream.manip], ws consumes whitespace and sets eofbit without failbit at exhausted input; consulted 2026-09-11.
- Primary standards draft: [C++23 working draft N4950: print.fun](https://timsong-cpp.github.io/cppwp/n4950/print.fun) — N4950, [print.fun]; consulted 2026-09-11. Supports the explicitly marked C++23 facility discussion only; not used in the C++20 program.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Time durations and filesystem paths

- Content: `content/units/cpp/library-services/02-time-and-path-values.json`
- Original explanatory words (paragraphs plus reflection): 425
- Primary standards draft: [C++20 working draft N4861: time.duration](https://timsong-cpp.github.io/cppwp/n4861/time.duration) — N4861, [time.duration]; consulted 2026-09-11. Typed tick counts, periods, and duration conversion.
- Primary standards draft: [C++20 working draft N4861: fs.path.gen](https://timsong-cpp.github.io/cppwp/n4861/fs.path.gen) — N4861, [fs.path.gen]; consulted 2026-09-11. Lexical path normalization without filesystem traversal.
- Primary standards draft: [C++20 working draft N4861: fs.path.generic](https://timsong-cpp.github.io/cppwp/n4861/fs.path.generic) — N4861, [fs.path.generic]; consulted 2026-09-11. Generic path syntax and platform-dependent filename rules.
- Primary standards draft: [C++20 working draft N4861: time.clock.steady](https://timsong-cpp.github.io/cppwp/n4861/time.clock.steady) — N4861, [time.clock.steady]; consulted 2026-09-11. Monotonic time_point values and a steady rate.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Templates as families of typed operations

- Content: `content/units/cpp/templates-generic-programming/01-typed-families.json`
- Original explanatory words (paragraphs plus reflection): 457
- Primary standards draft: [C++20 working draft N4861: temp.param](https://timsong-cpp.github.io/cppwp/n4861/temp.param) — N4861, [temp.param]; consulted 2026-09-11. Type and non-type template parameters.
- Primary standards draft: [C++20 working draft N4861: temp.deduct.call](https://timsong-cpp.github.io/cppwp/n4861/temp.deduct.call) — N4861, [temp.deduct.call]; consulted 2026-09-11. Deduction of template arguments from call arguments.
- Primary standards draft: [C++20 working draft N4861: temp.inst](https://timsong-cpp.github.io/cppwp/n4861/temp.inst) — N4861, [temp.inst], implicit instantiation and required reachable definitions; consulted 2026-09-11.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Concepts and explicit requirements

- Content: `content/units/cpp/templates-generic-programming/02-concepts-and-requirements.json`
- Original explanatory words (paragraphs plus reflection): 428
- Primary standards draft: [C++20 working draft N4861: temp.constr](https://timsong-cpp.github.io/cppwp/n4861/temp.constr) — N4861, [temp.constr]; consulted 2026-09-11. Satisfaction of associated template constraints.
- Primary standards draft: [C++20 working draft N4861: expr.prim.req](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.req) — N4861, [expr.prim.req]; consulted 2026-09-11. Requires expressions and unevaluated requirements.
- Primary standards draft: [C++20 working draft N4861: concept.convertible](https://timsong-cpp.github.io/cppwp/n4861/concept.convertible) — N4861, [concept.convertible], explicit and implicit conversion requirements and equality of their results; consulted 2026-09-11.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Interfaces and virtual dispatch

- Content: `content/units/cpp/runtime-polymorphism/01-interfaces-and-overriding.json`
- Original explanatory words (paragraphs plus reflection): 436
- Primary standards draft: [C++20 working draft N4861: class.virtual](https://timsong-cpp.github.io/cppwp/n4861/class.virtual) — N4861, [class.virtual]; consulted 2026-09-11. Overriding, final overriders, and polymorphic class types.
- Primary standards draft: [C++20 working draft N4861: class.abstract](https://timsong-cpp.github.io/cppwp/n4861/class.abstract) — N4861, [class.abstract]; consulted 2026-09-11. Pure virtual functions and abstract classes.
- Primary standards draft: [C++20 working draft N4861: class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor) — N4861, [class.dtor]; consulted 2026-09-11. Implicit destructor invocation and reverse destruction order.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Owning a collection of implementations

- Content: `content/units/cpp/runtime-polymorphism/02-owning-polymorphic-objects.json`
- Original explanatory words (paragraphs plus reflection): 429
- Primary standards draft: [C++20 working draft N4861: unique.ptr](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr) — N4861, [unique.ptr]; consulted 2026-09-11. Exclusive ownership and move-only unique_ptr operations.
- Primary standards draft: [C++20 working draft N4861: expr.dynamic.cast](https://timsong-cpp.github.io/cppwp/n4861/expr.dynamic.cast) — N4861, [expr.dynamic.cast]; consulted 2026-09-11. Runtime casts; pointer-cast failure returns a null pointer.
- Primary standards draft: [C++20 working draft N4861: class.virtual](https://timsong-cpp.github.io/cppwp/n4861/class.virtual) — N4861, [class.virtual]; consulted 2026-09-11. Overriding, final overriders, and polymorphic class types.
- Primary standards draft: [C++20 working draft N4861: class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor) — N4861, [class.dtor]; consulted 2026-09-11. Implicit destructor invocation and reverse destruction order.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Declarations, definitions, and linkage

- Content: `content/units/cpp/program-organization/01-declarations-and-linkage.json`
- Original explanatory words (paragraphs plus reflection): 445
- Primary standards draft: [C++20 working draft N4861: basic.def.odr](https://timsong-cpp.github.io/cppwp/n4861/basic.def.odr) — N4861, [basic.def.odr]; consulted 2026-09-11. Definitions within and across translation units.
- Primary standards draft: [C++20 working draft N4861: basic.link](https://timsong-cpp.github.io/cppwp/n4861/basic.link) — N4861, [basic.link]; consulted 2026-09-11. Internal, external, and module linkage.
- Primary standards draft: [C++20 working draft N4861: namespace.def](https://timsong-cpp.github.io/cppwp/n4861/namespace.def) — N4861, [namespace.def]; consulted 2026-09-11. Namespace definitions, extension, and nesting.
- Official compiler documentation: [GCC manual: Options Controlling the Kind of Output](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html) — GCC online manual, §3.2: compilation stages, -c, and output kinds; consulted 2026-09-11. Implementation documentation, not a C++ language requirement.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

### Headers, namespaces, and module boundaries

- Content: `content/units/cpp/program-organization/02-headers-and-modules.json`
- Original explanatory words (paragraphs plus reflection): 451, counted by whitespace
- Primary standards draft: [C++20 working draft N4861: cpp.include](https://timsong-cpp.github.io/cppwp/n4861/cpp.include) — N4861, [cpp.include]; consulted 2026-09-11. Header inclusion and implementation-defined search behavior.
- Primary standards draft: [C++20 working draft N4861: basic.def.odr](https://timsong-cpp.github.io/cppwp/n4861/basic.def.odr) — N4861, [basic.def.odr]; consulted 2026-09-11. Definitions within and across translation units.
- Primary standards draft: [C++20 working draft N4861: module.unit](https://timsong-cpp.github.io/cppwp/n4861/module.unit) — N4861, [module.unit]; consulted 2026-09-11. Module interface units, implementation units, and partitions.
- Primary standards draft: [C++20 working draft N4861: namespace.def](https://timsong-cpp.github.io/cppwp/n4861/namespace.def) — N4861, [namespace.def]; consulted 2026-09-11. Namespace definitions, extension, and nesting.
- Primary standards draft: [C++20 working draft N4861: dcl.inline](https://timsong-cpp.github.io/cppwp/n4861/dcl.inline) — N4861, [dcl.inline]; consulted 2026-09-11. Inline function and variable declarations and definition-domain rules.
- Primary standards draft: [C++20 working draft N4861: module.global.frag](https://timsong-cpp.github.io/cppwp/n4861/module.global.frag) — N4861, [module.global.frag], especially paragraph 6; consulted 2026-09-11. The exported module declaration may follow a global module fragment; final review corrected the lesson's opening-declaration wording.
- Limits: illustrative inputs are documented; examples do not claim exhaustive coverage of the cited section or generalize implementation-dependent output.

## Verification

- `npm run content:check -- cpp`: passed with 19 units, 41 modules, and 123 parts at the time of this check. This includes the unchanged Basics and the separately authored advanced subunits.
- `npm run content:test-examples -- cpp`: 46 complete C++ program blocks compiled and produced their exact expected standard output; zero failures.
- Compiler: `g++ (GCC) 16.2.1 20260819 (Red Hat 16.2.1-2)`.
- Compiler flags: `-std=c++20 -Wall -Wextra -Werror -pedantic-errors -pthread`.
- `clang++` is not installed in this environment, so no Clang result is claimed.
- All 22 owned core lessons have exactly three parts and 350–600 original explanatory words, excluding objectives and code. Every program includes its headers and main, uses deterministic sample data, and has an expected-output block captioned `Expected standard output`.
- C++23 expected and print descriptions were checked against pinned N4950 [expected] and [print.fun]; these facilities are excluded from all C++20 example programs.
- No database import or publication was performed by the core-content subtask.
