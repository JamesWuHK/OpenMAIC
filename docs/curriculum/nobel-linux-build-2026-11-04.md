# Nobel discussion: bounded Linux image build

Status: prepared for a manual cloud CI attempt; not published.

The production baseline is source `8dc9efc25637e5dfadfcf6df69237f678fe58ee1`.
The recovery branch contains the six discussion speech-drain runtime/test files
from `51d442c61c6482954fa6ec83672683a9ab0f2849` unchanged. It excludes the separate
Safari Audio reuse patch whose resume behavior still needs repair.

GitHub Actions fork suspension was cleared. Read-only preflight run
[41757560423](https://github.com/JamesWuHK/OpenMAIC/actions/runs/41757560423)
passed on existing runner `openmaic-cloud-linux`, source `0b086169500924db1843d393cfbd5330ca9c1e20`.
It observed 6,711,564 KiB available RAM, 83,675,240 KiB Docker disk space,
1,027,969 free inodes, and no running Docker containers. This snapshot does not
reserve resources for subsequent work.

## Manual image workflow

`.github/workflows/learner-cloud-image.yml` runs only when manually dispatched.
Its default targets labels `self-hosted, Linux, X64, openmaic, cloud-ci`. An explicit
`public-standard` choice targets only standard `ubuntu-24.04`, with both public
visibility and `private == false` event checks before that job can run. GitHub's
current official billing documentation lists standard hosted runners in public
repositories as free. There is no automatic fallback or larger runner selection.
It has contents-read permission and no deployment, cloud, or model credentials.

- The capacity check requires 6 GiB available RAM, leaving at least 1 GiB beyond
  the builder's 5 GiB memory limit, and 20 GiB disk space. It requires one million
  free inodes before dependency installation and 300,000 before building.
- The dedicated builder has 5 GiB RAM / 6 GiB RAM+swap and 1.5 CPU limits, one
  build task at a time, an isolated Docker client config, a random per-run name,
  and a pre-existing resource rejection check. It stops before browser tests.
- The application candidate has 384 MiB RAM / 768 MiB RAM+swap, 0.5 CPU,
  192 PIDs, and a dynamically allocated loopback port. Content mounts are read-only;
  only its own temporary synthetic submissions directory is writable.
- Chromium runs in the official Playwright `v1.58.2-noble` container, matching
  the lockfile, with 768 MiB RAM / 1 GiB RAM+swap and 0.75 CPU. No host OS package
  installation is performed.
- Container cleanup requires its CID receipt plus matching actual ID, image,
  name, source revision and ownership labels. A failed name collision gives no
  cleanup authority. No global Docker pruning or service restarts are permitted.
- The official setup Action's automatic builder cleanup is disabled: its cleanup
  errors are warnings, which cannot prove removal. The workflow records the
  guarded, randomly named builder's actual CID/image, separately verifies hard
  limits, and explicitly removes only that builder after receipt validation.
  A failed removal or a surviving CID fails the cleanup step. A post-setup
  `always()` step records even a partially created builder for this cleanup.
- Five prompt asset directories are explicitly included in the Docker context
  and final image. Every source Markdown asset is SHA256-checked inside the
  actual running candidate, preventing an image with omitted runtime prompts.
- API boundary checks use a synthetic key and an unreachable loopback provider.
  Browser regressions use fixtures. Neither is full native discussion acceptance.
- The tested image and checksum are retained for one day; diagnostics for seven
  days. Export does not authorize a deployment. The exact source SHA and image ID
  accompany the image.

No dependency cache is uploaded. GitHub's current [billing documentation](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
lists self-hosted runner use as free; no runner instance, paid provider, account
upgrade or billing setting is created or changed by this workflow.

Light checks: ten Python ownership/capacity tests and three Node packaging / CI
contract tests passed. Independent technical review passed for one bounded CI
attempt; the pinned official setup-buildx action source and supported inputs
were verified through the official repository after the API rate reset. Actual image build, TypeScript, runtime prompt
hashes and browser results are still pending cloud execution.

Latest read-only preflight [41768378000](https://github.com/JamesWuHK/OpenMAIC/actions/runs/41768378000)
failed its capacity gate at 2026-11-04T03:47:17Z: 4,189,452 KiB available memory,
64,392,208 KiB free Docker disk space and 294,210 free inodes. Other jobs now
occupy the runner. Do not dispatch heavy work against this insufficient snapshot,
relax the gate to force a build, or reclaim another task's resources.

## Remaining release gates

The six frozen Nobel classroom candidates and independent static content reviews
remain in the canonical checkout's `output/nobel-native-discussion-20261027/`.
Do not regenerate instructional narration or media for this repair.

After building: run real discussion output checks, complete same-role speech
coverage, speech-queue drain, follow-up input, desktop/mobile interaction and
independent generated-output review for all six courses. Use the tested image's
actual ID and source SHA. Do not invoke a paid provider to obtain these results.

Production image/container replacement, catalog publication, old-link handling,
rollback and public end-to-end verification each need their own evidence. The
legacy content-only publisher still has an unresolved shared-file lease recovery
issue and must not be executed. The current work has changed no production
containers, content, model routes, Caddy configuration, DNS or billing settings.

## Application routing and scoped catalog plan

The six known Nobel legacy lecture URL families are now handled in a learner-only
server layout. A redirect activates only after the existing filesystem reader
finds the matching native discussion edition in the published catalog and validates
its classroom file. Other course IDs do not read the catalog through this resolver.
The dynamic layout reads the mounted publication state, so staging a draft does
not change legacy links. Four resolver tests and independent technical review
passed; real server/browser navigation is still pending. Next may emit HTTP 307
or a streaming client redirect: acceptance must navigate the old link in the real
browser and verify the final native classroom URL and frozen classroom data.

This makes changing the shared Caddyfile unnecessary for legacy-link compatibility.
The old publisher must still not run; prepare a content-only transaction using
the existing unchanged-Caddy guard and the new pure catalog planner.

`scripts/learner/nobel-catalog-merge.py` preserves all current metadata and course
additions, changing only the six approved IDs. It rejects missing/changed source
versions, duplicates, and moved series ownership. Six tests and independent review
passed. Applying it to both real archived baseline files yields exactly the two
approved frozen metadata objects. It is a planning function with no publishing I/O.

At 2026-11-04T04:25Z the production image remained `3cb7e161...` / source `8dc9efc2...`,
restart count zero, health 200. Both production metadata hashes remained unchanged,
and the six current Nobel classrooms still contained one teacher and zero discussion
actions. No production writes were made. A read-only dependency inode measurement
was queued as run `41771991875`; subsequent preflights are manual-only to avoid
unnecessary push-triggered checks. API core quota was exhausted again; the published
reset is 2026-11-04T04:48:35Z. No alternate credentials or status paths were used.

## Free model QA preparation

The read-only official DeepSeek balance endpoint reported zero unexpired grant.
No inference was made and no paid-model fallback is permitted for this QA.
`scripts/qa/openrouter-free-proxy.mjs` is prepared, not deployed: it permits only
`openrouter/free`, text messages and declared client functions, rejects model
fallbacks and plugins, caps tokens/request budget/concurrency/lifetime, and
terminates stalled bodies. The upstream key stays on its existing host; a future
runner would receive only a revocable relay token. Nine loopback/TLS tests and
independent source review passed. Real upstream/SSE acceptance is still pending.

CLI use requires TLS. Explicitly trusting the ephemeral public CA was tested;
certificate verification is not disabled. Quick Tunnels are not suitable because
Cloudflare documents that they do not support SSE. No tunnel, relay, port rule,
DNS record or production service was created for this preparation. Any transport
setup still requires scoped resource checks, independent review and owned cleanup.

## First standard runner result and infrastructure correction

Public standard Linux [run 41775500579](https://github.com/JamesWuHK/OpenMAIC/actions/runs/41775500579)
at source `cc3cb0a4e1cdc05a61840f1575c7823d2a1a10a0` passed capacity, relevant
regressions, TypeScript, the image build, actual runtime prompt hashes and the
synthetic no-model API boundary. Browser execution failed before tests began:
`EACCES` creating `/work/artifacts/learner-site-qa`. The capability-restricted root
inside the browser image could not write the host-owned artifact directory.

The browser now uses the host UID/GID, with writable XDG paths under container
`/tmp`. No broad host permission change is made. This correction and source/relay
changes passed independent review (Python 11; Node workflow/relay 11). Browser
startup still needs cloud proof. The original failed run exported no image, so
one rebuild is necessary. Later runs export before the browser step, upload normal
image artifacts only after browser success, and preserve failed candidates under
a distinct `learner-unaccepted-image-*` name for diagnosis. None implies native
discussion acceptance or permission to deploy an unaccepted image.

## Native discussion acceptance preparation

The manual `native-qa` phase reuses only a successful image from this workflow,
verifies its source, image ID, checksum and explicit fixture acceptance, and
rejects runtime changes since that image. It runs on the free public standard
Linux worker, never the production host. The deterministic six-course fixture
bundle retains the independently reviewed classroom hashes. Production media
is read through a browser proxy without rewriting it; this does not establish
that the candidate itself serves those media files.

The browser checks actual legacy-link navigation, frozen classroom identity,
real model replies and speech, same-role text coverage, queue drain, stop and
follow-up input in separate desktop/mobile batches. It does not mock inference
or generated speech. The temporary TLS relay accepts only `openrouter/free`;
the runner receives a revocable relay token, while the provider credential stays
on its existing host. Eleven relay tests, three artifact/fixture tests, the
workflow contract test and independent review passed for this preparation.

The host relay controller is a separate, still-unpublished operation. Its source
review and owned cleanup must pass before starting it or opening its dedicated
runner-only port. Nothing in the native QA workflow publishes content or changes
production. Real six-course output and audio acceptance remain pending.

## Second image result and current production compatibility

[Run 41777736745](https://github.com/JamesWuHK/OpenMAIC/actions/runs/41777736745)
built source `497e85a3a0d1fdab959aa077237489f1a442ce6c`. Regression/type checks,
image construction, real runtime prompt hashes and synthetic API boundary passed.
The real browser started successfully: ten checks passed, but both homepage
checks still expected a retired default title instead of the mounted site's
current hero title. The desktop snapshot confirms the correct mounted heading.
The image remains explicitly unaccepted; the diagnostic artifact was retained.

A fresh read-only host check found another session had deployed source
`7b1da522d071bfddf50f0526ac337fd2016f8d50` with Safari audio-element reuse and
manual Play/Skip recovery. The final candidate preserves that behavior while
separating each segment's completion state from the reusable element. It fixes
completed-clip replay on Resume, duplicate error completion, stale permission
actions, unhandled Resume rejection and a superseded play promise's late rejection.
Seven focused fake-Audio lifecycle tests and independent review passed. Actual
Safari acceptance is not inferred from these tests.

The homepage regression now checks the mounted hero title and keeps the navigation
and overflow assertions, with a 60-second budget on the bounded cloud worker.
Because runtime audio code changed to preserve current production behavior, a
fresh image is required; the previous image must not replace the newer deployment.

## Reviewed free-quota matrix

The official key metadata reports a free-tier daily request budget of 50, with
zero used before testing. The explicit `core-matrix` selection avoids repeating
the shared session checks unnecessarily: all six courses receive real initial
desktop discussion, same-role complete speech, queue drain and Stop; all six
receive mobile UI/layout, legacy navigation, input and language checks. Course 01
receives real follow-up and generated-speech Pause/Resume on both devices. Each
course's fresh generated transcript still needs independent science review.

This matrix passed independent source review. It does not establish all-six
mobile generated-discussion acceptance or Safari browser acceptance. Estimated
model usage is not a guaranteed request allowance: actual usage must be tracked,
and incomplete checks remain pending if the free limit is reached. No paid
fallback, top-up or alternate-account quota evasion is permitted.

## Successful build and first actual native attempt

[Image run 41782044577](https://github.com/JamesWuHK/OpenMAIC/actions/runs/41782044577)
at `72cb41d8a5390036880db5cfb6e7d348aa4bc75d` passed all build/type/prompt/API
checks, all twelve desktop/mobile fixture browser tests and owned cleanup.
The accepted image is `sha256:4928fc5560727f55faf182aa72a9b7effa42bc5e9187a4532f5bbb3c61002225`.
Native discussion acceptance and publication remain separate.

The temporary relay initially inherited the application's `PORT=3000`, despite
publishing port 8787. Its cleanup also missed Docker's lowercase missing-object
message. Explicit port configuration and case-insensitive absence checks fixed
these infrastructure errors; thirteen controller tests and independent review
passed. The failed task's container, private TLS material and temporary port rule
were cleaned up, with production container identity/start/restarts unchanged.

[Native run 41784573611](https://github.com/JamesWuHK/OpenMAIC/actions/runs/41784573611)
passed exact-image/fixture provenance, TLS relay readiness and course 01 UI.
Actual generated student speech played audibly and advanced, including a real
one-second Pause/Resume hold. It failed because narration uses frozen
`/api/classroom-media/...` URLs, which the preview's narrower media proxy missed.
This produced a real 404; it is not relabeled as successful narration acceptance.
Six public narration Range requests separately returned 206/audio successfully.

The QA proxy now also permits only exact media paths extracted from that frozen
classroom, under the same fixed public origin. It never proxies classroom JSON or
inference. Two new path-boundary tests and independent review passed. Runtime
image and instructional content are unchanged, so the existing image can be reused.

The user selected the GitHub plugin, which can read run logs/artifacts but cannot
dispatch a fresh workflow. An explicitly reviewed Git request is also supported:
only a change to `.github/workflows/nobel-native-request.json` on this recovery
branch can start native QA. Normal code pushes cannot start it, and image builds
still require manual dispatch. The request accepts only mapped public QA inputs;
provider credentials are not valid fields. Existing image provenance, free-only
relay, standard public Ubuntu, resource limits and cleanup remain required.

## Fluency requirement and latest unaccepted native evidence

The user additionally requires smooth discussion. Native run
[41787619449](https://github.com/JamesWuHK/OpenMAIC/actions/runs/41787619449)
generated three initial roles and a fresh teacher follow-up. Thirteen speech
clips were audible, advanced and ended, and text/same-role speech coverage was
present. The run nevertheless FAILED: its observer retained listeners after
`ended`, so later `src=''` cleanup contaminated completed rows with error 4 and
reset time. Preserve that failed raw evidence unchanged (JSON SHA256
`40814a0dde31937b91f2e2251c4362033862c65bcce2cccd143e237ece299cb8`).
The corrected observer freezes terminal rows and treats pre-completion errors
and source replacement as failures. Real Chromium calibration, including
observed cleanup error 4, is now included in the existing cloud browser matrix.
Synthetic calibration cannot replace native discussion acceptance.

Logs also show about 122 seconds spent in model-based speaker scheduling alone
for this short exchange. A new exact-six-ID learner policy keeps the authored
student → teacher → assistant opening, then cues the learner. A fresh human
follow-up goes directly to the teacher (or an explicitly selected role). Actual
responses still use the model and authored prompts. An empty required response
gets one retry, then fails explicitly. Other classrooms/configurations keep the
existing director. This runtime change REQUIRES a new image; image 72cb41d8
cannot establish acceptance for it.

QA now records monotonic browser timestamps for actual join/Enter events,
incrementally received SSE text, response completion, TTS response readiness,
actual playing/end events, intentional pause intervals and segment/role gaps.
Initial engineering targets are first received text ≤3 seconds, first browser
sound ≤5 seconds, same-role segment gaps ≤1 second and role changes ≤2 seconds.
Human think time before a follow-up is excluded from gaps. Missing or slow
measurements fail fluency, even if discussion is functional. These targets are
not a provider SLA; a few runs do not establish production p95 or human listening
quality, and the free test provider does not represent paid production DeepSeek.

Independent science review rejected course01's actual directional smell/drug
claims (D01/D02). A new candidate appends a precise boundary to all three
personas; SHA256 is
`24a3bd667a2b1f22fd188769cc2e59887b29e0245aeb07db706bbddda02eecb0`.
Removing only that addition restores original d24332a7 byte-for-byte; scenes,
media and the other five classes remain unchanged. Independent static closure
passed; fresh dynamic output remains CHANGES_REQUIRED until reviewed. The new
QA bundle SHA256 is
`970b5ad7d83dca07aa192916f5189396ee0836ebfefdd74b0bf8d79bfcfc157a`.
A narrow known-output regression tripwire does not replace scientific review.

All native-run firewall rules and the old relay are closed. No production app,
catalog, Caddy or published classroom was changed. Existing private staging of
image72 and original data is historical preparation, not the final candidate.
