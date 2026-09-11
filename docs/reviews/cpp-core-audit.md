# C++ core curriculum accuracy and reference audit

Baseline: `99a387f9cdb8a58c65b9a8160f0059ed2a51bd27`. Consulted: 2026-09-11.

Reviewed all 22 core modules in the 11 assigned subunits, including objectives, every lesson block, all worked programs and expected outputs, reflections, and source metadata. Basics and the six advanced C++ subunits are outside this report. No lesson JSON or database was edited.

No unsafe worked example, incorrect C++20/C++23 scope claim, or high/medium-severity technical error was found. One general description needs a small qualification: `variant` can be valueless after some throwing modifications. Six reference deficiencies and three optional refinements are recorded below. The runnable examples and their stated finite assumptions are sound under the reviewed contracts.

## Evidence and method

This was a fresh semantic review against retrieved primary text, independent of earlier source ledgers and compiler success. All 83 citation instances were mapped to 69 distinct cited URLs (68 pages if Guidelines fragments are combined); relevant passages at all 69 were retrieved and read. Seventeen additional primary URLs were inspected for dependencies and bibliographic corroboration. The inventory specifies what was read rather than claiming every page of long sources was inspected.

The N4861 HTML pages are a frozen mirror of primary committee specification text, not the published ISO standard and not a promise to include all subsequent defect reports. The official N4861 PDF title page confirms the number and 2020 date. Both N4950 lesson passages are explicitly confined to later C++23 features. The official N4951 editor report independently identifies N4950 as the final C++23 working draft. Two attempts to open the supplementary official N4950 PDF timed out; its body is not counted as inspected. This did not prevent reading either source actually cited by these lessons.

The Guidelines page identifies Bjarne Stroustrup and Herb Sutter as editors and is dated June 14, 2026. Its recommendations are advisory. GCC pages describe an implementation. The 22 lessons do not advance a measured speedup, empirical learning result, or research comparison requiring a peer-reviewed paper. Syntax, library preconditions, and version scope are appropriately checked against the specification. General interface recommendations are pedagogical advice, not experimentally proven universal claims; no bibliography padding or uninspected paper is offered as evidence.

Programs were traced for initialized state, bounds, arithmetic range, sequencing, lifetime, ownership, invalidation, exception behavior, and exact output. They were not recompiled by this audit; root-level test work is separate. Statements such as possible allocation failure or implementation-specific capacity are assessed within each lesson’s stated scenario, not misreported as deterministic platform output.

## Proposed corrections and optional refinements

The structured report contains exact JSON pointers and full current/replacement strings. An `add` operation uses `current: null` because it appends a new reference; its complete source object is supplied. All proposals remain unapplied.

### CORE-001: Qualify variant’s one-alternative description

Classification: **technical precision**; priority: **low**.

The general description implies a variant always contains one alternative. The C++20 contract also permits no contained value after some throwing modifications. The const Reading sample is safe and its expected output is correct; the correction prevents a misleading general guarantee.

File: [content/units/cpp/library-data-containers/02-keys-and-vocabulary-types.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-data-containers/02-keys-and-vocabulary-types.json); JSON pointer `/parts/2/blocks/0/text`.

Current:

> A vocabulary type supplies a common relationship between values. pair and tuple group several values; a named struct can explain their roles more clearly when those roles matter. optional represents the presence or absence of a value. variant represents one value chosen from a declared set of alternative types. Here Reading stores either a page count or a textual status, keeping those two meanings distinguishable.

Replacement:

> A vocabulary type supplies a common relationship between values. pair and tuple group several values; a named struct can explain their roles more clearly when those roles matter. optional represents the presence or absence of a value. variant normally holds one value chosen from a declared set of alternative types. Certain throwing modifications can instead leave it valueless_by_exception, so generic handling must account for that possibility. Here Reading stores either a page count or a textual status, keeping those two meanings distinguishable.

Evidence: [variant#variant.variant-2](https://timsong-cpp.github.io/cppwp/n4861/variant#variant.variant-2), [variant#variant.status](https://timsong-cpp.github.io/cppwp/n4861/variant#variant.status).

### CORE-002: Cite the rule that defines defaulted equality’s result

Classification: **citation deficiency**; priority: **low**.

The existing [class.compare.default] citation correctly covers declarations, restrictions, and the list of subobjects, but the actual comparison algorithm used by the lesson and reflection is in [class.eq]/3. Add that passage without removing the relevant existing citation.

File: [content/units/cpp/classes-value-semantics/02-copy-move-and-comparison.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/classes-value-semantics/02-copy-move-and-comparison.json); JSON pointer `/sources/-`.

Append reference **C++20 working draft N4861: class.eq** with ID `cpp_core_classes_value_semantics_copy_move_and_comparison_source_audit_class_eq` and URL [https://timsong-cpp.github.io/cppwp/n4861/class.eq](https://timsong-cpp.github.io/cppwp/n4861/class.eq). Locator: N4861, [class.eq]; consulted 2026-09-11. Paragraphs 1–3: defaulted equality requirements and comparison of corresponding subobjects, stopping at the first unequal pair.

Evidence: [class.compare.default](https://timsong-cpp.github.io/cppwp/n4861/class.compare.default), [class.eq](https://timsong-cpp.github.io/cppwp/n4861/class.eq).

### CORE-003: Support the unordered-container comparison with its own requirements

Classification: **citation deficiency**; priority: **low**.

The ordered-map reference [associative.reqmts] does not define unordered-container hashing, equality compatibility, or iteration order. The prose is correct, but its comparison needs [unord.req]/2–6.

File: [content/units/cpp/library-data-containers/02-keys-and-vocabulary-types.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-data-containers/02-keys-and-vocabulary-types.json); JSON pointer `/sources/-`.

Append reference **C++20 working draft N4861: unord.req** with ID `cpp_core_library_data_containers_keys_and_vocabulary_types_source_audit_unord_req` and URL [https://timsong-cpp.github.io/cppwp/n4861/unord.req](https://timsong-cpp.github.io/cppwp/n4861/unord.req). Locator: N4861, [unord.req]; consulted 2026-09-11. Paragraphs 2–6: hash and equality requirements, equal hashes for equivalent keys, and unspecified absolute iteration order.

Evidence: [associative.reqmts](https://timsong-cpp.github.io/cppwp/n4861/associative.reqmts), [unord.req](https://timsong-cpp.github.io/cppwp/n4861/unord.req).

### CORE-004: Support count_if’s behavior and linear predicate bound

Classification: **citation deficiency**; priority: **low**.

The lesson explicitly teaches count_if and its linear traversal. Its current sources cover iterators, find, and sorting, but not the counting contract. [alg.count]/2–3 gives the result and exact predicate-application bound.

File: [content/units/cpp/iterators-algorithms-ranges/01-algorithms-and-half-open-ranges.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/iterators-algorithms-ranges/01-algorithms-and-half-open-ranges.json); JSON pointer `/sources/-`.

Append reference **C++20 working draft N4861: alg.count** with ID `cpp_core_iterators_algorithms_ranges_algorithms_and_half_open_ranges_source_audit_alg_count` and URL [https://timsong-cpp.github.io/cppwp/n4861/alg.count](https://timsong-cpp.github.io/cppwp/n4861/alg.count). Locator: N4861, [alg.count]; consulted 2026-09-11. Paragraphs 2–3: count/count_if return the number of matching positions and apply the predicate once per input position.

Evidence: [alg.count](https://timsong-cpp.github.io/cppwp/n4861/alg.count).

### CORE-005: Point the exception lesson’s vector citation to swap

Classification: **citation deficiency**; priority: **low**.

The URL is relevant: [vector.capacity] contains swap and its conditional noexcept specification. The current locator discusses reserve, size, and invalidation, none of which explains this lesson’s commit step. Identify swap and supply the default-allocator trait used to justify non-throwing behavior.

File: [content/units/cpp/error-handling/02-exceptions-and-state-guarantees.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/error-handling/02-exceptions-and-state-guarantees.json); JSON pointer `/sources/2/locator`.

Current:

> N4861, [vector.capacity]; consulted 2026-09-11. size versus capacity; reserve and invalidation on reallocation.

Replacement:

> N4861, [vector.capacity], swap declaration and paragraphs 12–13; consulted 2026-09-11. Swapping contents and capacity, with the conditional noexcept specification used by the prepare-then-commit example.

File: [content/units/cpp/error-handling/02-exceptions-and-state-guarantees.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/error-handling/02-exceptions-and-state-guarantees.json); JSON pointer `/sources/-`.

Append reference **C++20 working draft N4861: default.allocator** with ID `cpp_core_error_handling_exceptions_and_state_guarantees_source_audit_default_allocator` and URL [https://timsong-cpp.github.io/cppwp/n4861/default.allocator](https://timsong-cpp.github.io/cppwp/n4861/default.allocator). Locator: N4861, [default.allocator]; consulted 2026-09-11. std::allocator declares is_always_equal as true_type, making the vector<int> swap specification non-throwing in this example.

Evidence: [vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity), [default.allocator](https://timsong-cpp.github.io/cppwp/n4861/default.allocator).

### CORE-006: Limit the ws locator’s no-failbit statement to the relevant condition

Classification: **citation deficiency**; priority: **low**.

The current locator can be read as saying ws never sets failbit when input is exhausted. ws itself adds eofbit when exhaustion occurs while consuming whitespace; its sentry can add failbit if the stream already has eofbit before the call. The sample has trailing spaces and is correct. A record ending immediately after the number remains accepted by its explicit eof check, even though ws can leave failbit set.

File: [content/units/cpp/library-services/01-text-streams-and-extraction.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-services/01-text-streams-and-extraction.json); JSON pointer `/sources/2/locator`.

Current:

> N4861, [istream.manip], ws consumes whitespace and sets eofbit without failbit at exhausted input; consulted 2026-09-11.

Replacement:

> N4861, [istream.manip]; consulted 2026-09-11. ws consumes whitespace and adds eofbit without adding failbit when exhaustion occurs during that extraction; sentry construction can add failbit when the stream is already not good.

File: [content/units/cpp/library-services/01-text-streams-and-extraction.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-services/01-text-streams-and-extraction.json); JSON pointer `/sources/-`.

Append reference **C++20 working draft N4861: istream.sentry** with ID `cpp_core_library_services_text_streams_and_extraction_source_audit_istream_sentry` and URL [https://timsong-cpp.github.io/cppwp/n4861/istream.sentry](https://timsong-cpp.github.io/cppwp/n4861/istream.sentry). Locator: N4861, [istream.sentry]; consulted 2026-09-11. Paragraphs 2–3: sentry state checks, failbit when the input is already not good, and locale-based whitespace handling.

Evidence: [istream.manip](https://timsong-cpp.github.io/cppwp/n4861/istream.manip), [istream.sentry](https://timsong-cpp.github.io/cppwp/n4861/istream.sentry).

### CORE-007: Add the direct deletion and construction-dispatch contracts

Classification: **citation deficiency**; priority: **low**.

The runtime-polymorphism lessons give correct advice, but their [class.dtor] locators cover implicit invocation and destruction order rather than the exact base-pointer deletion precondition. [expr.delete]/3 states the ordinary virtual-destructor requirement, including its destroying-delete exception. [class.cdtor]/4 directly supports the first lesson’s construction/destruction dispatch caveat. Keep the current scoped prose and add the precise clauses.

File: [content/units/cpp/runtime-polymorphism/01-interfaces-and-overriding.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/runtime-polymorphism/01-interfaces-and-overriding.json); JSON pointer `/sources/-`.

Append reference **C++20 working draft N4861: expr.delete** with ID `cpp_core_runtime_polymorphism_interfaces_and_overriding_source_audit_expr_delete` and URL [https://timsong-cpp.github.io/cppwp/n4861/expr.delete](https://timsong-cpp.github.io/cppwp/n4861/expr.delete). Locator: N4861, [expr.delete]; consulted 2026-09-11. Paragraph 3: ordinary single-object deletion through a base type requires its virtual destructor when static and dynamic types differ.

File: [content/units/cpp/runtime-polymorphism/01-interfaces-and-overriding.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/runtime-polymorphism/01-interfaces-and-overriding.json); JSON pointer `/sources/-`.

Append reference **C++20 working draft N4861: class.cdtor** with ID `cpp_core_runtime_polymorphism_interfaces_and_overriding_source_audit_class_cdtor` and URL [https://timsong-cpp.github.io/cppwp/n4861/class.cdtor](https://timsong-cpp.github.io/cppwp/n4861/class.cdtor). Locator: N4861, [class.cdtor]; consulted 2026-09-11. Paragraph 4: a virtual call on an object under construction or destruction uses the final overrider in the constructor’s or destructor’s class.

File: [content/units/cpp/runtime-polymorphism/02-owning-polymorphic-objects.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/runtime-polymorphism/02-owning-polymorphic-objects.json); JSON pointer `/sources/-`.

Append reference **C++20 working draft N4861: expr.delete** with ID `cpp_core_runtime_polymorphism_owning_polymorphic_objects_source_audit_expr_delete` and URL [https://timsong-cpp.github.io/cppwp/n4861/expr.delete](https://timsong-cpp.github.io/cppwp/n4861/expr.delete). Locator: N4861, [expr.delete]; consulted 2026-09-11. Paragraph 3: the virtual-destructor contract for ordinary deletion through a base pointer, as used by unique_ptr<Notice>.

Evidence: [expr.delete](https://timsong-cpp.github.io/cppwp/n4861/expr.delete), [class.cdtor](https://timsong-cpp.github.io/cppwp/n4861/class.cdtor).

### CORE-008: Make the Guidelines locators specific and identify editorial roles

Classification: **optional enrichment**; priority: **optional**.

The source names and June 14, 2026 date are verified. The page calls Stroustrup and Sutter editors, and the shared locator phrase “RAII or the Rule of Zero” is unnecessarily vague. The RAII lesson also uses recommendations directly discussed in R.21 and R.24 on the same page. This is bibliographic precision, not a false source or a normative-language error.

File: [content/units/cpp/lifetime-ownership/02-raii-and-unique-ownership.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/lifetime-ownership/02-raii-and-unique-ownership.json); JSON pointer `/sources/3/title`.

Current:

> C++ Core Guidelines: R.1

Replacement:

> C++ Core Guidelines: R.1, R.21, and R.24

File: [content/units/cpp/lifetime-ownership/02-raii-and-unique-ownership.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/lifetime-ownership/02-raii-and-unique-ownership.json); JSON pointer `/sources/3/locator`.

Current:

> R.1; page dated June 14, 2026; consulted 2026-09-11. Advisory guidance on RAII or the Rule of Zero, distinct from normative C++ language requirements.

Replacement:

> R.1, R.21, and R.24; edited by Bjarne Stroustrup and Herb Sutter; page dated June 14, 2026; consulted 2026-09-11. Advisory guidance on RAII, preferring exclusive ownership when sharing is unnecessary, and breaking shared-ownership cycles with weak_ptr; not normative language requirements.

File: [content/units/cpp/classes-value-semantics/02-copy-move-and-comparison.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/classes-value-semantics/02-copy-move-and-comparison.json); JSON pointer `/sources/5/locator`.

Current:

> C.20; page dated June 14, 2026; consulted 2026-09-11. Advisory guidance on RAII or the Rule of Zero, distinct from normative C++ language requirements.

Replacement:

> C.20; edited by Bjarne Stroustrup and Herb Sutter; page dated June 14, 2026; consulted 2026-09-11. Advisory Rule of Zero guidance: resource-managing members can supply the surrounding type’s default operations; not normative language requirements.

Evidence: [CppCoreGuidelines#Rr-raii](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-raii), [CppCoreGuidelines#Rr-unique](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-unique), [CppCoreGuidelines#Rr-weak_ptr](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-weak_ptr), [CppCoreGuidelines#Rc-zero](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-zero).

### CORE-009: Link an actual include-guard explanation

Classification: **optional enrichment**; priority: **optional**.

The source list establishes inclusion and ODR behavior, but a beginner would benefit from a direct explanation of the guard pattern rather than reconstructing it from preprocessing clauses. GCC’s primary manual gives the small pattern and its scope. The existing lesson does not falsely claim a guard solves cross-translation-unit ODR violations.

File: [content/units/cpp/program-organization/02-headers-and-modules.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/program-organization/02-headers-and-modules.json); JSON pointer `/sources/-`.

Append reference **GCC preprocessor manual: Once-Only Headers** with ID `cpp_core_program_organization_headers_and_modules_source_audit_include_guards` and URL [https://gcc.gnu.org/onlinedocs/cpp/Once-Only-Headers.html](https://gcc.gnu.org/onlinedocs/cpp/Once-Only-Headers.html). Locator: GCC preprocessor manual §2.4; consulted 2026-09-11. The wrapper #ifndef pattern and why a repeated include skips guarded contents. Implementation documentation describing a portable preprocessing pattern.

Evidence: [Once-Only-Headers.html](https://gcc.gnu.org/onlinedocs/cpp/Once-Only-Headers.html), [Pragmas.html](https://gcc.gnu.org/onlinedocs/cpp/Pragmas.html).

### CORE-010: Name vector<bool> as the contiguity exception

Classification: **optional enrichment**; priority: **optional**.

“Ordinary elements” signals a qualification, and the vector<string> example is fully contiguous. Naming the bool specialization would keep beginners from treating the statement as a guarantee for every possible vector<T>. [vector.overview]/2 expressly excludes bool from the contiguous-container requirement.

File: [content/units/cpp/library-data-containers/01-sequences-and-invalidation.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-data-containers/01-sequences-and-invalidation.json); JSON pointer `/parts/0/blocks/0/text`.

Current:

> A container owns a collection of elements and defines how they are arranged and accessed. std::vector is a useful starting point for a sequence whose length can change. It stores ordinary elements contiguously and manages their storage automatically. std::array represents a fixed number of elements as part of its own value. Neither choice requires writing new or delete, so the first design question can focus on the application’s required operations.

Replacement:

> A container owns a collection of elements and defines how they are arranged and accessed. std::vector is a useful starting point for a sequence whose length can change. For element types other than bool, vector is a contiguous container and manages its storage automatically. The vector<bool> specialization has different storage and reference behavior. std::array represents a fixed number of elements as part of its own value. Neither choice requires writing new or delete, so the first design question can focus on the application’s required operations.

Evidence: [vector.overview](https://timsong-cpp.github.io/cppwp/n4861/vector.overview).

## Module-by-module coverage

Each row covers all three parts and the reflection, not only the worked program.

### Initialize values and read deduced types

[content/units/cpp/types-initialization/01-initialization-and-deduction.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/types-initialization/01-initialization-and-deduction.json)

Initialization, narrowing, auto versus auto&, vector braces versus count/value, and reference invalidation checked. Trace: Atlas: 18 12; 2 3. Scalar initialization and constructor selection are correctly distinguished.

No correction required. A narrower vector constructor passage was also inspected.

Cited passages checked: [dcl.init](https://timsong-cpp.github.io/cppwp/n4861/dcl.init), [dcl.init.list](https://timsong-cpp.github.io/cppwp/n4861/dcl.init.list), [dcl.spec.auto](https://timsong-cpp.github.io/cppwp/n4861/dcl.spec.auto), [vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity).

### Conversions and domain types

[content/units/cpp/types-initialization/02-conversions-and-domain-types.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/types-initialization/02-conversions-and-domain-types.json)

Checked alias identity, scoped enum distinction, C++20 integral conversion, floating-to-integer representability, and division order. Inputs 5 and 2 make 2.5 exactly representable; integer-first division would give 2.

No correction required. No platform integer-width guarantee is invented.

Cited passages checked: [conv.integral](https://timsong-cpp.github.io/cppwp/n4861/conv.integral), [dcl.enum](https://timsong-cpp.github.io/cppwp/n4861/dcl.enum), [dcl.typedef](https://timsong-cpp.github.io/cppwp/n4861/dcl.typedef), [conv.fpint](https://timsong-cpp.github.io/cppwp/n4861/conv.fpint), [expr.mul](https://timsong-cpp.github.io/cppwp/n4861/expr.mul).

### Parameters, results, and borrowing

[content/units/cpp/functions-interfaces/01-parameters-and-results.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/functions-interfaces/01-parameters-and-results.json)

Checked value/reference parameter initialization and lifetime constraints. The only sum is 4+6+5=15, with the representability limitation stated. Returned string owns its result; no dangling reference is returned.

No correction required. Efficiency language says can, not a universal copy-elision or speed guarantee.

Cited passages checked: [expr.call](https://timsong-cpp.github.io/cppwp/n4861/expr.call), [dcl.init.ref](https://timsong-cpp.github.io/cppwp/n4861/dcl.init.ref), [basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life).

### Overloads and local callable objects

[content/units/cpp/functions-interfaces/02-overloads-and-lambdas.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/functions-interfaces/02-overloads-and-lambdas.json)

Checked exact-match overload ranking, by-value capture at closure creation, reference-capture lifetime, closure identity, and literal storage. Snapshot limit 10 produces false/true after the outside limit changes to 20.

No correction required. Added audit corroboration for closure type and literal lifetime.

Cited passages checked: [over.ics.rank](https://timsong-cpp.github.io/cppwp/n4861/over.ics.rank), [expr.prim.lambda.capture](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.lambda.capture), [dcl.spec.auto](https://timsong-cpp.github.io/cppwp/n4861/dcl.spec.auto).

### Owners, borrowers, and scope

[content/units/cpp/lifetime-ownership/01-owners-and-borrowers.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/lifetime-ownership/01-owners-and-borrowers.json)

Checked lifetime versus scope, non-owning span/string_view representation, const view versus const elements, and vector storage invalidation. Both owners outlive views; the unchanged allocation exposes pages[0]=9 safely.

No correction required. The span is explicitly span<const int>; indexed access preconditions are met.

Cited passages checked: [basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life), [span.overview](https://timsong-cpp.github.io/cppwp/n4861/span.overview), [string.view.template](https://timsong-cpp.github.io/cppwp/n4861/string.view.template), [vector.modifiers](https://timsong-cpp.github.io/cppwp/n4861/vector.modifiers).

### RAII and exclusive ownership

[content/units/cpp/lifetime-ownership/02-raii-and-unique-ownership.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/lifetime-ownership/02-raii-and-unique-ownership.json)

Checked make_unique, unique_ptr noncopyability, move postcondition, destructor cleanup, std::move cast semantics, and advisory ownership guidance. first is guaranteed empty; the owned string is released once.

CORE-008 is optional bibliographic precision. No unsafe ownership or unwinding claim found.

Cited passages checked: [class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor), [unique.ptr](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr), [forward](https://timsong-cpp.github.io/cppwp/n4861/forward), [CppCoreGuidelines#Rr-raii](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-raii).

### Classes that maintain a useful invariant

[content/units/cpp/classes-value-semantics/01-invariants-and-operations.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/classes-value-semantics/01-invariants-and-operations.json)

Checked member declaration order, default initialization of completed_, explicit construction, and implicit memberwise copying. The invariant proves total_-completed_ and every accepted addition are representable for every int argument.

No correction required. Rejection preserves state; true/false and 4/6 trace is correct.

Cited passages checked: [class.base.init](https://timsong-cpp.github.io/cppwp/n4861/class.base.init), [class.ctor](https://timsong-cpp.github.io/cppwp/n4861/class.ctor), [class.copy.ctor](https://timsong-cpp.github.io/cppwp/n4861/class.copy.ctor).

### Copying, moving, and comparing values

[content/units/cpp/classes-value-semantics/02-copy-move-and-comparison.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/classes-value-semantics/02-copy-move-and-comparison.json)

Checked generated copy/move conditions, independent string state, assignment versus construction, moved-from library guarantees, and C++20 equality. Output Atlas Revised / true is justified without inspecting the moved-from string.

CORE-002 adds the equality result clause; CORE-008 optionally sharpens the Guidelines locator.

Cited passages checked: [class.copy.ctor](https://timsong-cpp.github.io/cppwp/n4861/class.copy.ctor), [class.copy.assign](https://timsong-cpp.github.io/cppwp/n4861/class.copy.assign), [class.compare.default](https://timsong-cpp.github.io/cppwp/n4861/class.compare.default), [forward](https://timsong-cpp.github.io/cppwp/n4861/forward), [lib.types.movedfrom](https://timsong-cpp.github.io/cppwp/n4861/lib.types.movedfrom), [CppCoreGuidelines#Rc-zero](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-zero).

### Sequence containers and invalidation

[content/units/cpp/library-data-containers/01-sequences-and-invalidation.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-data-containers/01-sequences-and-invalidation.json)

Checked vector storage ownership, capacity lower bound, reserve versus resize, erase invalidation, nonempty front access, and reallocation. The program retains no invalidated iterator and prints 2 true / Orbits 1.

CORE-010 optionally makes the bool exception explicit. No unsafe access or unsupported exact capacity assumption.

Cited passages checked: [vector.overview](https://timsong-cpp.github.io/cppwp/n4861/vector.overview), [vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity), [vector.modifiers](https://timsong-cpp.github.io/cppwp/n4861/vector.modifiers).

### Keys, records, and alternative values

[content/units/cpp/library-data-containers/02-keys-and-vocabulary-types.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-data-containers/02-keys-and-vocabulary-types.json)

Checked ordered equivalence, key-order iteration, zero initialization by map indexing, structured-binding references, and get_if. The fixed three-element input prevents count overflow; all cast pointers are checked.

CORE-001 corrects a general variant-state overstatement; CORE-003 adds unordered requirements. Sample behavior is correct.

Cited passages checked: [associative.reqmts](https://timsong-cpp.github.io/cppwp/n4861/associative.reqmts), [variant](https://timsong-cpp.github.io/cppwp/n4861/variant), [dcl.struct.bind](https://timsong-cpp.github.io/cppwp/n4861/dcl.struct.bind), [map.access](https://timsong-cpp.github.io/cppwp/n4861/map.access).

### Algorithms and half-open ranges

[content/units/cpp/iterators-algorithms-ranges/01-algorithms-and-half-open-ranges.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/iterators-algorithms-ranges/01-algorithms-and-half-open-ranges.json)

Checked half-open validity, past-the-end non-dereference, sort requirements, strict weak ordering, find failure representation, and count_if. Sorting produces 2,4,6,9; finding 6 and counting three evens are correct.

CORE-004 supplies the missing count contract. Complexity claims are library bounds, not empirical performance claims.

Cited passages checked: [iterator.requirements.general](https://timsong-cpp.github.io/cppwp/n4861/iterator.requirements.general), [alg.find](https://timsong-cpp.github.io/cppwp/n4861/alg.find), [alg.sorting](https://timsong-cpp.github.io/cppwp/n4861/alg.sorting).

### Lazy range pipelines

[content/units/cpp/iterators-algorithms-ranges/02-lazy-range-pipelines.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/iterators-algorithms-ranges/02-lazy-range-pipelines.json)

Checked C++20 filter and transform definitions, views::all/ref_view selection for an lvalue, deferred dereference computation, cached filter begin, and output materialization. Lifetimes and finite multiplication range are safe.

No correction required. No claim that every view owns or that every view is non-owning; no later ranges::to dependency.

Cited passages checked: [range.filter](https://timsong-cpp.github.io/cppwp/n4861/range.filter), [range.transform](https://timsong-cpp.github.io/cppwp/n4861/range.transform), [iterator.requirements.general](https://timsong-cpp.github.io/cppwp/n4861/iterator.requirements.general).

### Optional results and complete parsing

[content/units/cpp/error-handling/01-optional-results-and-parsing.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/error-handling/01-optional-results-and-parsing.json)

Checked optional engagement, unchecked versus throwing access, complete from_chars consumption, no leading-whitespace skipping, and representability failure. Empty input is rejected before range construction; 24 succeeds and 12x fails.

No correction required. expected is explicitly a C++23 discussion and not used by the C++20 sample.

Cited passages checked: [optional](https://timsong-cpp.github.io/cppwp/n4861/optional), [optional.observe](https://timsong-cpp.github.io/cppwp/n4861/optional.observe), [charconv.from.chars](https://timsong-cpp.github.io/cppwp/n4861/charconv.from.chars), [expected](https://timsong-cpp.github.io/cppwp/n4950/expected).

### Exceptions and state guarantees

[content/units/cpp/error-handling/02-exceptions-and-state-guarantees.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/error-handling/02-exceptions-and-state-guarantees.json)

Checked unwinding, target-only strong guarantee, prepared copy/validation, default-allocator vector swap, and noexcept termination. Failure leaves 4,6; success commits 8,10; no external side effects are included in the guarantee.

CORE-005 sharpens the commit citation and supplies the allocator trait. No exception-safety defect found.

Cited passages checked: [except.ctor](https://timsong-cpp.github.io/cppwp/n4861/except.ctor), [except.spec](https://timsong-cpp.github.io/cppwp/n4861/except.spec), [vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity).

### Text streams and extraction state

[content/units/cpp/library-services/01-text-streams-and-extraction.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-services/01-text-streams-and-extraction.json)

Checked string stream ownership, formatted extraction conditions, locale handling, ws/end checks, and C++23 print separation. The fixed record succeeds; an extra token is rejected. Existing eofbit before ws was independently assessed.

CORE-006 qualifies the citation’s state claim; the runnable record parser is correct for its stated in-memory format.

Cited passages checked: [string.streams](https://timsong-cpp.github.io/cppwp/n4861/string.streams), [istream.formatted.reqmts](https://timsong-cpp.github.io/cppwp/n4861/istream.formatted.reqmts), [istream.manip](https://timsong-cpp.github.io/cppwp/n4861/istream.manip), [print.fun](https://timsong-cpp.github.io/cppwp/n4950/print.fun).

### Time durations and filesystem paths

[content/units/cpp/library-services/02-time-and-path-values.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/library-services/02-time-and-path-values.json)

Checked duration tick units, addition/conversion, integral division at a coarser period, lexical normalization, generic path syntax, and steady_clock. The trace is 2500 ms / 2 seconds / library/atlas.txt with no filesystem access.

No correction required. Symlink, encoding, overflow, and filesystem-state limits are explicitly separated from lexical operations.

Cited passages checked: [time.duration](https://timsong-cpp.github.io/cppwp/n4861/time.duration), [fs.path.gen](https://timsong-cpp.github.io/cppwp/n4861/fs.path.gen), [fs.path.generic](https://timsong-cpp.github.io/cppwp/n4861/fs.path.generic), [time.clock.steady](https://timsong-cpp.github.io/cppwp/n4861/time.clock.steady).

### Templates as families of typed operations

[content/units/cpp/templates-generic-programming/01-typed-families.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/templates-generic-programming/01-typed-families.json)

Checked template parameter syntax, repeated T deduction, const-reference inputs, result copying, and implicit instantiation. larger selects 9 and Orbits and returns owning values; mixed int/double deduction conflicts.

No correction required. Definition reachability is described as the usual model, not as a ban on explicit instantiation or modules.

Cited passages checked: [temp.param](https://timsong-cpp.github.io/cppwp/n4861/temp.param), [temp.deduct.call](https://timsong-cpp.github.io/cppwp/n4861/temp.deduct.call), [temp.inst](https://timsong-cpp.github.io/cppwp/n4861/temp.inst).

### Concepts and explicit requirements

[content/units/cpp/templates-generic-programming/02-concepts-and-requirements.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/templates-generic-programming/02-concepts-and-requirements.json)

Checked constraint satisfaction, requires unevaluated operands, const-compatible size call, convertible_to syntax and semantic requirements, and the distinction between satisfaction and modeling.

No correction required. The custom concept does not claim to prove true counts, ordering laws, or arbitrary runtime behavior.

Cited passages checked: [temp.constr](https://timsong-cpp.github.io/cppwp/n4861/temp.constr), [expr.prim.req](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.req), [concept.convertible](https://timsong-cpp.github.io/cppwp/n4861/concept.convertible).

### Interfaces and virtual dispatch

[content/units/cpp/runtime-polymorphism/01-interfaces-and-overriding.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/runtime-polymorphism/01-interfaces-and-overriding.json)

Checked abstractness, override matching including const, dynamic dispatch through a base reference, literal-backed views, slicing distinction, and construction/destruction dispatch. No sliced abstract value is constructed.

CORE-007 adds precise deletion and construction-dispatch citations. Existing advice and expected output are correct.

Cited passages checked: [class.virtual](https://timsong-cpp.github.io/cppwp/n4861/class.virtual), [class.abstract](https://timsong-cpp.github.io/cppwp/n4861/class.abstract), [class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor).

### Owning a collection of implementations

[content/units/cpp/runtime-polymorphism/02-owning-polymorphic-objects.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/runtime-polymorphism/02-owning-polymorphic-objects.json)

Checked converting unique_ptr ownership, virtual destruction, checked pointer downcasts, reference-cast failure, owner relocation versus pointee lifetime, and owner erasure. Welcome fails the optional cast; Reminder reports 3.

CORE-007 adds the direct deletion contract. All owners in the example are non-null and all borrowed casts are tested.

Cited passages checked: [unique.ptr](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr), [expr.dynamic.cast](https://timsong-cpp.github.io/cppwp/n4861/expr.dynamic.cast), [class.virtual](https://timsong-cpp.github.io/cppwp/n4861/class.virtual), [class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor).

### Declarations, definitions, and linkage

[content/units/cpp/program-organization/01-declarations-and-linkage.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/program-organization/01-declarations-and-linkage.json)

Checked declaration-before-use, later definition, unnamed-namespace internal linkage, ODR consistency, and GCC’s separate compile/link phases. The bounded addition is 12; tool behavior is labeled as implementation-specific.

No correction required. The prose does not promise that every ODR problem must be diagnosed by a linker.

Cited passages checked: [basic.def.odr](https://timsong-cpp.github.io/cppwp/n4861/basic.def.odr), [basic.link](https://timsong-cpp.github.io/cppwp/n4861/basic.link), [namespace.def](https://timsong-cpp.github.io/cppwp/n4861/namespace.def), [Overall-Options.html](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html).

### Headers, namespaces, and module boundaries

[content/units/cpp/program-organization/02-headers-and-modules.json](/home/lance/Documents/Code/Alexandria/content/units/cpp/program-organization/02-headers-and-modules.json)

Checked include/ODR distinction, inline meaning, nested namespaces, exported primary-module declaration, optional preceding global fragment, and partitions. The previous first-declaration overstatement is already fixed in baseline.

CORE-009 optionally adds a direct guard tutorial. The [module.global.frag]/6 citation really does show module; and an include before export module M;.

Cited passages checked: [cpp.include](https://timsong-cpp.github.io/cppwp/n4861/cpp.include), [basic.def.odr](https://timsong-cpp.github.io/cppwp/n4861/basic.def.odr), [module.unit](https://timsong-cpp.github.io/cppwp/n4861/module.unit), [namespace.def](https://timsong-cpp.github.io/cppwp/n4861/namespace.def), [dcl.inline](https://timsong-cpp.github.io/cppwp/n4861/dcl.inline), [module.global.frag](https://timsong-cpp.github.io/cppwp/n4861/module.global.frag).

## Cited-source access and relevance inventory

All entries below were accessible. Duplicate source use across modules is consolidated while retaining its citation count. Draft clauses are primary specification text served by the frozen mirror; Guidelines are advisory guidance; GCC is implementation documentation.

| Source | Citation instances | Inspected material and limits |
| --- | ---: | --- |
| [dcl.init](https://timsong-cpp.github.io/cppwp/n4861/dcl.init) | 1 | Default/value initialization and initialization contexts; relevant to starting scalar state. Read the rules, not merely the heading. |
| [dcl.init.list](https://timsong-cpp.github.io/cppwp/n4861/dcl.init.list) | 1 | Paragraphs 1–3 and narrowing rules: braces, scalar empty initialization, and preference for initializer-list constructors. |
| [dcl.spec.auto](https://timsong-cpp.github.io/cppwp/n4861/dcl.spec.auto) | 2 | Placeholder type deduction, including the invented template parameter and reference declarator behavior. |
| [vector.capacity](https://timsong-cpp.github.io/cppwp/n4861/vector.capacity) | 3 | size/capacity, reserve lower bound and invalidation, resize, plus swap declaration and paragraphs 12–13. Exception-lesson locator needs CORE-005. |
| [conv.integral](https://timsong-cpp.github.io/cppwp/n4861/conv.integral) | 1 | Destination integer value is congruent modulo the destination width under this C++20 draft; no out-of-range float conversion inference made. |
| [dcl.enum](https://timsong-cpp.github.io/cppwp/n4861/dcl.enum) | 1 | Distinct enumeration types, scoped enumerators, and underlying-type rules; supports the type distinction without treating enumerator names as exhaustive runtime values. |
| [dcl.typedef](https://timsong-cpp.github.io/cppwp/n4861/dcl.typedef) | 1 | An alias declaration gives a typedef-name and does not introduce a new type. |
| [conv.fpint](https://timsong-cpp.github.io/cppwp/n4861/conv.fpint) | 1 | Truncation and representability preconditions for floating-integral conversion; also integral-to-floating conversion limits. |
| [expr.mul](https://timsong-cpp.github.io/cppwp/n4861/expr.mul) | 1 | Usual arithmetic conversions, integral division truncation, and invalid zero/unrepresentable quotient cases. |
| [expr.call](https://timsong-cpp.github.io/cppwp/n4861/expr.call) | 1 | Parameter initialization, reference access effects, and function-call rules relevant to the worked parameter trace. |
| [dcl.init.ref](https://timsong-cpp.github.io/cppwp/n4861/dcl.init.ref) | 1 | Reference binding and assignment through a reference; no claim that const universally extends a reached object’s lifetime. |
| [basic.life](https://timsong-cpp.github.io/cppwp/n4861/basic.life) | 2 | Paragraphs 1–4 and post-lifetime restrictions: lifetime start/end and limits on accessing destroyed objects. |
| [over.ics.rank](https://timsong-cpp.github.io/cppwp/n4861/over.ics.rank) | 1 | Exact match, promotion, and conversion ordering and identity-conversion preference for the simple overload set. |
| [expr.prim.lambda.capture](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.lambda.capture) | 1 | By-copy closure members and initialization at lambda evaluation; reference-capture lifetime obligations. |
| [span.overview](https://timsong-cpp.github.io/cppwp/n4861/span.overview) | 1 | Non-owning contiguous sequence, element/reference types, and const observer signatures. Supports const span<int> versus span<const int>. |
| [string.view.template](https://timsong-cpp.github.io/cppwp/n4861/string.view.template) | 1 | Paragraph 2 underlying-pointer invalidation, pointer/length representation, constructor valid-range preconditions, and observers. An initial find miss was resolved by opening the text. |
| [vector.modifiers](https://timsong-cpp.github.io/cppwp/n4861/vector.modifiers) | 2 | Reallocation and non-reallocation insertion invalidation; erase invalidates at/after the erased position. |
| [class.dtor](https://timsong-cpp.github.io/cppwp/n4861/class.dtor) | 3 | Implicit destructor invocation, member/base destruction, reverse order, virtual destructors, and explicit destructor-call example. Exact delete preconditions are in [expr.delete]. |
| [unique.ptr](https://timsong-cpp.github.io/cppwp/n4861/unique.ptr) | 2 | Ownership and noncopyability overview; move construction, source-null postcondition, destruction, observers, and make_unique definitions. |
| [forward](https://timsong-cpp.github.io/cppwp/n4861/forward) | 2 | move and forward return casts to specified reference types; move does not perform an independent object relocation. |
| [CppCoreGuidelines#Rr-raii](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-raii) | 1 | R.1 rationale and resource-wrapper examples; additionally R.21 and R.24 passages read. Header verifies Jun 14, 2026 and identifies the named people as editors. CORE-008 is optional locator precision. |
| [class.base.init](https://timsong-cpp.github.io/cppwp/n4861/class.base.init) | 1 | Default member initializers and paragraph 13 declaration-order initialization before the body. |
| [class.ctor](https://timsong-cpp.github.io/cppwp/n4861/class.ctor) | 1 | Constructor declaration/initialization and default/copy/move construction subclauses; consistent with the Progress interface. |
| [class.copy.ctor](https://timsong-cpp.github.io/cppwp/n4861/class.copy.ctor) | 2 | Implicit declaration conditions and memberwise copy/move construction; user-declared destructor/copy operations affect implicit moves. |
| [class.copy.assign](https://timsong-cpp.github.io/cppwp/n4861/class.copy.assign) | 1 | Implicit assignment conditions and memberwise subobject assignment. |
| [class.compare.default](https://timsong-cpp.github.io/cppwp/n4861/class.compare.default) | 1 | Defaulted declaration restrictions and expanded subobject list; does not itself specify the complete == result algorithm (CORE-002). |
| [lib.types.movedfrom](https://timsong-cpp.github.io/cppwp/n4861/lib.types.movedfrom) | 1 | Valid but unspecified states for moved-from standard-library types unless an operation says otherwise. |
| [CppCoreGuidelines#Rc-zero](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-zero) | 1 | C.20 rationale, Named_map example, and Rule of Zero note; header date and editor roles verified. CORE-008 is optional locator precision. |
| [vector.overview](https://timsong-cpp.github.io/cppwp/n4861/vector.overview) | 1 | Automatic storage management and contiguous-container requirement for element types other than bool. |
| [associative.reqmts](https://timsong-cpp.github.io/cppwp/n4861/associative.reqmts) | 1 | Ordered-container strict weak ordering, key equivalence, operations, and ordered iteration. Does not substantiate unordered-container claims (CORE-003). |
| [variant](https://timsong-cpp.github.io/cppwp/n4861/variant) | 1 | Value-or-no-value state, inline contained storage, and get_if’s pointer/null behavior. Reveals CORE-001’s qualification need. |
| [dcl.struct.bind](https://timsong-cpp.github.io/cppwp/n4861/dcl.struct.bind) | 1 | Hidden binding object, reference-qualified binding, tuple_size/tuple_element/get rules; supports the const map-element binding. |
| [map.access](https://timsong-cpp.github.io/cppwp/n4861/map.access) | 1 | operator[] equivalent to try_emplace and at behavior; supports insertion on indexing, with ordered-container requirements as context. |
| [iterator.requirements.general](https://timsong-cpp.github.io/cppwp/n4861/iterator.requirements.general) | 2 | Past-the-end, reachable sentinels, valid half-open ranges, and invalid-range consequences. |
| [alg.find](https://timsong-cpp.github.io/cppwp/n4861/alg.find) | 1 | First matching iterator or last when absent, with at-most-linear predicate bound. |
| [alg.sorting](https://timsong-cpp.github.io/cppwp/n4861/alg.sorting) | 1 | Strict weak ordering including irreflexivity/transitivity; sort’s random-access contract and comparison bound. Count is a separate clause. |
| [range.filter](https://timsong-cpp.github.io/cppwp/n4861/range.filter) | 1 | Construction, predicate search, cached begin for forward ranges, and element-modification caveat. Read the cache paragraph after an initial search miss. |
| [range.transform](https://timsong-cpp.github.io/cppwp/n4861/range.transform) | 1 | Callable storage and invocation during iterator dereference, with regular_invocable constraints. |
| [optional](https://timsong-cpp.github.io/cppwp/n4861/optional) | 1 | Contained value/storage lifetime and engagement semantics; optional<int> zero remains engaged. |
| [optional.observe](https://timsong-cpp.github.io/cppwp/n4861/optional.observe) | 1 | Engagement tests, dereference preconditions, value’s bad_optional_access alternative, and value_or. |
| [charconv.from.chars](https://timsong-cpp.github.io/cppwp/n4861/charconv.from.chars) | 1 | Valid input range, stop pointer, error codes, integer pattern/sign rules, and non-throwing conversion. |
| [expected](https://timsong-cpp.github.io/cppwp/n4950/expected) | 1 | N4950 overview and synopsis: value/error representation. Relevant only to the marked C++23 discussion. |
| [except.ctor](https://timsong-cpp.github.io/cppwp/n4861/except.ctor) | 1 | Unwinding of constructed automatic objects and completed subobjects in reverse completion order. |
| [except.spec](https://timsong-cpp.github.io/cppwp/n4861/except.spec) | 1 | Non-throwing exception specifications and termination when the handler search crosses the function boundary. |
| [string.streams](https://timsong-cpp.github.io/cppwp/n4861/string.streams) | 1 | istringstream/ostringstream construction, owned string buffer, and str result interfaces. |
| [istream.formatted.reqmts](https://timsong-cpp.github.io/cppwp/n4861/istream.formatted.reqmts) | 1 | Sentry construction and extraction conditioned on sentry state; stream error propagation. Additional sentry evidence informs CORE-006. |
| [istream.manip](https://timsong-cpp.github.io/cppwp/n4861/istream.manip) | 1 | ws extraction and eofbit behavior. Does not erase the effects of constructing a sentry on a stream already not good. |
| [print.fun](https://timsong-cpp.github.io/cppwp/n4950/print.fun) | 1 | N4950 print/println signatures and stdout delegation. Relevant only to the marked C++23 discussion. |
| [time.duration](https://timsong-cpp.github.io/cppwp/n4861/time.duration) | 1 | Tick count/period, arithmetic return type, duration_cast integer division, and literal suffixes. Fixed positive inputs avoid overflow and rounding ambiguity. |
| [fs.path.gen](https://timsong-cpp.github.io/cppwp/n4861/fs.path.gen) | 1 | lexically_normal returns the normal form; lexical relative/proximate discussions distinguish symlink resolution. |
| [fs.path.generic](https://timsong-cpp.github.io/cppwp/n4861/fs.path.generic) | 1 | Generic pathname grammar, platform-dependent root/name rules, and normalization steps including dot/dot-dot removal. |
| [time.clock.steady](https://timsong-cpp.github.io/cppwp/n4861/time.clock.steady) | 1 | Clock values do not decrease as physical time advances and advance at a steady rate; not a benchmark-methodology claim. |
| [temp.param](https://timsong-cpp.github.io/cppwp/n4861/temp.param) | 1 | Type and non-type template-parameter syntax and constraints; class and typename equivalence in a type parameter. |
| [temp.deduct.call](https://timsong-cpp.github.io/cppwp/n4861/temp.deduct.call) | 1 | Deduction from each call argument and reference/cv adjustments; conflicting deductions are not automatic common-type selection. |
| [temp.inst](https://timsong-cpp.github.io/cppwp/n4861/temp.inst) | 1 | Contexts requiring implicit instantiation; class-member declarations versus definitions and reachable/declared specialization qualifications. |
| [temp.constr](https://timsong-cpp.github.io/cppwp/n4861/temp.constr) | 1 | Associated constraints, satisfaction, and substitution behavior. The simplified lesson stays within its template substitution context. |
| [expr.prim.req](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.req) | 1 | Requires-expression local parameters and unevaluated requirements; simple, type, and compound requirements. |
| [concept.convertible](https://timsong-cpp.github.io/cppwp/n4861/concept.convertible) | 1 | Both implicit and explicit conversion syntax plus semantic equality of results; not a proof that a size value is meaningful. |
| [class.virtual](https://timsong-cpp.github.io/cppwp/n4861/class.virtual) | 2 | Overriding signature requirements, final overriders, override diagnostics, polymorphic types, and dynamic versus static selection. |
| [class.abstract](https://timsong-cpp.github.io/cppwp/n4861/class.abstract) | 1 | Pure virtual functions, abstract complete-object restrictions, permitted pointers/references, and pure-call construction caveat. |
| [expr.dynamic.cast](https://timsong-cpp.github.io/cppwp/n4861/expr.dynamic.cast) | 1 | Runtime checking for the shown polymorphic downcast; pointer failure is null, reference failure throws bad_cast. |
| [basic.def.odr](https://timsong-cpp.github.io/cppwp/n4861/basic.def.odr) | 2 | One definition per translation unit, required odr-used definitions, allowed consistent repetitions, and diagnostic qualifications. |
| [basic.link](https://timsong-cpp.github.io/cppwp/n4861/basic.link) | 1 | Internal/external/module linkage, namespace-scope variables, and unnamed-namespace consequences. |
| [namespace.def](https://timsong-cpp.github.io/cppwp/n4861/namespace.def) | 2 | Namespace definitions, reopening, nesting, and unnamed namespaces; appropriate to the grouping/linkage examples. |
| [Overall-Options.html](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html) | 1 | GCC manual §3.2 compilation stages, -c skipping linking, and object-file output. Explicitly implementation documentation. |
| [cpp.include](https://timsong-cpp.github.io/cppwp/n4861/cpp.include) | 1 | Header/source inclusion, search paths, replacement semantics, and importable-header qualification; does not teach the wrapper guard itself. |
| [module.unit](https://timsong-cpp.github.io/cppwp/n4861/module.unit) | 1 | Module interface versus implementation units, one primary interface, partitions, and internal partition import scope. |
| [dcl.inline](https://timsong-cpp.github.io/cppwp/n4861/dcl.inline) | 1 | Inline function/variable declaration and definition-domain rules; body substitution is not required. |
| [module.global.frag](https://timsong-cpp.github.io/cppwp/n4861/module.global.frag) | 1 | Grammar and paragraphs 1–2; paragraph 6 really contains an interface example with a global fragment before export module M. |

## Additional corroboration and unavailable evidence

| Source | Classification | Inspected material and limits |
| --- | --- | --- |
| [n4861.pdf](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf) | Primary committee draft PDF | Title page only for metadata: N4861, dated 2020-04-01, working draft. No claim of reading all 1,834 PDF pages. |
| [n4951.html](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4951.html) | Primary committee editorial report | Opening metadata and New papers section identify N4950 as the final C++23 working draft and date the report 2023-05-10. |
| [class.eq](https://timsong-cpp.github.io/cppwp/n4861/class.eq) | Primary specification text, frozen draft mirror | Paragraphs 1–3 supply defaulted equality semantics (CORE-002). |
| [unord.req](https://timsong-cpp.github.io/cppwp/n4861/unord.req) | Primary specification text, frozen draft mirror | Paragraphs 2–6 supply hash/equality compatibility and unspecified absolute order (CORE-003). |
| [expr.delete](https://timsong-cpp.github.io/cppwp/n4861/expr.delete) | Primary specification text, frozen draft mirror | Paragraph 3 gives ordinary base-pointer deletion’s virtual-destructor requirement, with the destroying-delete qualification (CORE-007). |
| [class.cdtor](https://timsong-cpp.github.io/cppwp/n4861/class.cdtor) | Primary specification text, frozen draft mirror | Paragraph 4 gives construction/destruction dispatch; subsequent examples and dynamic_cast qualifications inspected (CORE-007). |
| [istream.sentry](https://timsong-cpp.github.io/cppwp/n4861/istream.sentry) | Primary specification text, frozen draft mirror | Paragraphs 2–3 give state and locale handling before extraction (CORE-006). |
| [Once-Only-Headers.html](https://gcc.gnu.org/onlinedocs/cpp/Once-Only-Headers.html) | Primary implementation documentation | Complete short wrapper #ifndef explanation, macro naming, and scope (CORE-009). |
| [Pragmas.html](https://gcc.gnu.org/onlinedocs/cpp/Pragmas.html) | Primary implementation documentation | The #pragma once entry calls it a less-portable alternative to #ifndef; no claim that the C++ standard specifies once. |
| [vector.cons](https://timsong-cpp.github.io/cppwp/n4861/vector.cons) | Primary specification text, frozen draft mirror | Count/value constructor constructs n copies, corroborating the initialization example. |
| [alg.count](https://timsong-cpp.github.io/cppwp/n4861/alg.count) | Primary specification text, frozen draft mirror | Counting result and exact predicate bound (CORE-004). |
| [range.all](https://timsong-cpp.github.io/cppwp/n4861/range.all) | Primary specification text, frozen draft mirror | views::all chooses ref_view when its expression is well-formed; no later owning_view wording imported into C++20. |
| [range.ref.view](https://timsong-cpp.github.io/cppwp/n4861/range.ref.view) | Primary specification text, frozen draft mirror | Non-owning reference to another range and address capture; corroborates the local-lvalue lifetime trace. |
| [concepts.equality](https://timsong-cpp.github.io/cppwp/n4861/concepts.equality) | Primary specification text, frozen draft mirror | Syntactic satisfaction versus modeling example and semantic requirements; corroborates the concepts lesson. |
| [expr.prim.lambda.closure](https://timsong-cpp.github.io/cppwp/n4861/expr.prim.lambda.closure) | Primary specification text, frozen draft mirror | Unique unnamed closure type and const call operator without mutable; corroborates the lambda example. |
| [lex.string](https://timsong-cpp.github.io/cppwp/n4861/lex.string) | Primary specification text, frozen draft mirror | Ordinary literal array type and static storage duration; corroborates returned views in functions and runtime lessons. |
| [default.allocator](https://timsong-cpp.github.io/cppwp/n4861/default.allocator) | Primary specification text, frozen draft mirror | std::allocator declares is_always_equal=true_type; validates the non-throwing swap reasoning (CORE-005). |

Unavailable supplementary evidence: [official N4950 PDF](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4950.pdf) timed out on two direct retrieval attempts. Its body was not inspected. The accessible [N4951 editorial report](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4951.html) establishes the edition/date context, and both cited N4950 HTML clauses were inspected directly.

## Remaining limits

This is a bounded audit of these introductory modules, not certification of arbitrary programs derived from them, every standard-library operation mentioned in passing, every compiler’s conformance, or all later ISO defect resolutions. The reviewed code contains no hardware-specific or timing-dependent experiment. Published-ISO text, compiler support matrices, and deeper empirical comparisons would be necessary if future lessons make those stronger claims.

The full machine-readable mapping, classifications, source access status, exact proposed edits, and per-module coverage are in [cpp-core-findings.json](/home/lance/Documents/Code/Alexandria/docs/reviews/cpp-core-findings.json).
