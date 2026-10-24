# OpenMAIC v1.2.1 integration assessment

Date: 2026-10-24 (Asia/Hong_Kong)

Status: isolated integration candidate; no upstream merge or production change.

## Candidate progress (2026-10-24)

- A focused authorization guard now exists on this integration branch for `resolveModel`: a server-managed provider accepts only its operator-listed models, its operator-configured default, or the selected operator stage route. Unlisted client-selected models fail before the provider client is created.
- Legacy classroom chat, Pi classroom chat and model verification translate that denial to HTTP 403. Targeted unit/route checks passed (152 tests across six files), as did changed-file ESLint and Prettier checks.
- This is not the full upstream security advisory backport: authoring-mode media and speech provider paths remain unaddressed. It has not been built, deployed or browser-tested. The original checkout and live site remain untouched.

### Learner-reachable provider audit

The current learner boundary allows classroom chat, PBL, quiz grading, transcription, web search and the dedicated learner speech endpoint. It hides the generic image, video and TTS generation endpoints. This is a source-code boundary check, not proof of the live deployment's configuration.

| Path | Learner boundary | Result in this candidate |
| --- | --- | --- |
| `/api/chat`, `/api/chat/pi`, PBL and quiz grading | Allowed | LLM resolution now rejects client-selected models outside server-managed authorization. Chat routes return 403; PBL/quiz error-status behavior still needs review. |
| `/api/transcription` | Allowed | Managed ASR without an explicit model list now uses its adapter default, not the client's model. |
| `/api/web-search` | Allowed | Managed Claude web search without a model list now uses the adapter default. Its optional LLM query rewrite uses the central LLM guard. |
| `/api/learner/speech` | Allowed | Existing route accepts no provider credentials and fixes Edge TTS, voice and speed server-side. No change needed for this model-selection issue. |
| `/api/generate/image`, `/api/generate/video`, `/api/generate/tts` | Hidden | Not reachable through the learner boundary; authoring-mode security still requires a separate audit. |

The ASR and Claude web-search changes passed provider-config, learner-boundary and API-level route tests (177 Vitest checks across four files). Learner speech passed eight Node tests, with its external synthesis check skipped. An isolated build and deployment check are still required before any release.

## Verified inputs

- Fork `main`: `06e1472b66147b57a2a3aabf2511aba1e6d09fdd` (Wanli learner portal).
- Common upstream ancestor: `1e10f60b151cedb59ac21ddbcceb5ee0eed9c984` (2026-09-04).
- Target: upstream stable tag `v1.2.1` (`e19d0d4`); not the `v1.3.0-rc.1` prerelease.
- From that ancestor to `v1.2.1`: 211 upstream commits and 1,791 changed paths. The fork has two commits on `main` after the ancestor.
- `git merge-tree --write-tree main v1.2.1` reports 28 file conflicts. This is a dry-run; no merge or deployment has occurred.

## Compatibility gates

1. **Classroom chat:** v1.2.1 removes `POST /api/chat`; the fork still exposes and tests it. The learner UI and discussion smoke tests must move to the Pi path. The chosen classroom model must support tool calling. `NEXT_PUBLIC_PI_CHAT_ENABLED=false` in `docker-compose.learner-static.yml` must not reach the new production build.
2. **Persistence/deployment:** v1.2.0+ uses server-first generation and a mandatory PostgreSQL service. The fork's student endpoint uses a lightweight, content-mounted learner image. Do not adopt upstream Compose defaults without a data, owner, access-control, backup and rollback design for this deployment.
3. **Local customizations:** conflicts cover `Dockerfile`, Compose, classroom and roundtable surfaces, PBL, TTS, settings, middleware and i18n. Resolving text conflicts alone cannot establish compatibility.
4. **Published lessons:** classroom JSON, audio, media, learner catalog and teacher-submission queue require regression checks on actual public lesson routes; a successful build or HTTP 200 is insufficient.
5. **Release candidate:** v1.3.0-rc.1 knowledge-base migrations prohibit mixed old/new instances and rollback below its material-pool boundary. Exclude it from this integration target.
6. **Security priority:** upstream's model-authorization fix (`90b2d90b`, included in v1.2.1) spans server-managed provider resolution and many generation APIs. In this fork, `resolveModel` accepts a client model for an unrouted stage while reusing a server-managed provider key; `getServerProviders()` exposes a configured model list, but `resolveModel` does not enforce it. Treat this as a security review item for the learner API before any broader feature upgrade. Do not assume a direct cherry-pick is safe because the upstream fix depends on the new server-side model-configuration system.

## Integration sequence

1. Keep the existing learner branch and dirty checkout untouched. Work only in this separate integration worktree.
2. Review the model-authorization gap and prepare a focused, tested backport for the current learner API if it is exposed in the deployed configuration. Prepare a compatibility layer for learner chat and deployment configuration before attempting an upstream merge.
3. Merge `v1.2.1` into this branch, resolve by subsystem, and run targeted checks before full build. Do not alter content or D01's paused status as a side effect.
4. Build and test on an approved cloud runner, then validate public desktop/mobile playback, narration, discussion and teacher submissions in a non-production candidate.
5. Production deployment requires a separate release decision, backup and rollback plan, and explicit approval.

## Official release notes

- <https://github.com/THU-MAIC/OpenMAIC/releases/tag/v1.1.4>
- <https://github.com/THU-MAIC/OpenMAIC/releases/tag/v1.2.0>
- <https://github.com/THU-MAIC/OpenMAIC/releases/tag/v1.2.1>
- <https://github.com/THU-MAIC/OpenMAIC/releases/tag/v1.3.0-rc.1>
