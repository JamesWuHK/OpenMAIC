import { isLearnerDeployment } from '@/lib/config/deployment-mode';
import { createLearnerSpeechHandler } from '@/lib/learner/discussion-speech';
import { listFilesystemPublishedCourses } from '@/lib/learner/filesystem-public-courses';
import { readClassroom } from '@/lib/server/classroom-storage';
import { generateTTS } from '@/lib/audio/tts-providers';

export const runtime = 'nodejs';
export const maxDuration = 35;

export const POST = createLearnerSpeechHandler({
  enabled: isLearnerDeployment,
  publishedIds: async () => (await listFilesystemPublishedCourses()).map(course => course.id),
  readClassroom,
  synthesize: generateTTS,
});
