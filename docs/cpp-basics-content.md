# C++ Basics content

Seven short, original modules establish the reading interface with this hierarchy:

```text
Software & Computing
└── C++ (topic)
    └── C++ (unit)
        └── Basics (sub-unit)
            ├── Your first C++ program
            ├── Variables, types, and initialization
            ├── Expressions and arithmetic
            ├── Making decisions
            ├── Repeating work
            ├── Functions
            └── Output and buffering
```

Each module has three parts, complete C++20 examples with expected output, and short explanations or ungraded reflection prompts. The first module covers a greeting program; the following modules introduce named values, arithmetic, selection, repetition, simple functions, and output buffering in that order. Further-reading links appear at the bottom of each module's final section and can be expanded in earlier sections. Final sections link to the next module in the same subunit, or back to the learning path at the end.

Installation creates no exercises, accounts, attempts, or learner progress. All modules use content schema version 1 and an empty completion policy. Reading does not claim a grade or persist completion.

## Install explicitly

After database initialization and migrations, stop the server and run:

```sh
npm run content:check -- cpp
npm run content:import -- cpp
```

The check validates the curriculum files without opening the database. C++ now includes the core and advanced subunits in the [curriculum map](curriculum-map.md), so this import publishes the entire expanded C++ root in one transaction after acquiring the maintenance lock and creating a verified backup. An existing Basics installation retains its seven stable module identities and twenty-one stable part identities, gains the new subunits, and receives the reviewed reference corrections as new published versions. It does not execute lesson code. Restart the server afterward. `npm run content:cpp-basics` remains an alias for importing this entire root; the historical TypeScript Basics helpers remain scoped to the original seven lessons for compatibility.

Content is not seeded during initialization or startup. Running this command again validates the existing records and makes no content writes if they still match. A backup is still created on each invocation. Conflicting IDs, an unrelated topic using the `cpp` slug, conflicting module slugs in Basics, partial owned records, or modified installed records cause an error without overwriting existing work. A failure rolls back the entire installation. Unrelated curriculum is preserved. Revisions use the next explicit `version` and a new `versionId`; existing published releases are retained.

The content lives in `content/units/cpp/`. The root `unit.json` declares the C++ unit and topic; `basics/unit.json` declares the child unit. Seven files, `01-first-program.json` through `07-output-and-buffering.json`, contain the modules, lesson parts, code examples, and source references. The starter retains its `cpp_starter_` IDs and the following modules retain their `cpp_basics_` IDs. Topic and root-unit slugs remain `cpp`; the child-unit slug is `basics`.

Moving the original definitions to JSON changed neither their lesson content nor database records. The curriculum expansion and correction releases preserve existing published Basics records; new versions supply the corrected references. No database schema migration is required. Reimporting a matching expanded installation makes no content writes. The generic loader discovers unit folders and modules; adding a new file does not require a TypeScript registration entry. See [Content authoring](../content/README.md) for the format, ordering, and validation rules.

## References and review

The explanations and examples are written for Alexandria; book pages and extracts are not imported into the application. The runtime stores bibliographic metadata, section locators, and public reference links. The 2026-09-11 corrections address audit findings BAS-R01 and BAS-L01.

All **27 standards-draft citation records across the seven modules** now identify the frozen **C++20 working draft N4861 (2020)**. Every one of their 25 distinct destination sections was opened and its relevant passages checked against the taught claim before updating the citation. The records include paragraph locators, an access date, and an explicit distinction between a primary standards draft and the published ISO edition. The HTML rendering identifies its underlying draft sources and generation date. [N4861 contents](https://timsong-cpp.github.io/cppwp/n4861/).

The mapping requires two edition-specific adjustments: the assignment clause is `[expr.ass]` in N4861, while the current draft calls it `[expr.assign]`; N4861 places the variable `auto` explanation directly in `[dcl.spec.auto]`, paragraphs 1 and 4, with deduction in `[dcl.type.auto.deduct]`, rather than in a `[dcl.spec.auto.general]` subsection. The other 24 distinct URL suffixes remain the same, with their N4861 paragraph locations verified individually. [Assignment](https://timsong-cpp.github.io/cppwp/n4861/expr.ass), [placeholder types](https://timsong-cpp.github.io/cppwp/n4861/dcl.spec.auto).

| Module | Primary documentation checked in N4861 |
| --- | --- |
| Your first C++ program | [Hosted main](https://timsong-cpp.github.io/cppwp/n4861/basic.start.main), [iostream declarations and objects](https://timsong-cpp.github.io/cppwp/n4861/iostream.objects), [string literals](https://timsong-cpp.github.io/cppwp/n4861/lex.string), [character literals and escapes](https://timsong-cpp.github.io/cppwp/n4861/lex.ccon), [header inclusion](https://timsong-cpp.github.io/cppwp/n4861/cpp.include). |
| Variables, types, and initialization | [List initialization](https://timsong-cpp.github.io/cppwp/n4861/dcl.init.list), [fundamental types](https://timsong-cpp.github.io/cppwp/n4861/basic.fundamental), [auto](https://timsong-cpp.github.io/cppwp/n4861/dcl.spec.auto), [const qualification](https://timsong-cpp.github.io/cppwp/n4861/dcl.type.cv), [Boolean output](https://timsong-cpp.github.io/cppwp/n4861/facet.num.put.virtuals) and the referenced [default stream flags](https://timsong-cpp.github.io/cppwp/n4861/basic.ios.cons). |
| Expressions and arithmetic | [Multiplication, division, and remainder](https://timsong-cpp.github.io/cppwp/n4861/expr.mul), [addition and subtraction](https://timsong-cpp.github.io/cppwp/n4861/expr.add), [arithmetic conversions](https://timsong-cpp.github.io/cppwp/n4861/expr.arith.conv), [assignment and compound assignment](https://timsong-cpp.github.io/cppwp/n4861/expr.ass), and [numeric types](https://timsong-cpp.github.io/cppwp/n4861/basic.fundamental). |
| Making decisions | [if statements](https://timsong-cpp.github.io/cppwp/n4861/stmt.if), [logical AND](https://timsong-cpp.github.io/cppwp/n4861/expr.log.and), and [logical OR](https://timsong-cpp.github.io/cppwp/n4861/expr.log.or). |
| Repeating work | [for statements](https://timsong-cpp.github.io/cppwp/n4861/stmt.for) and [while statements](https://timsong-cpp.github.io/cppwp/n4861/stmt.while). |
| Functions | [Function calls](https://timsong-cpp.github.io/cppwp/n4861/expr.call) and [return statements](https://timsong-cpp.github.io/cppwp/n4861/stmt.return). |
| Output and buffering | [Output manipulators](https://timsong-cpp.github.io/cppwp/n4861/ostream.manip), [unformatted output and flush](https://timsong-cpp.github.io/cppwp/n4861/ostream.unformatted), [standard narrow streams](https://timsong-cpp.github.io/cppwp/n4861/narrow.stream.objects), [input sentry](https://timsong-cpp.github.io/cppwp/n4861/istream.sentry), and [string literals](https://timsong-cpp.github.io/cppwp/n4861/lex.string). |

Additional documentation corroborates [character and string insertion](https://timsong-cpp.github.io/cppwp/n4861/ostream.inserters.character) and [function declarations](https://timsong-cpp.github.io/cppwp/n4861/dcl.fct). The [C++ Core Guidelines SL.io.50](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rio-endl) supplies expert practice guidance on avoiding unnecessary flushing; it is not a peer-reviewed research paper or a language specification. The toolchain example uses [GCC overall options](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html) and [warning options](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html). These language and tool behaviors are supported by primary documentation; a research paper is not substituted for their specification.

All seven book citations are explicitly **further reading**. Their bibliographic metadata identifies Bjarne Stroustrup, *The C++ Programming Language*, 4th edition, Addison-Wesley, 2013, ISBN 9780321563842. The author's edition page confirms that identity, and the extended contents confirms the section names below. [Author's edition page](https://www.stroustrup.com/4th.html), [extended table of contents](https://www.stroustrup.com/4thContents.html).

| Module | Suggested book sections (same edition) |
| --- | --- |
| Your first C++ program | §2.2 The Basics; §2.2.1 Hello, World! |
| Variables, types, and initialization | §2.2.2 Types, Variables, and Arithmetic; §2.2.3 Constants |
| Expressions and arithmetic | §2.2.2 Types, Variables, and Arithmetic |
| Making decisions | §9.4.1 if Statements |
| Repeating work | §9.5.2 for Statements; §9.5.3 while Statements |
| Functions | §12.1.1 Why Functions?; §12.1.3 Function Definitions; §12.1.4 Returning Values; §12.2 Argument Passing |
| Output and buffering | §38.4.3 Manipulators; §38.6 Buffering |

The book's passages and printed page numbers could not be independently rechecked in this review: the supplied local book mount was unavailable, and one attempt to open the author's linked sample returned HTTP 403. A contents page verifies section identity, not a section's text or pagination. Unverified exact page locators have therefore been removed from the learner-facing records, and metadata/section-only verification is stated explicitly. Before using the book as passage-level evidence in a future release, obtain access to the fourth-edition text, inspect the relevant sections, and record the verified printing and page locators. The language rules above were independently checked in N4861.

The terminal example selects C++20 and explicitly assumes an installed GCC C++ compiler and standard library on Linux or macOS. It is not a universal compiler setup command. Alexandria does not execute source code in the browser or on the server.
