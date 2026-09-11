import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { LessonBlock } from '../../shared/curriculum.js';
import { transaction } from '../db/transaction.js';

export const cppBasicsIds = {
  topic: 'cpp_starter_topic',
  unit: 'cpp_starter_unit_cpp',
  basics: 'cpp_starter_unit_basics',
  module: 'cpp_starter_module_first_program',
  version: 'cpp_starter_version_1',
} as const;

export const cppBasicsParts: Array<{ id: string; title: string; blocks: LessonBlock[] }> = [
  {
    id: 'cpp_starter_part_program',
    title: 'A small program with a visible result',
    blocks: [
      { type: 'paragraph', text: 'A first program gives you something small enough to understand completely. In this module, you will read a C++ program that writes a greeting, identify the pieces that make it work, and predict what happens when the message changes. You do not need previous programming experience. Follow the example a line at a time; the punctuation will become familiar through use.' },
      { type: 'code', language: 'cpp', caption: 'main.cpp — a complete program', code: '#include <iostream>\n\nint main()\n{\n    std::cout << "Hello, Alexandria!\\n";\n}\n' },
      { type: 'paragraph', text: 'This is source code: text that describes a program. A typical C++ toolchain compiles that text into object code, then links it with the support it needs to produce an executable. Running the executable is a separate step. A build command or an editor may perform several of those steps for you, but editing a source file alone does not change an executable you built earlier.' },
      { type: 'code', language: 'text', caption: 'Expected standard output', code: 'Hello, Alexandria!\n' },
      { type: 'paragraph', text: 'The greeting goes to standard output, a destination that is usually connected to your terminal when you run a console program. It can also be redirected elsewhere, such as a file. The double quotation marks and the semicolon belong to the source code; they are not part of this output.' },
      { type: 'callout', title: 'A regular desktop program', text: 'These examples use a hosted C++ environment, such as a compiler and standard library on a desktop operating system. Specialized freestanding environments, including some embedded systems, can have different startup rules.' },
    ],
  },
  {
    id: 'cpp_starter_part_anatomy',
    title: 'Read the program, one piece at a time',
    blocks: [
      { type: 'paragraph', text: 'The first line, #include <iostream>, makes the standard input and output stream declarations available. One of those declarations is std::cout. An include directive is handled while the program is being translated; it is not an instruction that prints anything when the executable runs. Keep this line when you use std::cout.' },
      { type: 'paragraph', text: 'The line int main() begins a function definition. A function groups work under a name. In a hosted program, main is the function invoked by the startup machinery. Here, the empty parentheses declare that it takes no parameters. The braces mark its body, where we put the output statement. The word int specifies the type of status value that main returns to the surrounding environment.' },
      { type: 'callout', title: 'Why is there no return statement?', text: 'Reaching the closing brace of main has the same effect as returning 0, which indicates successful termination. You may write return 0; explicitly. This permission is special to main; do not assume that every function returning an int can omit its return value.' },
      { type: 'list', items: [
        'std::cout names the standard output stream. The std:: prefix qualifies cout as a name in the standard library namespace.',
        'The << operator, used here with an output stream and text, inserts that text into the stream. Its meaning depends on the kinds of values used with it.',
        '"Hello, Alexandria!\\n" is an ordinary string literal. The double quotes delimit the text in the source. Inside this literal, \\n represents a newline character.',
        'The semicolon ends this expression statement. Indentation makes the body easier to read, while the braces determine where the function body begins and ends.',
      ] },
      { type: 'paragraph', text: 'The newline moves subsequent text to a new line on a typical terminal. It does not, by itself, guarantee that an output buffer is flushed immediately. That distinction will matter when you learn more about streams; for this short program, focus on the characters being written.' },
    ],
  },
  {
    id: 'cpp_starter_part_experiment',
    title: 'Change, build, and observe',
    blocks: [
      { type: 'paragraph', text: 'Try changing only the words inside the quotation marks to "I am learning C++!\\n". Keep the quotes, the newline escape, and the semicolon. Before running anything, predict the output. Then save the file, build it again, and run the new executable. Comparing a prediction with a small, observable result is a useful habit when learning a language.' },
      { type: 'code', language: 'text', caption: 'Expected output after changing the message', code: 'I am learning C++!\n' },
      { type: 'paragraph', text: 'If you already have a GCC C++ compiler and standard library installed on Linux or macOS, save the complete example as main.cpp and use the following command from that directory. It chooses C++20 mode, enables useful warnings, names the executable hello, and runs it only if the build succeeds. Other compilers and editors have their own build commands.' },
      { type: 'code', language: 'shell', caption: 'Terminal example — GCC on Linux or macOS', code: 'g++ -std=c++20 -Wall -Wextra main.cpp -o hello && ./hello' },
      { type: 'reflection', prompt: 'What would happen if you removed only \\n from the original greeting?', explanation: 'The same greeting characters would be written, but this statement would no longer write a newline after them. A terminal prompt or later output could appear immediately after the exclamation mark. This is a prediction to discuss or try locally; it is not a graded exercise.' },
      { type: 'paragraph', text: 'If the build reports an error, compare the first reported location with the example. Check paired quotes and braces, the spelling of std::cout, and the final semicolon. Fix one difference, then rebuild. You have finished this first reading when you can explain the greeting and predict the effect of changing it.' },
    ],
  },
];

const objectives = [
  'Recognize the entry point and body of a simple hosted C++ program.',
  'Explain how an include directive, std::cout, and a string literal produce output.',
  'Predict a small change and distinguish editing, building, and running.',
];
const summary = 'Read a complete program, understand its output, and make one small change.';
const title = 'Your first C++ program';

const sources = [
  { id: 'cpp_starter_source_book', title: 'The C++ Programming Language', authors: ['Bjarne Stroustrup'], publisher: 'Addison-Wesley', publicationYear: 2013, edition: '4th edition', isbn: '9780321563842', url: 'https://www.stroustrup.com/4th.html', locator: '§2.2 The Basics, p. 38; §2.2.1 Hello, World!, p. 39' },
  { id: 'cpp_starter_source_main', title: 'C++ working draft: main function', authors: ['ISO/IEC JTC1/SC22/WG21'], url: 'https://eel.is/c++draft/basic.start.main', locator: '[basic.start.main], paragraphs 1, 2, and 5; consulted 2026-09-11' },
  { id: 'cpp_starter_source_streams', title: 'C++ working draft: standard iostream objects', authors: ['ISO/IEC JTC1/SC22/WG21'], url: 'https://eel.is/c++draft/iostream.objects', locator: '[iostream.syn], [iostream.objects.overview], and [narrow.stream.objects]; consulted 2026-09-11' },
  { id: 'cpp_starter_source_strings', title: 'C++ working draft: string literals', authors: ['ISO/IEC JTC1/SC22/WG21'], url: 'https://eel.is/c++draft/lex.string', locator: '[lex.string], ordinary string literals and escape sequences; consulted 2026-09-11' },
  { id: 'cpp_starter_source_escapes', title: 'C++ working draft: character literals and escapes', authors: ['ISO/IEC JTC1/SC22/WG21'], url: 'https://eel.is/c++draft/lex.ccon', locator: '[lex.ccon], simple escape sequences; consulted 2026-09-11' },
  { id: 'cpp_starter_source_includes', title: 'C++ working draft: source file inclusion', authors: ['ISO/IEC JTC1/SC22/WG21'], url: 'https://eel.is/c++draft/cpp.include', locator: '[cpp.include], header inclusion; consulted 2026-09-11' },
];

type Row = Record<string, SQLInputValue>;
interface ExpectedRecord { table: string; key: Row; values: Row }

function expectedRecords(): ExpectedRecord[] {
  const ids = cppBasicsIds;
  return [
    { table: 'topics', key: { id: ids.topic }, values: { slug: 'cpp', name: 'C++', description: 'Understand C++ through small programs and carefully explained examples.', status: 'published', revision: 1 } },
    { table: 'topic_categories', key: { topic_id: ids.topic, category_id: 'category_software' }, values: { position: 0 } },
    { table: 'units', key: { id: ids.unit }, values: { topic_id: ids.topic, parent_unit_id: null, name: 'C++', slug: 'cpp', description: 'A practical introduction to the C++ programming language.', position: 0, status: 'published' } },
    { table: 'units', key: { id: ids.basics }, values: { topic_id: ids.topic, parent_unit_id: ids.unit, name: 'Basics', slug: 'basics', description: 'Start with a small program and learn how its pieces fit together.', position: 0, status: 'published' } },
    { table: 'modules', key: { id: ids.module }, values: { unit_id: ids.basics, title, slug: 'first-cpp-program', summary, position: 0, is_required: 1, status: 'published' } },
    { table: 'module_versions', key: { id: ids.version }, values: { module_id: ids.module, version: 1, title, summary, status: 'published', content_schema_version: 1, objectives_json: JSON.stringify(objectives), completion_policy_json: '{}', revision: 2 } },
    ...cppBasicsParts.flatMap((part, position): ExpectedRecord[] => [
      { table: 'lesson_parts', key: { id: part.id }, values: { module_id: ids.module } },
      { table: 'lesson_part_versions', key: { lesson_part_id: part.id, module_version_id: ids.version }, values: { module_id: ids.module, title: part.title, position, is_required: 1, content_json: JSON.stringify(part.blocks) } },
    ]),
    ...sources.flatMap((source, position): ExpectedRecord[] => [
      { table: 'source_references', key: { id: source.id }, values: { title: source.title, authors_json: JSON.stringify(source.authors), publisher: source.publisher ?? null, publication_year: source.publicationYear ?? null, edition: source.edition ?? null, isbn: source.isbn ?? null, doi: null, url: source.url } },
      { table: 'module_version_sources', key: { module_version_id: ids.version, source_reference_id: source.id }, values: { locator: source.locator, position } },
    ]),
  ];
}

function findRecord(database: DatabaseSync, record: ExpectedRecord) {
  const predicate = Object.keys(record.key).map((key) => `${key} = ?`).join(' AND ');
  return database.prepare(`SELECT * FROM ${record.table} WHERE ${predicate}`).get(...Object.values(record.key));
}

function assertInstalled(database: DatabaseSync, records: ExpectedRecord[]): void {
  for (const record of records) {
    const actual = findRecord(database, record);
    if (!actual || Object.entries(record.values).some(([key, value]) => actual[key] !== value)) {
      throw new Error(`C++ starter content conflicts with existing ${record.table} records. No content was changed; review the existing curriculum before installing.`);
    }
  }
  const counts = [
    ['topic_categories', 'topic_id', cppBasicsIds.topic, 1],
    ['lesson_part_versions', 'module_version_id', cppBasicsIds.version, cppBasicsParts.length],
    ['module_version_sources', 'module_version_id', cppBasicsIds.version, sources.length],
    ['exercise_versions', 'module_version_id', cppBasicsIds.version, 0],
  ] as const;
  for (const [table, key, id, count] of counts) {
    if (database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${key} = ?`).get(id)?.count !== count) {
      throw new Error(`C++ starter content has unexpected ${table} associations. No content was changed.`);
    }
  }
}

/** Explicit content installation, never a schema migration or a server startup side effect. */
export function installCppBasics(database: DatabaseSync) {
  return transaction(database, () => {
    const category = database.prepare('SELECT slug, status FROM categories WHERE id = ?').get('category_software');
    if (category?.slug !== 'software' || category.status !== 'published') {
      throw new Error('The published Software category is required before installing the C++ starter content.');
    }
    const records = expectedRecords();
    const result = { topicId: cppBasicsIds.topic, moduleId: cppBasicsIds.module, topics: 1, units: 2, modules: 1, parts: cppBasicsParts.length };
    if (records.some((record) => findRecord(database, record) !== undefined)) {
      assertInstalled(database, records);
      return { created: false, ...result };
    }
    if (database.prepare('SELECT id FROM topics WHERE slug = ?').get('cpp')) {
      throw new Error('A different topic already uses the cpp slug. No content was changed; review that topic before installing.');
    }
    for (const record of records) {
      const values = { ...record.key, ...record.values };
      if (record.table === 'modules') values.status = 'draft';
      if (record.table === 'module_versions') { values.status = 'draft'; values.revision = 1; }
      const columns = Object.keys(values);
      database.prepare(`INSERT INTO ${record.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`).run(...Object.values(values));
    }
    database.prepare("UPDATE module_versions SET status = 'published', revision = revision + 1, published_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(cppBasicsIds.version);
    database.prepare("UPDATE modules SET status = 'published', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?").run(cppBasicsIds.module);
    assertInstalled(database, records);
    return { created: true, ...result };
  });
}
