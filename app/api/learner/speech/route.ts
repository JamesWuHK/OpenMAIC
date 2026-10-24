import { isLearnerDeployment } from '@/lib/config/deployment-mode';
import { createLearnerSpeechHandler } from '@/lib/learner/discussion-speech';
import { listFilesystemPublishedCourses } from '@/lib/learner/filesystem-public-courses';
import { readPublishedClassroom } from '@/lib/learner/published-classroom';
import { generateTTS } from '@/lib/audio/tts-providers';

export const runtime = 'nodejs';
export const maxDuration = 35;

export const POST = createLearnerSpeechHandler({
  enabled: isLearnerDeployment,
  publishedIds: async () => (await listFilesystemPublishedCourses()).map((course) => course.id),
  readClassroom: async (id) => {
    // Read the same allowlisted file as the student player. The learner host
    // does not import published classrooms into PostgreSQL after content-only
    // updates, so a database roster would be stale or absent.
    const document = await readPublishedClassroom(id);
    return document ? { stage: document.stage } : null;
  },
  synthesize: generateTTS,
});
