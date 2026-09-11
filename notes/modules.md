# Alexandria: How Modules Work

Status: Planning draft. This document records the intended learning experience and proposed implementation boundaries. It does not define the initial course catalog or commit to an implementation schedule.

## Purpose

Alexandria should help people learn efficiently through clear sequencing, detailed explanations, worked examples, and meaningful practice. Modules should provide enough depth to develop understanding and apply it, including mathematical reasoning and writing code where appropriate.

Modules are not restricted to short overviews or a fixed 5–15 minute duration. Longer modules should contain clear lesson parts and reliable pause-and-resume behavior so learners can study in smaller sessions.

## Curriculum hierarchy

See [Units database design](units-database.md) for the proposed tables and relationships.

```text
Category
  Topic
    Unit
      Subunit
        Module
          Lesson parts
            Content blocks and exercises
```

- Categories organize discovery, such as Software, Mathematics, and AI.
- Topics represent subjects, such as C++.
- Units group major areas within a topic.
- Subunits divide those areas into focused groups of modules.
- Modules teach a defined set of learning objectives.
- Lesson parts provide navigation and resume points within a module.

The proposed data model represents units and subunits using the same unit entity with an optional parent unit. This supports additional nesting for large subjects without introducing a new entity for every depth. The interface should emphasize units and subunits and use breadcrumbs and a collapsible outline when more depth is needed.

Each unit has a stable identifier, topic, optional parent, title, and explicit display order. Each module has one primary unit and an explicit display order. Parent relationships must not form cycles, and children must belong to the same topic as their parent.

Prerequisites are separate from the navigation hierarchy. A module may recommend knowledge from another unit or topic. Whether prerequisites ever prevent access remains an open product decision; the current preference is guidance with accessible browsing.

## Module structure

Each module should include:

1. **Orientation:** learning objectives, assumed knowledge, and why the material matters.
2. **Detailed explanation:** concepts, reasoning, terminology, and relevant limitations or edge cases.
3. **Worked examples:** step-by-step demonstrations that explain why each step is taken.
4. **Practice:** problems that require the learner to apply the material.
5. **Feedback:** useful explanations, graduated hints, and worked solutions.
6. **Recap:** key ideas, common mistakes, and connections to subsequent material.

These elements can repeat across lesson parts. Exercises should appear at meaningful checkpoints, not only at the end. Optional enrichment should be clearly distinguished from required material.

## Content representation

Proposed approach: store modules as versioned, validated structured content. Ordered lesson parts contain blocks that the client maps to reviewed React components.

| Block | Purpose |
| --- | --- |
| Explanation | Paragraphs, lists, definitions, and conceptual reasoning |
| Worked example | A problem or scenario with an explained solution |
| Code | Highlighted examples, annotations, and expected output |
| Mathematics | Equations, notation, and derivations |
| Diagram | Static illustrations or reviewed interactive components |
| Exercise | A question or task with a defined response format |
| Hint or solution | Graduated assistance and an explained answer |
| Recap | Key ideas and connections |

Authored content should not execute arbitrary JavaScript. Interactive blocks select a reviewed component from a registry and provide validated configuration. Source references can be attached to modules or individual lesson parts, and a module may draw from multiple references. Books are private authoring references only. Publish independently authored learning content and bibliographic citations, not the source books, scans, or extracted full text. Source files remain outside application storage, deployment artifacts, and backups; published modules must work without access to them.

Lesson parts, exercises, and modules need stable identifiers so progress survives harmless edits and reordering.

## Exercises and assessment

An exercise is separate from its visual presentation. It defines a prompt, response format, grading method, hints, explanation, and whether it is required for completion.

The architecture should accommodate:

- Multiple-choice and structured-answer questions.
- Numerical answers with explicit tolerance and units where relevant.
- Mathematical expressions with an appropriate equivalence-checking strategy.
- Code reading, output prediction, and debugging problems.
- Programming tasks evaluated against tests.

Not every exercise type must ship at once. Symbolic mathematics and executable programming tasks require dedicated implementation work and should not be treated as simple text comparisons.

The server owns authoritative grading and access to protected answer keys. Exercise responses sent to the client should contain only the information intended for the current learning interaction. Viewing solutions and requesting hints should be recorded separately from successful unassisted attempts.

For executable programming tasks, the proposed flow is:

```text
Client submission → API → Execution queue → Isolated runner → Result
```

Learner code runs outside the API process, with time and resource limits and without database credentials. Local SQLite stores submissions and results; it does not execute learner code. The API should expose queued, running, completed, and failed states, distinguishing infrastructure failures from incorrect answers.

## Progress and completion

Track three distinct concepts:

| Concept | Meaning |
| --- | --- |
| Position | The lesson part or exercise where the learner stopped |
| Completion | Required lesson parts and activities the learner finished |
| Performance | Results on assessed problems and the assistance used |

Module states are `not started`, `in progress`, and `completed`. Opening a module alone does not complete it. Learners can retry exercises without losing previous attempts, and using a hint does not erase their progress.

Completion requirements should be explicit per module. A potential rule is finishing required lesson parts and meeting a checkpoint threshold, but thresholds and the exact completion policy still need to be decided. Completion alone should not be presented as proof of mastery.

Unit and topic progress should aggregate required descendant modules. Do not average subunit percentages when subunits contain different numbers of modules. Optional modules should not unexpectedly prevent completion.

Save lesson position and exercise drafts at meaningful points, show saving failures, and allow retries without duplicate submissions. Account progress should be available across devices. Conflict handling for simultaneous sessions remains to be specified.

## Content versions and publishing

Proposed publishing flow: draft → preview → review → publish.

Published module versions should remain identifiable. Attempts and completion records reference the version they assessed, preserving the meaning of past results when content changes.

Reorganizing units must not erase progress. Policies for substantial module revisions and newly added required modules remain open: the application should distinguish historical completion from additional material available to study, rather than silently revoking achievements.

## Mobile and desktop experience

On mobile:

- Use a readable single-column lesson layout.
- Put the module outline in a drawer and provide clear previous/next navigation.
- Keep touch targets comfortable and navigation usable while the keyboard is open.
- Let wide code and equations scroll within their containers without widening the page.
- Preserve exercise drafts and make save status visible.
- Ensure all interactions work without hovering.

On desktop:

- Offer a persistent outline where space permits.
- Support an optional side-by-side lesson and practice view.
- Keep text within a comfortable reading width.

Both layouts should support keyboard navigation, visible focus, accessible contrast, and reduced motion. Heavy editors and interactive tools should load only when needed.

## Application boundaries

The planned client uses Vite, React, TypeScript, and Anime.js. The backend uses local SQLite with no required cloud services. See the [self-hosting implementation plan](../docs/self-hosting-plan.md) for storage, deployment, and recovery decisions.

| Location | Responsibility |
| --- | --- |
| `/client` | Module renderer, lesson navigation, exercise interfaces, and learning flows |
| `/library` | In-house reusable UI components, design tokens, layout primitives, and motion helpers |
| `/shared` | Validated content schemas and public API contracts shared by client and server |
| `/server` | Authentication, content publishing, authoritative grading, submissions, and progress persistence |

Learning-specific components initially live in the client. The library stays independent of courses and accounts. Shared schemas must not expose protected solutions or server credentials. Anime.js supports purposeful instructional animation and transitions, with cleanup and reduced-motion behavior.

## Decisions still needed

- Exact module completion rules and assessment thresholds.
- Which exercise types are included in the first release.
- Whether prerequisites ever restrict access.
- When hints and full solutions become available.
- How substantial content revisions affect current and historical progress.
- How competing edits to drafts or progress across devices are resolved.
- The initial content-authoring interface and runner technology, if executable tasks are included.

## Acceptance scenarios

- A learner navigates from a topic through a unit and subunit into a module.
- A detailed module supports explanations, worked examples, and problems without requiring a custom application page.
- A learner pauses midway through a module and resumes through the same account on another device.
- Retried requests do not create duplicate attempts or completion records.
- A learner receives useful feedback and can retry a problem while retaining attempt history.
- Reordering units does not lose saved progress.
- A published content update preserves the version associated with prior attempts.
- Lessons and exercises remain usable on narrow mobile screens and desktop layouts.
