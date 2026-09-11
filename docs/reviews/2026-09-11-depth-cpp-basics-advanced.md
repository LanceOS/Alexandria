# Depth review: C++ Basics and advanced modules — 2026-09-11

Baseline: `bf3f048`. The 19 modules below retain their objectives, stable module/part identities, and complete original C++20 programs while adding topic-specific tutorials throughout the existing three parts. This authoring review checks teaching depth and technical reasoning; it is not external peer review.

## Teaching coverage

| Module | Explanation and worked walkthrough | Contrasting cases and practice | Prose words | Explained reflections |
| --- | --- | --- | ---: | ---: |
| [Your first C++ program](../../content/units/cpp/basics/01-first-program.json) | Build/run separation; character versus status effects; two insertions forming one line | Missing newline and rebuilt-output diagnosis | 1429 | 3 |
| [Variables, types, and initialization](../../content/units/cpp/basics/02-variables.json) | Scalar state snapshots; type/domain distinction; initialization and later assignment | Narrowing versus a negative application value | 1314 | 3 |
| [Expressions and arithmetic](../../content/units/cpp/basics/03-expressions.json) | Grouping and units; quotient/remainder reconstruction; conversion timing | Negative dividend and indivisible versus fractional quantities | 1342 | 3 |
| [Making decisions](../../content/units/cpp/basics/04-decisions.json) | Disjoint input regions; ordered branch trace; short-circuit protection | Independent tests, chained comparisons, and invalid input | 1253 | 3 |
| [Repeating work](../../content/units/cpp/basics/05-loops.json) | Counter/accumulator invariant; complete final-false-test trace | Reset accumulator; move observation relative to decrement | 1293 | 4 |
| [Functions](../../content/units/cpp/basics/06-functions.json) | Argument mapping; local state; returned-value ownership | Ignored result versus two stored successive session results | 1352 | 3 |
| [Output and buffering](../../content/units/cpp/basics/07-output-and-buffering.json) | Character and synchronization layers; output versus terminal echo | Batch lines versus interactive status; integer prefix with leftovers | 1369 | 4 |
| [Computing and checking constants](../../content/units/cpp/compile-time-programming/01-constant-evaluation.json) | Eligibility, required evaluation, and mutability; configuration dependency trace | Boundary rejection and constinit-to-constexpr change | 1021 | 3 |
| [Selecting an implementation with if constexpr](../../content/units/cpp/compile-time-programming/02-type-directed-branches.json) | Type capabilities versus runtime data; specialization-by-specialization trace | Empty vector; rejected signed int; semantic negative count | 971 | 3 |
| [Reading dependent names](../../content/units/cpp/advanced-templates/01-dependent-names.json) | Parsing versus instantiation; whole-body requirement inventory | double accumulator; missing iteration/addition; empty identity | 1028 | 3 |
| [Forwarding arguments without changing their category](../../content/units/cpp/advanced-templates/02-forwarding-arguments.json) | Deduced T, collapsing, expression category, and ownership reviewed separately | const lvalue; removing forward; repeated consuming calls | 1012 | 3 |
| [Own threads and protect shared state](../../content/units/cpp/concurrency-cpp/01-scoped-threads-locks.json) | Independent lifetime and ordering proofs; named-guard schedule | Concurrent reader; check/update critical section; join-under-lock deadlock | 1077 | 3 |
| [Publish a result with release and acquire](../../content/units/cpp/concurrency-cpp/02-atomic-publication.json) | Explicit W-S-L-R happens-before proof; wait state checks | Writer-first timing; relaxed flag; unsafe repeated publication | 1043 | 3 |
| [Objects, storage, and representation](../../content/units/cpp/object-model-memory/01-object-representations.json) | Live-object byte round trip; size/alignment/representation distinctions | Arbitrary bytes versus saved bytes; explicit hypothetical octet encoding | 1101 | 3 |
| [Give a memory resource an explicit lifetime](../../content/units/cpp/object-model-memory/02-memory-resource-lifetimes.json) | Client/resource/buffer dependency graph and destruction order | Clear with retained capacity; moved resource-dependent client; second phase | 1073 | 3 |
| [Trace a coroutine’s suspension points](../../content/units/cpp/coroutines-async/01-coroutine-suspension.json) | Promise versus owner; full suspension state machine; awaiter roles | Omitted resume; ready awaiter; duplicated handle owner | 1014 | 3 |
| [Keep coroutine inputs alive across suspension](../../content/units/cpp/coroutines-async/02-coroutine-lifetimes.json) | Owning parameter and caller temporary timeline | Borrowed reference/view; abandonment versus second resume; retained callback | 1120 | 3 |
| [Separate a public interface from its implementation](../../content/units/cpp/library-engineering/01-implementation-boundaries.json) | Private access versus compile dependency; completeness at deletion | Implementation-only change versus changed behavior; inline destructor | 1053 | 3 |
| [Declare and check a library’s feature baseline](../../content/units/cpp/library-engineering/02-feature-compatibility.json) | Language/library/target inputs; capability gate and span lifetime | Missing/old/current/new macro; dangling span; explicit baseline upgrade | 1015 | 3 |

Prose counts include paragraph/callout text and reflection prompts/explanations; they exclude source metadata, code, trace blocks, headings, objectives, and lists. Counts are a coverage aid, not a definition of quality. Every module contains an original program, a detailed walkthrough, a contrasting worked scenario, and at least two explained practice checks.

## Evidence checked

All language claims remain grounded in the frozen N4861 C++20 working draft. Earlier N4950 links only establish explicitly labeled C++23 boundaries. The new tutorials use original reasoning and examples; they do not reproduce book or paper passages.

| Module area | Passages supporting the expanded teaching |
| --- | --- |
| Your first C++ program | basic.start.main; lex.string; GCC overall/warning options |
| Variables, types, and initialization | dcl.init.list; basic.fundamental; dcl.spec.auto |
| Expressions and arithmetic | expr.mul; expr.add; expr.arith.conv; expr.ass |
| Making decisions | stmt.if; expr.log.and; expr.rel; expr.mul |
| Repeating work | stmt.for; stmt.while; fundamental arithmetic bounds |
| Functions | expr.call; stmt.return |
| Output and buffering | ostream.unformatted; istream.sentry; facet.num.get.virtuals |
| Computing and checking constants | dcl.constexpr; expr.const; dcl.constinit |
| Selecting an implementation with if constexpr | stmt.if; expr.prim.req; concept.convertible |
| Reading dependent names | temp.res; temp.dep; temp.names |
| Forwarding arguments without changing their category | temp.deduct.call; forward; dcl.ref; lib.types.movedfrom; basic.life |
| Own threads and protect shared state | thread.jthread.class; thread.lock.guard; intro.races; mutex requirements |
| Publish a result with release and acquire | atomics.order; atomics.wait; atomics.types.operations; intro.races |
| Objects, storage, and representation | basic.types; basic.life; bit.cast |
| Give a memory resource an explicit lifetime | mem.res.monotonic.buffer; mem.poly.allocator.class; vector capacity |
| Trace a coroutine’s suspension points | dcl.fct.def.coroutine; expr.await; coroutine.handle.resumption |
| Keep coroutine inputs alive across suspension | dcl.fct.def.coroutine; basic.life; coroutine.handle.resumption |
| Separate a public interface from its implementation | unique.ptr.dltr.dflt; unique.ptr.single.dtor; Core Guidelines I.27; GNU ABI policy |
| Declare and check a library’s feature baseline | version.syn; views.span; GNU ABI policy; C++23 expected edition boundary |

During this pass the relevant N4861 passages were reopened for main, list initialization, division, decisions and short-circuiting, loops, function calls and returns, stream synchronization/sentry behavior, numeric input, relational comparisons, constant evaluation/initialization, dependent names, forwarding/collapsing and moved-from library objects, jthread/guards, release/acquire/wait, representations, monotonic resources, coroutine definition/await/resume/destruction, default deletion, and feature macros. New reference records directly support GCC build/warning options, chained comparisons and guarded division, numeric-prefix extraction, reference collapsing, and moved-from strings. GNU ABI API/ABI distinctions were reopened; their toolchain-specific scope is preserved.

The original Boehm–Adve research reference remains historical rationale for the concurrency model. The added ordering proof uses the C++20 draft, not that paper as a substitute for current language rules. Prior book access and historical journal review-policy limitations remain disclosed in the evidence ledgers; no new claim of inspecting inaccessible book passages is made.

Arithmetic traces were independently calculated (including quotient/remainder identities, boundaries, summations, and explicit 258 = 1 × 256 + 2 octet encoding). Ill-formed, dangling, and data-race variants are conceptual counterexamples, not advertised as runnable successful programs. The root release report records compilation, independent review, schema checks, publication, and preservation results.

## Independent review closure

A separate internal reviewer read all 19 expansions against their preserved baseline context and freshly checked selected primary clauses. One precision finding was corrected: the Pimpl lesson explicitly states that unique_ptr is noncopyable and Counter deletes copying, avoiding a suggestion that an implicit owner copy performs a bitwise copy. No further actionable accuracy or source-support findings remained.

Final checkpoint review moved or refined practice in the first-program, variables and expressions lessons and added a one-iteration countdown task. The reviewer confirmed their reasoning and prerequisite placement. All 57 parts now contain an explained practice checkpoint; Output and buffering and Repeating work contain one additional checkpoint each. The original 24 complete C++ programs and all original output/code blocks remain unchanged.
