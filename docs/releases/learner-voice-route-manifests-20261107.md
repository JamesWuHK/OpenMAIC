# Learner voice route manifest repair — 2026-11-07

Deployed application revision: `729bf1aa59b3c56affb280660a162693190d65a5`.
Runtime image: `sha256:aba799a910be5cc08218152b2e78b5f0359de21ff7b3337f29674072a25a0d34`.
Built on James's M1 for linux/amd64. Draft GitHub artifact tag: `learner-voice-729bf1aa`.
Archive SHA256: `52c855a3605baa7074b35b114bedb6f1ce865d5787fe4ad5b520143a20a9a941`.

## Failure and repair

The prior runtime contained compiled speech and custom learner modules, but its global app-path mappings and route matchers omitted eight custom paths. POST /api/learner/speech returned Next's HTML 404. A successful build log and page GET were insufficient acceptance.

Dockerfile now explicitly copies the completed build's three global route manifests after standalone copying. A new gate checks ten essential routes against compiled files, both app mappings and route matchers, before packaging and in the final image. Both M1 gates and the deployed-container gate passed.

The pre-switch check detected actual production revision 935320ee. Git ancestry verified it is included in this build, including its SVG cache repair. Only openmaic was recreated. Rollback tag: `openmaic-learner-openmaic:rollback-pre-route-manifests-20261107`.

## Observed checks

- Public weather-class speech: teacher 200, 4.186 s, 20736 bytes; assistant 200, 3.360 s, 20592 bytes; student 200, 1.864 s, 23184 bytes. All three MP3 files decoded with ffprobe (3.456, 3.432, 3.864 s).
- M1 assistant synthesis initially returned 502 once; direct Edge synthesis and route retry succeeded. Free upstream can fail transiently.
- Synthetic teacher question via native /api/chat completed with text deltas, agent_end and done/agentHadContent=true in 1.977 s. Initial hand-built request lacked allowedActions; correcting the test payload to the native registry shape resolved that harness error.
- Synthesizing the actual longer teacher answer returned 200 / 83520 bytes in 13.037 s. This is synthesis latency, not measured browser first-audio latency. Longer answers still have a material delay.
- /courses and /classroom/hk-s04-01-radar-rain returned 200 after deployment.
- Container running, zero restarts. Published catalog SHA256 unchanged: `1b28c0de529ff0557cdd00fb4cd4b2e2c06c425b8a837b99a759c9ae6384b926`; 25 classroom files retained.

## Not verified

Physical microphone capture, Cantonese transcription accuracy, browser delivery of recognized text, and audible browser playback were not exercised by these API checks. The backend repair is verified; full physical-microphone acceptance remains open. No course content was edited.
