import { isLearnerDeployment } from '@/lib/config/deployment-mode';
import { createLearnerSpeechHandler } from '@/lib/learner/discussion-speech';
import { listFilesystemPublishedCourses } from '@/lib/learner/filesystem-public-courses';
import { getOwnerScopedDocumentStore } from '@/lib/server/agent-runtime/owner-scoped-documents';
import { generateTTS } from '@/lib/audio/tts-providers';

export const runtime = 'nodejs';
export const maxDuration = 35;

export const POST = createLearnerSpeechHandler({
  enabled: isLearnerDeployment,
  publishedIds: async () => (await listFilesystemPublishedCourses()).map((course) => course.id),
  readClassroom: async (id) => {
    // Document reads are capability-by-id. The publication allowlist above
    // checks the id before this lookup; no visitor gets mutation authority.
    const store = await getOwnerScopedDocumentStore('system:learner-speech');
    const document = await store.loadDocument(id);
    return document ? { stage: document.stage } : null;
  },
  synthesize: generateTTS,
});
