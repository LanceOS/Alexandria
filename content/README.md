# Curriculum content

Curriculum is ordinary JSON, separate from server and frontend code. Each unit has a folder with `unit.json`; each module is one JSON file inside its owning unit. Child folders define subunits. The loader discovers these files automatically, so adding a module requires no TypeScript import or registry change. All subjects share C++'s overview, expandable learning path, and section reader; subject-specific layouts are unnecessary. See the [curriculum map](../docs/curriculum-map.md) for the expanded catalog; the tree below shows the preserved Basics portion.

```text
content/
├── schemas/
│   ├── unit.schema.json
│   └── module.schema.json
└── units/
    └── cpp/
        ├── unit.json
        └── basics/
            ├── unit.json
            ├── 01-first-program.json
            ├── 02-variables.json
            ├── 03-expressions.json
            ├── 04-decisions.json
            ├── 05-loops.json
            ├── 06-functions.json
            └── 07-output-and-buffering.json
```

## Add a unit or module

1. Create a folder for the unit under `content/units/`, or inside an existing unit for a subunit. Give it a `unit.json` based on the examples below. A folder's name must equal its unit's slug.
2. Add one JSON file per module, using an existing module as a format reference. Assign new IDs to the module, first release, lesson parts, and citations. Follow the [evidence policy](../docs/curriculum-evidence.md): write original explanations and examples, verify technical claims against primary documentation, and use relevant peer-reviewed research for research-based claims. Include precise locators and record the inspected evidence.
3. Run `npm run content:check` to validate all roots, or `npm run content:check -- cpp` to validate only C++. This does not open or modify the database.
4. With the database initialized and current, stop the server, run `npm run content:import -- cpp`, and restart. Import selects the entire named root, including all descendants. Use `npm run content:import -- --all` to publish all roots in one transaction after a single verified backup.

Replace `cpp` with the root folder name when authoring another topic. Import expects the root topic's category IDs to identify existing published categories; it does not create categories.

The root [C++ unit.json](units/cpp/unit.json) includes unit fields and a `topic` object with `id`, `slug`, `name`, `description`, and `categories: [{ "id": "category_software", "position": 0 }]`. Only the root declares a topic. A child inherits its topic and parent from the folder structure; do not add `topic`, `topicId`, or `parentUnitId` to child files.

For example, a new `content/units/cpp/memory/unit.json` could start with:

```json
{
  "$schema": "../../../schemas/unit.schema.json",
  "id": "cpp_unit_memory",
  "name": "Memory",
  "slug": "memory",
  "description": "Explore object lifetimes and memory in C++.",
  "position": 1
}
```

`$schema` is optional and helps editors validate the file. The command always uses the checked-in [unit schema](schemas/unit.schema.json) and [module schema](schemas/module.schema.json); it does not fetch a schema from that field.

## Module format

[Your first C++ program](units/cpp/basics/01-first-program.json) is a complete example of the format.

| Field | Meaning |
| --- | --- |
| `id`, `versionId` | Stable module identity and the selected published release identity |
| `version` | Positive module-local release number; omitted means 1 |
| `slug`, `title`, `summary` | Module discovery and reader text |
| `position` | Nonnegative order within its owning unit |
| `objectives` | An array of learning objective strings |
| `parts` | Ordered sections, each with `id`, `title`, and `blocks` |
| `sources` | Ordered references, each with `id`, `title`, `authors`, `url`, and `locator` |

The importer creates the selected release with content schema version 1 and an empty completion policy. It publishes content explicitly; JSON definitions do not have draft or publication-status switches.

The reader accepts these block shapes:

| `type` | Fields |
| --- | --- |
| `paragraph` | `text` |
| `code` | `language` (`cpp`, `text`, or `shell`), `code`, optional `caption` |
| `callout` | `title`, `text` |
| `list` | `items` array of strings |
| `reflection` | `prompt`, `explanation` |

Text is rendered as text, without HTML or Markdown evaluation. Code is a JSON string: encode line breaks as `\n`, quotation marks as `\"`, and literal backslashes as `\\`. For example, a C++ newline escape inside a string literal needs `\\n` in the JSON source. A `text` code block can show expected output; a `shell` block can show a command. Alexandria does not execute either. Reflections reveal explanations without grading or saving attempts.

References accept optional `publisher`, `publicationYear`, `edition`, and `isbn`. Use a public HTTP(S) URL and a useful `locator`, such as the relevant documentation section or book chapter and printed page numbers. Book URLs may point to the author's edition page; the locator directs a reader to their own copy. Source IDs must be unique even when modules cite the same book, so use module-specific citation IDs. Private book files, extracted pages, and local paths do not belong in curriculum JSON.

### Shared lesson pattern

All included modules use exactly three ordered parts, measurable objectives, original explanatory paragraphs, a worked example, a reflection with an explanation, and sources. Section titles should describe the lesson's idea rather than repeat a generic template heading. New subjects state prerequisites and their boundary with C++ in the lesson or unit introduction. Language-neutral traces use `text` blocks and clearly state their assumptions; they are not presented as executable programs.

C++ examples use complete C++20 programs followed by a `text` block captioned `Expected standard output`. Explain borrowed lifetimes, representable input ranges, failure behavior, and platform assumptions where relevant. Later-standard features must be labeled and sourced to that edition; do not silently use them in a C++20 listing. Run `npm run content:test-examples` (or append `-- cpp` to select C++) in an authoring environment with a C++20 compiler. `CXX` selects a compiler executable, not a shell command. The script checks reviewed repository examples with warnings as errors and compares stdout; it does not execute shell blocks and is never run by the application or import command.

## Identity and ordering

- Keep stable IDs unchanged after import. Topic, unit, module, release, part, and source IDs must be unique across the complete catalog. Full-catalog validation catches identities repeated in different roots as well as duplicate topic slugs.
- Unit slugs are unique across a topic and match their folder names. Module slugs are unique within their owning unit.
- Sibling unit positions must be distinct; module positions must be distinct within each unit. Positions control display order. Numbered filenames are only a convenience for authors.
- Section order follows the `parts` array; block and reference order follows their arrays.
- Use regular files and directories inside the root. Symbolic links are rejected.

Validation checks JSON schemas and semantic rules before import. It catches unsupported fields and blocks, duplicate identities or positions, invalid URLs, and content that exceeds reader limits. It does not establish that a lesson is factually accurate: verify explanations against their references and check code examples before publishing.

## Import and publication

`content:import` acquires the maintenance lock, creates a verified database backup, and imports the selected root in one transaction. New units and modules can be added alongside existing ones. Matching records are preserved, including their timestamps. Conflicting slugs or IDs, partial existing content, or changed published definitions stop the import without replacing existing work. A failure rolls back all additions; unrelated database content is preserved. Each import creates a backup even when all content already matches.

For `--all`, every root is validated before opening the database. All selected topics are installed within one outer transaction, so a failure in a later topic rolls back earlier topic additions too. The option must be used alone; it cannot be combined with a topic name. Importing a single topic retains the existing command output and behavior.

Import preserves absent records. Deleting a source file does not delete the corresponding published database content. To revise a lesson, retain its stable module and part IDs, increment `version` by one, and assign a new `versionId`. Keep existing module discovery metadata unchanged. The importer publishes a new release and retains every earlier release and learner record; the reader selects the latest published version. Changing content under an existing release ID remains a conflict.

Keep a source ID when its bibliographic metadata is unchanged; its locator may differ between releases. A correction to a source title, authors, publisher, year, edition, ISBN, or URL requires a new source ID because prior releases retain their original bibliography. Added references also need new IDs. Never reuse an ID for a different module or entity.

An existing installation accepts the next sequential version or an exact rerun of the latest version. Skipped versions, downgrades, conflicting identities, and partial releases are rejected. A fresh installation may begin with the selected version even when earlier releases are not included in the files. Import reports `addedModules`, `addedVersions`, and `revisedModules`; a matching rerun reports zero for all three.

Published lesson JSON is compared after parsing and serialization. Whitespace is insignificant, but preserve object key order inside existing blocks as well as array order when reorganizing files; changing either can cause a conflict with the stored release.

The included JSON contains the latest reviewed release of each lesson. Corrections preserve stable module and part identities while using new release identities. Reimporting a matching installation makes no curriculum writes and requires no database migration. `npm run content:cpp-basics` remains an alias for `npm run content:import -- cpp`.

## Build and runtime

`npm run build` checks curriculum, clears obsolete build output, compiles the application, and copies this directory to `dist/content/`. The compiled operator commands resolve that packaged content independently of the current working directory:

```sh
node dist/server/commands/content-check.js cpp
node dist/server/commands/content-import.js cpp
```

Use the same storage environment as the server for imports. If running from another directory, use the absolute command path and explicitly supply the environment or an absolute `--env-file` path. Source commands select `content/units/`; compiled commands select `dist/content/units/`.

The frontend receives published lessons through the API. Curriculum JSON and schemas are not included in the client bundle or served as static files, and changing a file alone does not change the live library. Keep curriculum JSON in version control; database backups include the imported records rather than the content directory itself.
