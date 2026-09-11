# Learning progress and quests

The course reader and learning paths now support saved reading activity across all published courses. Sign in through the account menu using a local Alexandria account; an administrator can create accounts with the existing `account:create` command. Reading remains available without an account.

## Reading and rewards

- Select **Mark section read** after working through a section. Opening a page or revealing an explanation does not complete it.
- Each distinct section earns **10 XP** on its first completion. Finishing all sections in a module earns a **20 XP** bonus the first time that module is completed.
- Repeated clicks, request retries, and rereading the same stable section in a newer release do not award duplicate XP.
- The learning path shows saved section counts and current reading completion. Continue Learning finds unfinished reading; explicit section links still open the requested section.
- Activity milestones celebrate a first section, a first module, and five completed modules. They describe reading activity, not assessed mastery.
- Choose a weekly target from **1 to 14 modules**, defaulting to 3. The week begins Monday in the browser's time zone. The counter uses first module completion dates. Missing a week does not remove earned XP or milestones.

The app saves records against the signed-in user. Signing out clears personal progress from the interface, and account changes invalidate other open tabs. Personal progress reads carry the current session token so a concurrent account switch cannot return another account's progress under the old name. Errors leave a retry path and never award speculative client-side XP.

## Curriculum revisions

Historical completion and earned XP remain intact when lessons change. Section checkmarks describe the currently published version, so revised reading can appear unfinished while an earlier completion remains recorded. Repeated stable sections do not earn new XP; newly added stable sections can. The weekly counter and module bonus continue to use the original module completion.

The reading endpoint accepts only visible published modules and the current version. It supports modules with an empty completion policy and no required exercises, matching the current catalog. It rejects other completion policies instead of treating reading as passing an assessment. All changes require a valid session, CSRF token, and the normal API request header.

## C++ Basics practice

Each of the seven Basics modules has a self-check quest on its final section. The last module also contains a three-part boss challenge combining functions, loops, decisions, and boundary tests. Questions offer answer choices, optional hints, explanations, and retries. Feedback distinguishes a first correct answer from a correct answer after help.

Self-check results last for the current visit; they do not award XP, save grades, establish mastery, or execute learner code. Existing curriculum reflections keep their original behavior.

Quest content lives in `content/practice/cpp-basics.json`, separately from immutable published lessons. Each set names the exact reviewed lesson version. The API returns an empty set when that version no longer matches, or when a module has no quests; it returns 404 when the module is not visible. Review and update the quest version when changing its lesson. `content:check` validates these references when checking C++. The build copies this JSON into `dist/content/`, and the server validates it before serving practice. Practice answers are public learning material, separate from protected assessment grading specifications.

## Upgrading an existing installation

Stop the existing server, run `npm run db:migrate`, then build and restart the application using the normal deployment process. Migration `0006_learning_goals` adds the goal table and preserves the existing progress schema and records. The migration command creates a verified backup. A fresh `db:init` includes this migration automatically.

Published curriculum JSON is unchanged by these features; no content reimport is needed when the installation already has the current lesson releases.
