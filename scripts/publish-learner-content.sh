#!/usr/bin/env bash
set -euo pipefail

: "${LEARNER_SSH_HOST:?Set LEARNER_SSH_HOST, for example ubuntu@example.com}"
: "${LEARNER_SSH_KEY:?Set LEARNER_SSH_KEY to an SSH private-key path}"

learner_remote_root="${LEARNER_REMOTE_ROOT:-/opt/openmaic-learner}"
ssh_options=(-i "$LEARNER_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=no)

node scripts/validate-learner-content-contract.mjs
pnpm validate:learner-content

rsync -az --delete -e "ssh ${ssh_options[*]}" \
  content/learner/ \
  "$LEARNER_SSH_HOST:$learner_remote_root/content/learner/"

rsync -az -e "ssh ${ssh_options[*]}" \
  data/classrooms/ \
  "$LEARNER_SSH_HOST:$learner_remote_root/data/classrooms/"

ssh "${ssh_options[@]}" "$LEARNER_SSH_HOST" \
  "test -s '$learner_remote_root/content/learner/site-content.json' && \
   test -s '$learner_remote_root/content/learner/published-courses.json' && \
   printf 'Learner content published without rebuilding the web image.\\n'"
