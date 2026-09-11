# Curriculum depth and teaching standard

Status: Standing content requirement, adopted 2026-09-11. Applies to every topic, unit, subunit, and module, including future additions and revisions.

## What fast learning means here

Alexandria makes learning efficient through organization: clear prerequisites, a sensible sequence, focused objectives, useful navigation, and explanations that connect ideas. A module must teach its objectives in depth. A short description and one small example are insufficient. Learners should be able to understand the reasoning, explain the result, and apply the idea to a changed problem without having to reconstruct the missing lesson from external references.

Use the established C++ layout across subjects: topic → unit → subunit → module, with exactly three ordered, meaningfully titled lesson parts in each module. Unit and subunit introductions should establish scope, prerequisites, sequence, and connections to related subjects. Put detailed teaching inside the modules; extend a unit with additional focused modules when its scope requires them. Navigation structure and a list of headings do not establish complete subject coverage.

## Required teaching in every module

1. **Orient the learner.** State concrete learning objectives, assumed knowledge, the problem the idea solves, and terminology needed to follow the lesson. Explain cross-subject prerequisites where relevant.
2. **Explain the mechanism.** Develop the concept step by step, including why it works, the meaning of its parts, relevant assumptions, and the reasoning behind recommended practice. Define new terms before relying on them.
3. **Work through an example.** Give a complete problem and inputs, walk through the intermediate steps or state changes, and explain the result. Connect the example directly to the concept. Code listings need explanation around them; output alone is insufficient.
4. **Test the idea with a different case.** Include a second worked example, counterexample, or boundary scenario. Explain what changes, which assumption matters, and why the outcome follows. Cover relevant empty, invalid, limit, failure, lifetime, or concurrency cases without pretending every case applies to every subject.
5. **Provide meaningful practice and feedback.** Include at least two application, prediction, debugging, comparison, or transfer tasks with explained answers. Show the reasoning and address likely mistakes. A prompt followed only by the final answer is insufficient. The current reflection component reveals an ungraded explanation; it does not record an assessment or establish mastery.
6. **Consolidate and connect.** Recap the main reasoning, practical limitations and tradeoffs, and how the learner can use the idea in later material. Make the limits of the module's coverage explicit.

Distribute teaching and practice across all three parts. Each part should advance the learner's understanding; avoid adding a long appendix while leaving the main lesson skeletal. Part titles and examples should suit the subject instead of repeating generic template text. Optional enrichment may add depth without obscuring the essential path.

There is no fixed reading-time cap or word-count threshold. Word counts can reveal unusually thin sections during review, but length does not prove depth. Do not pad lessons with repeated definitions, generic advice, unsupported claims, or unnecessary jargon. Split an overloaded objective into another module while keeping each resulting module substantive.

## Evidence and technical correctness

Follow the [curriculum evidence policy](../docs/curriculum-evidence.md). Check language, protocol, tool, and library claims against the applicable primary specification or official documentation, identifying the edition or version. Use relevant peer-reviewed research for research findings, algorithms, and design rationale where it supports the claim. Do not attach unrelated papers to meet a citation quota, or describe official guidance as peer-reviewed evidence.

Provide useful source locators and record which passages were inspected. A bibliography entry, title, abstract, or table of contents is not evidence that an inaccessible passage was read. Label such access limits and distinguish further reading from verified support. Write original explanations; source books and extracted pages stay outside the application.

Make assumptions, units, input domains, platform constraints, and failure behavior explicit. Label hypothetical timings, simplified models, pseudocode, and illustrative traces. Independently check arithmetic and state transitions. Compile and run executable examples under their stated language baseline and compare expected output; neither a successful example nor a sequential trace proves every possible execution.

## Review and publication

Before publishing a new module or revision:

- Read it as a tutorial against its objectives. Confirm that a learner can follow the mechanism, both worked cases, and the reasoning in the practice answers without relying on unstated prerequisites.
- Review added claims and citation support, including boundary conditions and common misconceptions. Record factual corrections and verification limits in the release review.
- Validate the content schema and identities, check examples and calculations, and inspect the shared reader where presentation is affected. Structural checks and word counts supplement the teaching review.
- Preserve stable unit, module, and part identities. Publish changed lessons as new versions through the [content import workflow](../content/README.md#import-and-publication), retaining existing published content and learner history.

This requirement complements the [module design](modules.md) and [units database design](units-database.md). Their proposed assessment and resume features are separate implementation plans; the teaching standard applies to the content already delivered today.
