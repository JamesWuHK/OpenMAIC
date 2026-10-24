#!/usr/bin/env bash
set -euo pipefail

: "${LEARNER_SSH_HOST:?Set LEARNER_SSH_HOST, for example ubuntu@example.com}"
: "${LEARNER_SSH_KEY:?Set LEARNER_SSH_KEY to an SSH private-key path}"
: "${LEARNER_PUBLIC_URL:?Set LEARNER_PUBLIC_URL to the learner site URL}"

learner_remote_root="${LEARNER_REMOTE_ROOT:-/opt/openmaic-learner}"
if [[ ! "$learner_remote_root" =~ ^/[A-Za-z0-9/_-]+$ ]]; then
  printf 'LEARNER_REMOTE_ROOT must be a simple absolute path.\n' >&2
  exit 2
fi
ssh_options=(-i "$LEARNER_SSH_KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes)
backup_dir="$learner_remote_root/backups/learner-content-$(date -u +%Y%m%dT%H%M%SZ)-$$"

node scripts/validate-learner-content-contract.mjs
pnpm validate:learner-content

ssh "${ssh_options[@]}" "$LEARNER_SSH_HOST" \
  "mkdir -p '$backup_dir/data/classrooms' && \
   cp -a '$learner_remote_root/content/learner' '$backup_dir/content-learner'"

# Media and classroom files must exist before the public catalog names them.
# No --delete: older URLs and rollback media remain available.
# Public media is read by the learner container under a different UID. The
# publisher may own 0600 files, and rsync -a would otherwise preserve that mode.
rsync -az --chmod=Fgo+r -e "ssh ${ssh_options[*]}" \
  content/learner/media/ \
  "$LEARNER_SSH_HOST:$learner_remote_root/content/learner/media/"

while IFS= read -r course_id; do
  ssh "${ssh_options[@]}" "$LEARNER_SSH_HOST" \
    "if [ -e '$learner_remote_root/data/classrooms/$course_id.json' ]; then \
       cp -a '$learner_remote_root/data/classrooms/$course_id.json' '$backup_dir/data/classrooms/'; \
     fi; \
     if [ -d '$learner_remote_root/data/classrooms/$course_id' ]; then \
       cp -a '$learner_remote_root/data/classrooms/$course_id' '$backup_dir/data/classrooms/'; \
     fi"
  if [[ -d "data/classrooms/$course_id" ]]; then
    rsync -az --chmod=Fgo+r -e "ssh ${ssh_options[*]}" \
      "data/classrooms/$course_id/" \
      "$LEARNER_SSH_HOST:$learner_remote_root/data/classrooms/$course_id/"
  fi
  rsync -az -e "ssh ${ssh_options[*]}" \
    "data/classrooms/$course_id.json" \
    "$LEARNER_SSH_HOST:$learner_remote_root/data/classrooms/$course_id.json"
done < <(node -e "for (const course of require('./content/learner/published-courses.json').courses) console.log(course.id)")

rsync -az -e "ssh ${ssh_options[*]}" \
  content/learner/site-content.json \
  "$LEARNER_SSH_HOST:$learner_remote_root/content/learner/site-content.json.next"
rsync -az -e "ssh ${ssh_options[*]}" \
  content/learner/published-courses.json \
  "$LEARNER_SSH_HOST:$learner_remote_root/content/learner/published-courses.json.next"

ssh "${ssh_options[@]}" "$LEARNER_SSH_HOST" \
  "mv -f '$learner_remote_root/content/learner/site-content.json.next' '$learner_remote_root/content/learner/site-content.json' && \
   mv -f '$learner_remote_root/content/learner/published-courses.json.next' '$learner_remote_root/content/learner/published-courses.json'"

if ! node scripts/qa-learner-published-content.mjs; then
  printf 'Learner content verification failed. Rollback source: %s\n' "$backup_dir" >&2
  exit 1
fi
printf 'Learner content verified without rebuilding the web image. Rollback source: %s\n' "$backup_dir"
