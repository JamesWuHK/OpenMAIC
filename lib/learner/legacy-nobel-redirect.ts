export async function resolveLegacyNobelRedirect(
  id: string,
  loadPublished: () => Promise<ReadonlyArray<{ id: string }>>,
): Promise<string | null> {
  // Match only the six approved lesson families, never unrelated classrooms.
  const match = /^hk-nobel-(01-kagan|02-soai|03-halzen|04-deisseroth|05-hegemann|06-nagel)-lecture(?:-v[1-9]\d*)?$/.exec(id);
  if (!match) return null;
  const target = `hk-nobel-${match[1]}-discussion-v1`;
  try {
    // The existing filesystem publication reader validates both catalog entries
    // and classroom files. Merely staging a draft must not activate a redirect.
    const courses = await loadPublished();
    return courses.some(course => course.id === target) ? target : null;
  } catch {
    // Leave the old page available if the publication store cannot be read.
    return null;
  }
}
