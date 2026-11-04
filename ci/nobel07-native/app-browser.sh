set -euo pipefail
test "$GITHUB_REPOSITORY" = JamesWuHK/OpenMAIC
test "$RUNNER_NAME" = openmaic-cloud-linux
test "$(id -u)" != 0
mkdir -p artifacts/nobel07-native-app
npm_config_cache="$RUNNER_TEMP/nobel07-app-npm-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT" PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm --prefix ci/nobel07-native ci --ignore-scripts --no-audit --no-fund > artifacts/nobel07-native-app/npm.log 2>&1
qa_image='mcr.microsoft.com/playwright@sha256:65cefd09a5e943921ecd3a6e5414c603db2eb161e9eb48f2e2ccc63486dc7dc0'
docker pull "$qa_image" > artifacts/nobel07-native-app/image-pull.log
candidate_name="learner-candidate-$GITHUB_RUN_ID"
qa_image_id="$(python3 ci/nobel07-native/app-image-proof.py browser)"
browser_name="nobel07-app-browser-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
seccomp="$TASK_WORKSPACE/ci/nobel07-native/seccomp_profile.json"
test "$(sha256sum "$seccomp" | cut -d' ' -f1)" = 0c4b9e74b24ed79572cf0b1aaa9c92afc8a13019d8f794c13c73aa4174e9db5a
docker create --name "$browser_name" --label wanli.qa.owner=nobel07-native-app-20261104 --label "wanli.qa.run=$GITHUB_RUN_ID" --memory 768m --memory-swap 1024m --cpus 1 --pids-limit 256 --shm-size 256m --user "$(id -u):$(id -g)" --cap-drop ALL --security-opt no-new-privileges --security-opt "seccomp=$seccomp" --network "container:$candidate_name" --init --read-only --tmpfs /tmp:rw,nosuid,nodev,size=256m,mode=1777 -e HOME=/tmp -e CI=true -e LEARNER_QA_BASE_URL=http://127.0.0.1:3000 -v "$TASK_WORKSPACE:/workspace:ro" -v "$TASK_WORKSPACE/ci/nobel07-native:/qa:ro" -v "$TASK_WORKSPACE/artifacts/nobel07-native-app:/workspace/artifacts/nobel07-native-app:rw" -w /workspace "$qa_image_id" timeout -k 10s 900s node /qa/qa-native-app.mjs > artifacts/nobel07-native-app/browser-id.txt
docker start "$browser_name"
while test "$(docker inspect "$browser_name" --format '{{.State.Running}}')" = true; do
  python3 - <<'PY'
from pathlib import Path
import json,time
m=int(next(s.split()[1] for s in Path('/proc/meminfo').read_text().splitlines() if s.startswith('MemAvailable:')))
with Path('artifacts/nobel07-native-app/resources.jsonl').open('a') as f:f.write(json.dumps({'at':time.time(),'availableKiB':m})+'\n')
assert m>=3*1024**2,'Host reserve exhausted; stop via owned cleanup'
PY
  sleep 5
done
docker logs "$browser_name" > artifacts/nobel07-native-app/browser.log 2>&1
docker inspect "$browser_name" --format '{{json .State}}' > artifacts/nobel07-native-app/browser-state.json
test "$(docker inspect "$browser_name" --format '{{.State.ExitCode}}')" = 0
test "$(docker inspect "$browser_name" --format '{{.State.OOMKilled}}')" = false
python3 - <<'PY'
import json
r=json.load(open('artifacts/nobel07-native-app/report.json'));assert r['pass'] and len([c for c in r['cases'] if c['kind']=='native-page-reading-voice-transcript'])==96
PY
