# D01 OpenMAIC generation and post-generation assembly QA

Date: 2026-09-29 (Asia/Hong_Kong). Scope: six private OpenMAIC generations, deterministic local assembly, OpenMAIC DSL schema audit, source-package checks, and workbench component browser QA. This is not learner-site publication, a school pilot, or verification that Astra/Codex actually operates Blender in a school environment.

## Generated classroom ledger

| Lesson | Job | Hosted classroom | Hosted terminal | Scenes | Quota | Local assembly and DSL audit |
| --- | --- | --- | --- | ---: | ---: | --- |
| D01-01 桌面小怪獸 | `dRctH0E-cv` | `ieDmKjpXBs` | succeeded | 9 | 1 | pass |
| D01-02 怪獸收納站 | `c3cELVu36f` | `7gyEJ4XKzL` | succeeded | 9 | 1 | pass |
| D01-03 口袋秘密基地 | `GNXTd4ToNF` | `44NNsAL1XN` | succeeded | 9 | 1 | pass |
| D01-04 五秒小劇場 | `ToCo1WPpcO` | `rnGt2q-sUI` | succeeded | 9 | 1 | pass |
| D01-05 影子猜謎機 | `Y9SHIDt350` | `-TeDjquwIf` | succeeded | 9 | 1 | pass |
| D01-06 迷你奇想展 | `DDSmuRuA6L` | `Vb-qsqAsv_` | succeeded | 9 | 1 | pass |

Each source package has its own one-use manifest and generation quality review. All six submissions used one quota unit and disabled hosted web search, image generation, video generation, and TTS. No classroom has been imported to the student site or published there.

## Findings and repair

- D01-01's raw hosted draft completed but failed the course acceptance audit: its nine scenes were eight slides and one quiz, without the required interactive/PBL learning path; agent text mixed language and asserted a Blender operator connection that does not exist. It was not accepted as the final course. A same-ID write-back request returned HTTP 201, but a follow-up no-cache GET still returned the original draft. No retry was made; hosted correction is unverified and must not be treated as complete.
- A full Unicode Hangul scan found Korean-script contamination in the raw hosted decks D01-01 (`오늘개선必交標題`, 2 Hangul syllables) and D01-06 (184 Hangul characters across slide text, including Korean labels and malformed fragments). D01-02 through D01-05 raw snapshots had none. All six corrected local classroom JSONs and all six `.maic.zip` import packages have zero Hangul characters in text; all six local audits pass. The ZIP exporter now refuses any source classroom containing Hangul. The original hosted IDs remain unchanged, so those two raw previews are still contaminated and must not be used as final classroom content.
- D01-03 generated an extra student persona. Local assembly normalizes this to the intended design coach, explicitly non-executing operator role, and two distinct AI peers.
- **Instructional-sequence defect discovered after import review:** in the first local assembly, scene 2 was a scored, single-answer `quiz` (10 points) placed before the core-concept slide at scene 3. This failed the learner sequence even though the design document called it a “readiness diagnostic.” The root cause was a design-to-render mismatch: the source contract treated the prompt as activation, but the assembler rendered it as a scored OpenMAIC quiz; the local audit then enshrined `slide / quiz / slide` as its expected sequence and explicitly required a deterministic readiness answer. The workbench browser QA never exercised the full classroom scene order. This is a QA escape, not an acceptable interpretation of a passing quality gate.
- **Local sequence repair complete; hosted-player confirmation pending:** D01-01 to D01-06 local assemblies now state the learning goal and lesson path on scene 1; scene 2 is an open observation explicitly marked “not a test / no score”; scene 3 teaches the key concept; quiz-style peer challenge appears only after the concept and interactive practice. The six source lesson maps and the static sequence gate were updated together. The original hosted snapshots remain unchanged. The corrected ZIPs have not yet been re-imported into the OpenMAIC UI, so do not treat the visual/player repair as user-visible in OpenMAIC yet.
- The six corrected candidates are assembled from the canonical per-lesson source, not from generated factual claims. Each has nine scenes (`slide / quiz / slide / interactive / slide / quiz / slide / pbl / quiz`), lesson-specific principle and attributed first-party source summary, a two-interaction stateful workbench, one bounded AI-peer discussion, three-step PBL portfolio workflow, privacy and untested-result boundaries, and a transfer response.
- The prior local sequence audit passed the wrong sequence because it asserted the faulty order; those earlier passes are superseded. After repair, all six corrected assemblies passed the revised sequence/DSL/content/media audit; document self-test, four workbench tests, and six-lesson mobile/desktop workbench browser tests passed. This still does not prove the full OpenMAIC classroom player rendered the new version.
- Cantonese audio was regenerated for all six current packages: 7 narration clips per lesson (42 total), `zh-HK-WanLungNeural` at `+20%`; all 42 decode with `ffprobe`. An earlier D01-01 package was imported into the OpenMAIC UI's local course library and narration played there, but that imported version predates the current sequence/audio-text repair and does not validate it. Full-player import/playback for the current versions remains pending.
- Component browser QA passed for all six lesson-specific workbenches at 390×844 and at 1440px desktop keyboard use: two stateful interactions each, feedback/retry, save/restore, language switch, zero external requests and zero console/page errors. The exact runner is `scripts/qa-d01-component-templates.mjs`.
- `node --test tests/scripts/d01-local-components.test.mjs`: 4/4 pass. `node docs/curriculum/courses/D01-ai-3d-design-studio/validate-package.mjs --self-test`: `DOCUMENT_CHECKS_PASS`. `git diff --check`: pass.

## Still not verified

- None of the current corrected ZIPs has been imported/rendered in the OpenMAIC UI; an earlier D01-01 import is stale and browser-local. Full-player runtime QA for all six remains pending.
- No school has yet verified age terms, data flow, tool permissions, supervision, isolation, or rollback for a real Astra/Codex/Blender workflow.
- Student trials, audience feedback, grade-level readability, total 30-minute timing, all current-package full-player narration, screen-reader behavior, and learner-site publication remain unverified.
- OpenMAIC generation success and local DSL/static QA do not prove that the generated hosted preview itself meets final classroom quality. The generated OpenMAIC pages remain the raw hosted drafts; use only the locally assembled candidates for the next import/review stage, after confirming a durable supported import/edit path.
