# C++ Basics content

Six short, original modules establish the reading interface with this hierarchy:

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
            └── Functions
```

Each module has three parts, complete C++20 examples with expected output, and short explanations or ungraded reflection prompts. The first module covers a greeting program; the following modules introduce named values, arithmetic, selection, repetition, and simple functions in that order. Further-reading links appear at the bottom of each module's final section and can be expanded in earlier sections. Final sections link to the next module in the same subunit, or back to the learning path at the end.

Installation creates no exercises, accounts, attempts, or learner progress. All modules use content schema version 1 and an empty completion policy. Reading does not claim a grade or persist completion.

## Install explicitly

After database initialization and migrations, stop the server and run:

```sh
npm run content:check -- cpp
npm run content:import -- cpp
```

The check validates the curriculum files without opening the database. Import acquires the maintenance lock, creates a verified database backup, then publishes the topic, units, six modules, eighteen lesson parts, and citations in one transaction. On an existing starter installation, it adds only the five following modules. It does not execute lesson code. Restart the server afterward. `npm run content:cpp-basics` remains an alias for importing this root.

Content is not seeded during initialization or startup. Running this command again validates the existing records and makes no content writes if they still match. A backup is still created on each invocation. Conflicting IDs, an unrelated topic using the `cpp` slug, conflicting module slugs in Basics, partial owned records, or modified installed records cause an error without overwriting existing work. A failure rolls back the entire installation. Unrelated curriculum is preserved. Future revisions need explicit new content versions, not edits to these published versions.

The content lives in `content/units/cpp/`. The root `unit.json` declares the C++ unit and topic; `basics/unit.json` declares the child unit. Six files, `01-first-program.json` through `06-functions.json`, contain the modules, lesson parts, code examples, and source references. The starter retains its `cpp_starter_` IDs and the following modules retain their `cpp_basics_` IDs. Topic and root-unit slugs remain `cpp`; the child-unit slug is `basics`.

Moving these definitions to JSON changes neither lesson content nor database records. Reimporting an already matching six-module installation makes no content writes, and no schema migration is required. The generic loader discovers unit folders and modules; adding a new file does not require a TypeScript registration entry. See [Content authoring](../content/README.md) for the format, ordering, and validation rules.

## References and review

The explanations and examples are written for Alexandria; book pages and extracts are not imported into the application. The runtime stores only bibliographic metadata, section locators, and public reference links.

| Reference | Used to verify |
| --- | --- |
| Bjarne Stroustrup, *The C++ Programming Language*, 4th edition, Addison-Wesley, 2013, ISBN 9780321563842. §2.2, printed p. 38; §2.2.1, printed p. 39. [Author's edition page](https://www.stroustrup.com/4th.html). | Typical compilation and linking workflow; introductory program structure and output. The complete relevant pages of the supplied local book were read and visually inspected. |
| [C++ working draft: main function](https://eel.is/c++draft/basic.start.main), paragraphs 1, 2, and 5. | Hosted startup, `int main()`, and the special implicit `return 0` rule. |
| [C++ working draft: standard iostream objects](https://eel.is/c++draft/iostream.objects). | `<iostream>`, the `std` namespace, and `cout`'s relationship to standard output. |
| [C++ working draft: string literals](https://eel.is/c++draft/lex.string) and [character literals and escapes](https://eel.is/c++draft/lex.ccon). | Ordinary string literals, delimiters, and escape sequences. |
| [C++ working draft: source file inclusion](https://eel.is/c++draft/cpp.include). | Header inclusion during translation. |
| [C++ working draft: character insertion](https://eel.is/c++draft/ostream.inserters.character) and [stream manipulators](https://eel.is/c++draft/ostream.manip). | Stream insertion and the distinction between writing a newline and explicitly flushing a stream. |
| [GCC overall options](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html) and [warning options](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html). | The example's output filename and warning flags. |

Additional module references:

| Module | Book reading (same edition) | Primary documentation |
| --- | --- | --- |
| Variables, types, and initialization | §2.2.2, printed pp. 40–42; §2.2.3, printed p. 42 | [Fundamental types](https://eel.is/c++draft/basic.fundamental), [list-initialization](https://eel.is/c++draft/dcl.init.list), [auto](https://eel.is/c++draft/dcl.spec.auto), [const qualification](https://eel.is/c++draft/dcl.type.cv) |
| Expressions and arithmetic | §2.2.2, printed pp. 40–42 | [Multiplication, division, and remainder](https://eel.is/c++draft/expr.mul), [addition and subtraction](https://eel.is/c++draft/expr.add), [arithmetic conversions](https://eel.is/c++draft/expr.arith.conv), [numeric types](https://eel.is/c++draft/basic.fundamental) |
| Making decisions | §9.4.1, printed pp. 228–229 | [if statements](https://eel.is/c++draft/stmt.if), [logical AND](https://eel.is/c++draft/expr.log.and), [logical OR](https://eel.is/c++draft/expr.log.or) |
| Repeating work | §9.5.2–§9.5.3, printed pp. 235–236 | [for statements](https://eel.is/c++draft/stmt.for), [while statements](https://eel.is/c++draft/stmt.while) |
| Functions | §12.1.1, §12.1.3, and §12.1.4, printed pp. 306–310; §12.2, printed p. 315 | [Function calls](https://eel.is/c++draft/expr.call), [return statements](https://eel.is/c++draft/stmt.return), [function declarations](https://eel.is/c++draft/dcl.fct) |

The relevant supplied book pages were read and visually inspected. Public book links open the author's edition page; section and page locators tell readers where to continue in their own copy. Draft links provide technical detail and can be more demanding than the lesson itself.

The draft links were consulted on 2026-09-11 and may evolve. These lessons teach established C++ features; they do not treat a particular working draft as a published ISO edition. The terminal example selects C++20 and explicitly assumes an installed GCC C++ compiler and standard library on Linux or macOS. It is not a universal compiler setup command. Alexandria does not execute source code in the browser or on the server.
