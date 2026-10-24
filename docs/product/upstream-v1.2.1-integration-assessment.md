# OpenMAIC v1.2.1 integration assessment

Date: 2026-10-24 (Asia/Hong_Kong)

Status: assessment only; no merge or production change.

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

## Integration sequence

1. Keep the existing learner branch and dirty checkout untouched. Work only in this separate integration worktree.
2. Prepare a compatibility layer for learner chat and deployment configuration before attempting an upstream merge. Identify which upstream security fixes are already covered locally and which need a focused backport.
3. Merge `v1.2.1` into this branch, resolve by subsystem, and run targeted checks before full build. Do not alter content or D01's paused status as a side effect.
4. Build and test on an approved cloud runner, then validate public desktop/mobile playback, narration, discussion and teacher submissions in a non-production candidate.
5. Production deployment requires a separate release decision, backup and rollback plan, and explicit approval.

## Official release notes

- <https://github.com/THU-MAIC/OpenMAIC/releases/tag/v1.1.4>
- <https://github.com/THU-MAIC/OpenMAIC/releases/tag/v1.2.0>
- <https://github.com/THU-MAIC/OpenMAIC/releases/tag/v1.2.1>
- <https://github.com/THU-MAIC/OpenMAIC/releases/tag/v1.3.0-rc.1>
