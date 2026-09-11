# Algorithm Analysis source-comparison review — 2026-09-11

Before committing the [six-module release](2026-09-11-algorithm-analysis.md), the lessons were compared with their cited sources for copied wording, close restatements of distinctive explanations, source code listings, worked examples, exercises, and attribution gaps. No actionable direct-copying issue was found within the comparison scope below. The [release manifest](2026-09-11-algorithm-analysis-manifest.json) identifies the exact reviewed lesson files; their hashes remained unchanged after this review.

## Passage and example comparison

Independent reviewers compared all six lessons, including eight programs and 36 practice prompts, with the actual supporting passages recorded in the [source ledger](../research/algorithm-analysis.md).

| Lessons | Material compared and findings |
| --- | --- |
| Count search work; prove a loop correct; describe growth | CLRS §§1.1, 2.1–2.2, 3.1–3.3 and Appendix A.1, including the related linear-search exercises 2.1-4 and 2.2-3; NIST search/big-O entries; relevant N4861 control-flow and range-for clauses. The sources cover the same standard proof and average-count topics, but the lessons do not reproduce their distinctive wording or exercises. The first-match contract, skip-two counterexample, last-match transfer, mixed hit/miss question, and workload scenarios are developed in different teaching contexts. |
| Build and verify binary search | Stroustrup §32.6.1 and §§33.1.1–33.1.2; the NIST binary-search entry; N4861 binary-search, lower-bound, and random-access clauses. The three programs, labeled traces, boundary cases, and reflections do not reproduce a source listing, worked dataset, or exercise. Canonical API names, interval notation, midpoint arithmetic, and logarithmic formulas are shared technical material whose foundations are attributed. |
| Analyze insertion sort; explain merge sort | CLRS §§2.1–2.3, 3.3, 4.3–4.4 and Appendix A.1–A.2. The insertion lesson uses its own duplicate-labeled trace, saved-hole explanation, practice questions, and key-comparison/shift instrumentation. The merge lesson uses an odd-length record example and reusable-buffer, half-open-range C++; its implementation and teaching examples differ from the book's temporary left/right arrays and inclusive-range pseudocode. Standard invariant stages, arithmetic sums, and recurrence algebra are credited rather than presented as newly invented results. |

No sentence-by-sentence restatement, distinctive copied paragraph, textbook diagram, copied answer key, or source exercise set was identified in that review. Merely choosing different input numbers would not establish independent authorship; reviewers also examined the surrounding exposition, contracts, tasks, and implementation decisions.

## Local exact-phrase check

A supplementary local scan compared **276 authored text fields containing 13,529 normalized tokens** against the full extracted text of the two source books: **466,841 tokens across 1,677 PDF pages** for CLRS and **462,334 tokens across 1,366 PDF pages** for Stroustrup. The scan included lesson prose, headings, objectives, reflection questions/answers, and captions. Bibliographic entries were excluded because their titles and metadata must match the cited works. Code and trace listings received the separate comparison above.

The scan normalized Unicode and case, treated punctuation as separators, joined line-end hyphenation, and inspected maximal contiguous matches of six or more tokens. The longest match was **eight normalized tokens**, consisting of conventional wording for a best-case linear running-time bound. Other matches were shorter ordinary phrases, standard mathematical notation, or a simple number sequence. No long matching passage was found. Generic technical language was retained rather than rewritten merely to reduce a similarity score.

The extraction, phrase comparison, and source inspection remained local. Book files, extracts, page images, and raw matching-source output are absent from the commit.

## Attribution clarification and future authoring

The ledger and release report now explicitly describe the lessons as independently written teaching and implementations of **established algorithms and proof methods**. “Original” refers to the exposition and teaching examples, not an assertion that Alexandria invented these algorithms or theorems. The existing module bibliographies credit the authors, editions, and relevant sections.

The [standing authoring standard](../../notes/curriculum-depth.md) now requires this distinction and a comparison against relevant sources before publication. It also addresses close restatements and copied examples, rather than relying solely on exact-phrase matching.

This review compares the current unit with the identified source material. Text extraction and exact matching have limits, and the check is not a search of every publication or a guarantee of universal uniqueness. No lesson-content correction was needed; documentation was clarified without changing the already validated and locally published lesson versions.
