# OpenMAIC v1.2.1 integration assessment

Date: 2026-10-24 (Asia/Hong_Kong)

Status: upstream v1.2.1 merged into the isolated integration branch. The first
cloud candidate at `b9bc5898f5579a75363d213a5cd0061d20d14229` built but
failed startup; a PostgreSQL-backed candidate is being prepared. No candidate
promotion or production service change.

## Cloud candidate verification (2026-10-24)

The self-hosted `openmaic-cloud-linux` runner is available for an isolated
`linux/amd64` build; it does not use a GitHub-hosted paid runner or AWS/model
secrets. The workflow is `.github/workflows/learner-v121-self-hosted.yml` on
`codex/upstream-v121-integration`. Run `40077092864` at the exact source above
passed workspace-package compilation, 11 Node regression tests, 109 Vitest
checks (one additional check skipped), full TypeScript checking, and Docker
image construction. Its isolated HTTP smoke failed: the container exited at
boot because v1.2.1 requires `DATABASE_URL`. **This run is a failed candidate,
not a successful image release.** The workflow's cleanup also
removes its run-specific image, so even a successful run is build evidence, not
a staged deployable artifact.

The original workflow run mounted the repository's smaller sample learner catalog for its
HTTP smoke. That smoke cannot establish preservation of the ten published
classrooms or real lesson playback. On 2026-10-24 the read-only
`qa-learner-live-source-parity.mjs` check was repeated against the current
public site and the frozen `output/nobel-series-20261024-release/candidate`
package: all 10 classroom JSON files, catalog IDs/order and site content still
match. This protects the current baseline but is not a v1.2.1 acceptance test.
The new `qa-learner-candidate-audio.mjs` check samples first, middle and last
narration Range requests per published classroom. Against the current public
site it passed 30/30 audio clips across all 10 lessons. Its three unit tests
also pass, including the legacy `/api/classroom` fallback. It must be run
again against an exact-content v1.2.1 candidate; this public-baseline result
does not establish candidate playback or audible browser output.
The next isolated cloud-build workflow revision closes the sample-catalog gap:
`freeze-public-learner-runtime.mjs` copies only the current public catalog,
site content, ten allowlisted classroom documents and their referenced media
into a run-specific temporary directory. It mounts those files read-only into
the candidate container, keeps the candidate teacher-submission directory
separate and writable, then runs catalog/series/document parity and the
30-clip Range check. The first Docker run `40077092864` predates this revision
and cannot be counted as exact-content QA. The new snapshot script and parity
fallback passed 16 focused Node checks locally; no new cloud build has yet
validated them. The workflow removes only its own run-specific container,
image and snapshot, and does not alter the production mounts.

Read-only production inspection on 2026-10-24 found the running Lightsail
student host has exactly `openmaic` and `caddy` services, with no
`DATABASE_URL` or agent-runtime flag in `learner.env`. Its classroom and learner
content mounts are read-only; teacher submissions use a separate writable
mount. The Web container remains image `sha256:7e18dd23…`, restart count zero,
with 8.6 GiB disk available and about 742 MiB memory available on a 1.9 GiB
host. The initial attempt to retain a two-service deployment failed because
this upstream version requires a database even in learner mode. The user
authorized adding PostgreSQL. The revised candidate Compose has `openmaic`,
`postgres` and `caddy`, with a separate PostgreSQL credential file, persistent
volume, health dependency and 384 MiB database memory cap. The ten published
classrooms and media remain on read-only filesystem mounts; the new DB does
not import or replace them. Production Compose, environment, services and
mounts remain unchanged until isolated candidate and host-headroom checks pass.

## Current learner release preservation gate (2026-10-24)

The live `class.wanli.ai` site is the release baseline, not the six-course
catalog in this Git checkout or the older Nobel 01/02/04 snapshots. The current
live source is the separate, unpublished code-worktree-independent package at
`output/nobel-series-20261024-release/candidate` in the canonical checkout.
It has **13 series, 10 published classrooms, and 6 open series**. The current
Nobel lesson IDs are 01 v4, 02 v4, 03 v3, and 04 v2. The read-only
`qa-learner-live-source-parity.mjs` check compared this package with the public
site on 2026-10-24: site content, catalog IDs/order, and all ten complete
classroom JSON files matched. The older `nobel03-story-v3-release` package
failed that comparison because it contains older lesson IDs and site content.
The current release references 237 classroom media URLs and 14 site media URLs;
all 251 have a local source across the canonical checkout, the new Nobel
payload, and the separate Nobel 03 v3 release. **Two leaf-classifier image
sources were owner-only mode 0600**, and both public URLs repeatedly returned
HTTP 502 on 2026-10-24; the other 52 of 53 sampled live media requests
succeeded. The server copies were independently confirmed to be 0600 while the
Web container runs as UID 1001. The exact two media files were backed up at
`/opt/openmaic-learner/backups/leaf-media-permissions-20261024-1548`, then
changed to 0644 without changing bytes. Both public URLs now return HTTP 200
and their images decoded at 1024x576 in browser scenes 2 and 5. No course
JSON, catalog, service or container was changed; Web and Caddy restart counts
remained zero. The local source copies were likewise changed to 0644, and
`qa-learner-release-media.mjs` now passes all 237 classroom and 14 site media
references across the current release roots. This is a narrow media repair,
not a full release/browser/audio acceptance of the v1.2.1 upgrade.
The two local files have SHA-256
`62958b02b51879324aa4f91caabc9f6a606bc820c0f86bb84d1179d3eec40696`
and `22b38b6bfaeddcc19d35914e9323ddece3a06c39c187d525e17f8a9f65210cef`,
respectively. Both are JPEG-encoded data despite their `.png` names. This
format mismatch did not prevent these two images from decoding in the checked
browser, but their bytes and classroom references must not be changed without
a separate content review. The
content publisher now normalizes public media permissions on transfer, so a
future `rsync -a` cannot propagate owner-only source modes unchanged.

The ten current classroom files also loaded through the candidate's v1.2.1
HTTP document client and structural validators. Candidate code now reads only
catalog-allowlisted classroom files and media on learner hosts, while the
discussion-speech route reads its speaker roster from the same published file.
The compose layout keeps `/app/data/classrooms` and `/app/content/learner` as
read-only runtime mounts; **a Web-image upgrade must not sync, delete, or
replace those mounts**. This is the release lane for the platform changes in
this branch. An image build or route 200 alone cannot prove playback quality.

Before any candidate promotion, compare the candidate with the then-current
live baseline using `qa-learner-upgrade-parity.mjs` (series and course list),
`qa-learner-published-content.mjs` (the exact release-source file hashes),
`qa-learner-release-media.mjs` (all source media), then test browser playback,
first/middle/last narration, discussion, desktop,
390-pixel mobile, and console. If the live catalog or series changes again,
re-freeze the source first. Do not infer that this document authorizes
production deployment. The Git checkout itself has only six metadata entries
and no packaged classrooms; its content-publish preflight correctly fails.

Current execution gaps: the first cloud Docker build failed its startup smoke
because PostgreSQL was absent. A new PostgreSQL-backed build/test is required.
Candidate testing with
the exact ten-classroom content mounts, real-browser playback/discussion,
desktop/mobile checks, a durable image transfer, and a release decision remain
outstanding. The older local `edge-tts` 7.2.8 returns WebSocket 403;
the image's pinned 7.3.1 produced decodable Cantonese clips for all three
classroom roles in isolated testing, not on the live site.
The configured `wanli-lightsail-ops` identity is valid. Its single-instance
`lightsail:GetInstance` call is denied by IAM, but the existing authorized
`GetInstances` and `GetInstanceAccessDetails` path worked for the same account
and instance. The temporary SSH credential files used for the narrow media
repair were removed after use. No IAM change, media upload or container restart
was made.

## Historical merge preflight on the integration branch

An initial `git merge --no-commit --no-ff v1.2.1` on `d28e68c3` stopped at **40 unresolved paths**. That attempt was aborted; the conflicts were subsequently resolved and the actual merge was committed at `5df42c13`. The earlier 28-conflict `merge-tree` estimate was against `main`, before the integration branch's focused security and learner-chat commits, and must not be used as the current conflict count.

The conflicts are behavioral, not just textual:

- `lib/server/resolve-model.ts`, `lib/server/provider-config.ts` and chat/PBL/quiz routes overlap the fork's server-managed model authorization with upstream's new slot-based provider resolution. Preserve the authorization boundary while adopting the new configuration contract.
- `app/api/chat/pi/route.ts` overlaps upstream's tool-calling requirement and typed authorization response with the fork's learner 403 handling. Validate the free classroom model's tool support before any learner cutover.
- `app/api/chat/route.ts`, `lib/chat/agent-loop.ts` and related files are deleted upstream but modified in the fork. Their learner-facing callers and tests must be migrated before accepting deletion.
- `Dockerfile`, Compose, middleware, classroom loading, TTS and stage/UI files combine the fork's student deployment and course playback behavior with upstream's server-first layout. They need a separate build and live playback check, not a blanket “ours” or “theirs” resolution.

The merge is committed only to the isolated integration branch. A production release remains gated by build and browser evidence.

## Historical pre-merge candidate progress (2026-10-24)

- A focused authorization guard now exists on this integration branch for `resolveModel`: a server-managed provider accepts only its operator-listed models, its operator-configured default, or the selected operator stage route. Unlisted client-selected models fail before the provider client is created.
- Legacy classroom chat, Pi classroom chat and model verification translate that denial to HTTP 403. Targeted unit/route checks passed (152 tests across six files), as did changed-file ESLint and Prettier checks.
- This is not the full upstream security advisory backport: authoring-mode media and speech provider paths remain unaddressed. It has not been built, deployed or browser-tested. The original checkout and live site remain untouched.
- Both learner Compose variants now compile the existing Pi classroom chat path into the student bundle. This is an isolated configuration candidate only: the free OpenRouter model's tool-calling behavior, discussion audio latency, production browser flow and the upstream merge still require separate validation. The authoring Compose remains unchanged.
- Pi model resolution now explicitly requires tool calling for the classroom discussion call site. A catalogue model marked `tools: false` fails before the agent loop with HTTP 400 `MODEL_CONFIG_INVALID`; other call sites are unchanged. Unknown capability, including a dynamic free-model router, is not treated as a denial. This mirrors the upstream fail-fast principle but does **not** establish that `openrouter/free` actually supplies a tool-capable model on a live request. Focused resolver, Pi-route and learner-config tests passed (41 checks); changed-file ESLint and Prettier checks passed.

### Learner-reachable provider audit

The current learner boundary allows classroom chat, PBL, quiz grading, transcription, web search and the dedicated learner speech endpoint. It hides the generic image, video and TTS generation endpoints. This is a source-code boundary check, not proof of the live deployment's configuration.

| Path | Learner boundary | Result in this candidate |
| --- | --- | --- |
| `/api/chat`, `/api/chat/pi`, PBL and quiz grading | Allowed | LLM resolution now rejects client-selected models outside server-managed authorization. All these routes return 403 for the denial. |
| `/api/transcription` | Allowed | Managed ASR without an explicit model list now uses its adapter default, not the client's model. |
| `/api/web-search` | Allowed | Managed Claude web search without a model list now uses the adapter default. Its optional LLM query rewrite uses the central LLM guard. |
| `/api/learner/speech` | Allowed | Existing route accepts no provider credentials and fixes Edge TTS, voice and speed server-side. No change needed for this model-selection issue. |
| `/api/generate/image`, `/api/generate/video`, `/api/generate/tts` | Hidden | Not reachable through the learner boundary; authoring-mode security still requires a separate audit. |

The ASR and Claude web-search changes passed provider-config, learner-boundary and API-level route tests (177 Vitest checks across four files). Learner speech passed eight Node tests, with its external synthesis check skipped. An isolated build and deployment check are still required before any release.
PBL and quiz denial responses passed nine focused route tests across two files.

## Verified inputs

- Fork `main`: `06e1472b66147b57a2a3aabf2511aba1e6d09fdd` (Wanli learner portal).
- Common upstream ancestor: `1e10f60b151cedb59ac21ddbcceb5ee0eed9c984` (2026-09-04).
- Target: upstream stable tag `v1.2.1` (`e19d0d4`); not the `v1.3.0-rc.1` prerelease.
- From that ancestor to `v1.2.1`: 211 upstream commits and 1,791 changed paths. The fork has two commits on `main` after the ancestor.
- `git merge-tree --write-tree main v1.2.1` reports 28 file conflicts. This is a dry-run; no merge or deployment has occurred.

## Compatibility gates

1. **Classroom chat:** v1.2.1 removes `POST /api/chat`; the fork still exposes and tests it. Both learner Compose variants now select the existing Pi path, but a successful live discussion smoke test is still required. The chosen classroom model must support tool calling. The old route must not be removed until that flow is verified.
2. **Persistence/deployment:** v1.2.0+ uses server-first generation and a mandatory PostgreSQL service. The fork's student endpoint uses a lightweight, content-mounted learner image. Do not adopt upstream Compose defaults without a data, owner, access-control, backup and rollback design for this deployment.
3. **Local customizations:** conflicts cover `Dockerfile`, Compose, classroom and roundtable surfaces, PBL, TTS, settings, middleware and i18n. Resolving text conflicts alone cannot establish compatibility.
4. **Published lessons:** classroom JSON, audio, media, learner catalog and teacher-submission queue require regression checks on actual public lesson routes; a successful build or HTTP 200 is insufficient.
5. **Release candidate:** v1.3.0-rc.1 knowledge-base migrations prohibit mixed old/new instances and rollback below its material-pool boundary. Exclude it from this integration target.
6. **Security priority:** upstream's model-authorization fix (`90b2d90b`, included in v1.2.1) spans server-managed provider resolution and many generation APIs. In this fork, `resolveModel` accepts a client model for an unrouted stage while reusing a server-managed provider key; `getServerProviders()` exposes a configured model list, but `resolveModel` does not enforce it. Treat this as a security review item for the learner API before any broader feature upgrade. Do not assume a direct cherry-pick is safe because the upstream fix depends on the new server-side model-configuration system.

## Historical integration plan

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
