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

`.github/workflows/learner-cloud-image.yml` runs only when manually dispatched,
on labels `self-hosted, Linux, X64, openmaic, cloud-ci`. It has contents-read
permission and no deployment, cloud, or model credentials.

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

Light checks: nine Python ownership/capacity tests and three Node packaging / CI
contract tests passed. Independent technical review passed for one bounded CI
attempt, conditional on verifying the pinned official setup-buildx action source
and options before execution. Actual image build, TypeScript, runtime prompt
hashes and browser results are still pending cloud execution.

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
