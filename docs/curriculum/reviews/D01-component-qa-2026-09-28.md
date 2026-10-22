# D01 deterministic component QA

Date: 2026-09-28

This evidence covers the standalone deterministic workbench prototypes only. They do not connect to OpenMAIC, a model, Blender, the learner website, or a school environment. “AI executed” is a learner self-report field and is not independently verified by the workbench.

Commands run with bundled Node v24.19.0:

- `node --test tests/scripts/d01-local-components.test.mjs` — 4/4 pass.
- `node scripts/qa-d01-component-templates.mjs` — D01-01 to D01-06 each pass at 390×844 for two stateful interactions, required-field feedback and retry, local save/restore, English switch, no horizontal overflow, no console errors and no external requests. Desktop 1440px keyboard activation also passes with zero page errors.
- `node docs/curriculum/courses/D01-ai-3d-design-studio/validate-package.mjs --self-test` — `DOCUMENT_CHECKS_PASS`; all six lesson documents and original D01-01 Blender asset hashes/reopen evidence checked; six deliberate document defects rejected.
- `git diff --check` — pass.

Limitations: this is not a generated OpenMAIC classroom test; no narration/audio, screen-reader audit, student trial, school-tool execution, Blender operation in lessons 2–6, or timing validation is claimed. The planned 30-minute total path and 17-minute tool windows remain unvalidated.
