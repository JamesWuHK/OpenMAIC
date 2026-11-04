# Frozen six-course native-discussion QA bundle

`payload.zip` SHA256:
`f08ef85e1e24ec006032c5d001a80b5039475d2c03fa1b592b640d3c2db2c88e`

Copied byte-for-byte from the six approved classroom JSON files and metadata in
the canonical checkout's `output/nobel-native-discussion-20261027/`. The ZIP is
deterministic; its manifest records the exact six classroom hashes. No narration,
HTML, media paths or instructional facts were changed for this transport bundle.

Each classroom has an independent static AI review in that canonical directory's
`reviews/`. Course 01's current hash `d24332a7...` is covered by the later closure
in its review, rather than the original `f6c042ec...` review table alone. These
are static reviews, not new-image discussion, speech, browser or publication PASS.

The bundle is mounted only into an isolated candidate. It does not publish a
course. Unchanged public narration/media are fetched read-only from production
during cloud browser QA; generated chat and speech requests are not mocked.
