# C++ starter content

This small, original lesson establishes the reading interface with exactly this hierarchy:

```text
Software & Computing
└── C++ (topic)
    └── C++ (unit)
        └── Basics (sub-unit)
            └── Your first C++ program (module)
```

The module has three parts: a complete greeting program, an explanation of its pieces, and a small local experiment. Reflections are ungraded prompts. Installation creates no exercises, accounts, attempts, or learner progress. The module uses content schema version 1 and an empty completion policy. Reading it does not claim a grade or persist completion.

## Install explicitly

After database initialization and migrations, stop the server and run:

```sh
npm run content:cpp-basics
```

The command acquires the maintenance lock, creates a verified database backup, then publishes the topic, units, module, lesson parts, and citations in one transaction. It does not execute lesson code. Restart the server afterward.

Content is not seeded during initialization or startup. Running this command again validates the existing records and makes no content writes if they still match. A backup is still created on each invocation. Conflicting IDs, an unrelated topic using the `cpp` slug, or modified starter records cause an error without overwriting existing work. Future revisions need an explicit new content version, not edits to this published version.

Stable IDs use the `cpp_starter_` prefix. Topic and root-unit slugs are `cpp`, the child-unit slug is `basics`, and the module slug is `first-cpp-program`.

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

The draft links were consulted on 2026-09-11 and may evolve. This is a lesson in established C++ features, not a claim that a particular draft is a published ISO edition. The terminal example selects C++20 and explicitly assumes an installed GCC C++ compiler and standard library on Linux or macOS. It is not a universal compiler setup command. Alexandria does not execute source code in the browser or on the server for this module.
