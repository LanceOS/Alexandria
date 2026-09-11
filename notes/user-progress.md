# Alexandria: Users, Settings, and Learning Progress

Status: Planning draft. This document describes the proposed account and progress model; it does not create tables or migrations.

Related: [How modules work](modules.md) and [Units database design](units-database.md).

## Core approach

Only store progress when a learner starts material. An absent progress record means **not started**. Adding topics, units, or modules should not generate progress rows for every user.

Use one module-progress table with a status column rather than separate in-progress and completed tables. Completing a module updates its existing record, preserving identity and timestamps.

Initially, derive unit and topic progress from module records. Keep settings and exercise attempts separate from current progress.

## Proposed tables

### `users`

Stores account identity, with a stable `id` and creation/update timestamps. Exact profile fields and authentication tables depend on the authentication approach selected later.

Progress and settings reference the internal user ID, not a changeable email address. Authentication credentials and sessions are outside the scope of this note.

### `user_settings`

One optional settings row per user. Use `user_id` as both the primary key and a foreign key to `users.id`.

Potential fields:

- `theme`: system, light, or dark.
- `text_size`: an application-supported reading size.
- `motion_preference`: system, reduced, or full.
- `updated_at`.

Missing settings use application defaults. Create a row when the learner customizes a preference. System defaults should respect browser or operating-system preferences where applicable.

Use explicit fields for established settings. Add further preferences when product requirements are clear rather than collecting unrelated account data in a generic settings object.

### `user_topics` — conditional

Useful if a learner can select or enroll in a topic before starting a module.

| Field | Purpose |
| --- | --- |
| `user_id` | Foreign key to the learner |
| `topic_id` | Foreign key to the selected topic |
| `selected_at` | When the learner added the topic |
| `started_at` | Nullable; first learning activity in the topic |
| `last_activity_at` | Nullable; latest learning activity |

Use `(user_id, topic_id)` as the composite primary key. Selection alone does not mean any module has started. If explicit topic selection is not included initially, infer active topics through module progress instead.

Removing a topic from My Learning should not erase its module progress or attempts.

### `user_module_progress`

Stores one current progress row per learner and module. Use `(user_id, module_id)` as the composite primary key, with foreign keys to the corresponding records.

| Field | Purpose |
| --- | --- |
| `user_id` | Learner identity |
| `module_id` | Stable module identity |
| `status` | `in_progress` or `completed` |
| `started_at` | First start time |
| `last_activity_at` | Latest learning activity |
| `last_lesson_part_id` | Nullable resume location |
| `last_module_version_id` | Version associated with the resume location |
| `completed_at` | Nullable completion time |
| `completed_module_version_id` | Nullable version whose requirements were completed |

No `not_started` row is required. Validate that version and lesson-part references belong to the relevant module. A completed record requires a completion time and version; an in-progress record has neither.

The proposed lifecycle is:

```text
No row → Start module → in_progress → Meet requirements → completed
```

Starting means entering the learning experience or performing a learning activity, not merely seeing a module card in the catalog. Revisiting completed content preserves completion while allowing resume position and activity time to change.

The server determines completion from the module's requirements. The client cannot mark arbitrary modules completed without validation. Exact completion thresholds remain a product decision.

### `user_lesson_part_progress` — when needed

Long modules may need records of completed lesson parts in addition to a resume position. A bookmark does not prove earlier parts were completed when learners can navigate freely.

Store only parts actually completed, referencing the user, module version, lesson part, and completion timestamp. Enforce one completion record per user and versioned part. Stable part identities support reconciliation across harmless edits, but substantial version changes need an explicit policy.

Do not create records for every untouched part. Exercise drafts, if persisted separately, are also created only when the user enters work; their detailed schema remains open.

### `exercise_attempts`

Stores submitted work separately from current module progress.

Suggested fields include a stable attempt ID, user ID, exercise/version reference, submitted response, grading state, result, submission time, and grading time. Track assistance used where it affects interpretation of the result.

Each intentional retry creates a new attempt. Retrying the same network request must return the existing attempt rather than create another one; use a submission identifier with an appropriate uniqueness constraint.

Preserve previous attempts. Distinguish pending grading, infrastructure failure, and a graded incorrect answer. Hint requests and solution views may need separate events when they occur without a submitted attempt; they must not be recorded as successful answers.

Exact response formats and grading details belong to the assessment schema, including support for exercises that use rubrics or worked solutions rather than automatic grading.

## Derived unit and topic progress

Do not create a user-unit row merely because the catalog contains that unit. Aggregate the module records for the unit and its descendants.

| Condition | Display |
| --- | --- |
| No module activity and required modules exist | Not started |
| Activity exists but required modules remain incomplete | In progress |
| All required modules are completed under the applicable version policy | Completed |
| No required modules exist | No required modules |

Calculate completion as completed required modules divided by all applicable required modules. Untouched modules still count in the denominator even though they have no user-progress row. Optional modules do not block completion, and an empty denominator must not imply automatic completion.

Topic progress counts each required module once. Do not average unit percentages when units have different numbers of modules. Use the currently applicable published curriculum when calculating current coverage; archived or draft material should not silently count as required work.

If aggregation becomes expensive, introduce cached summaries with defined invalidation when module progress or the curriculum changes. Module records remain the source of truth.

## Historical completion versus current coverage

New required modules or major revisions can change current unit coverage. Preserve previous module completion evidence rather than silently deleting it.

If the product needs a lasting achievement such as “Completed this unit on this date,” add a separate historical completion record tied to a curriculum version or a snapshot of its requirements. This is distinct from a cache of current unit progress.

The initial current-progress row records one completion version. Preserving multiple completion events across revisions would require a dedicated history table. Decide this alongside curriculum versioning and achievement rules.

## Saving and consistency

- Create progress records on demand with uniqueness enforced by the database.
- Make related submission, grading, and completion updates atomic where applicable; asynchronous graders must safely tolerate retries.
- Save drafts and position at meaningful checkpoints and show save failures to the learner.
- Preserve completed status when a stale device submits older in-progress state.
- Define conflict handling for competing resume positions and draft edits before implementing cross-device editing.
- Authorize every read and write using the authenticated user; do not trust a client-supplied user ID.
- Catalog renaming and reordering preserve IDs and therefore preserve associated progress.

## Suggested indexes

Beyond primary keys, consider:

- `user_module_progress(user_id, last_activity_at)` for Continue Learning.
- `user_topics(user_id, last_activity_at)` if explicit topic selection is supported.
- `exercise_attempts(user_id, exercise_version_id, submitted_at)` for attempt history.

Finalize indexes around implemented queries. Fetch progress summaries in batches rather than one request per unit or module.

## Open decisions

- Authentication provider, identity fields, and account deletion/retention behavior.
- Whether learners explicitly add topics to My Learning.
- Exact module completion rules and lesson-part tracking granularity.
- Content-version policies for current coverage and historical achievements.
- Cross-device draft and resume conflict behavior.
- Detailed exercise, assistance-event, and draft schemas.

## Acceptance scenarios

- A new account has no preallocated curriculum progress rows.
- Adding a topic to the catalog does not write progress for existing users.
- Starting a module creates one in-progress row; completing it updates that row.
- Revisiting a completed module does not erase completion.
- A retry of one submission request does not duplicate the attempt.
- Untouched required modules count toward the unit's completion denominator.
- Unit progress includes nested subunits without double counting modules.
- A learner resumes through the same account on another device.
- Missing settings resolve to defaults, and saved preferences apply across devices.
- One learner cannot read or modify another learner's private progress.
