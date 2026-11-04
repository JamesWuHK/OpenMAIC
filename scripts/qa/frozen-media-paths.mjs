// Public media URLs must come from this exact frozen classroom, not an arbitrary
// API path. This never proxies classroom JSON, credentials or inference calls.
export function frozenClassroomMediaPaths(classroom) {
  const paths = new Set();
  const visit = value => {
    if (typeof value === 'string') {
      for (const [candidate] of value.matchAll(/\/api\/classroom-media\/[A-Za-z0-9_-]+\/(?:media|audio)\/[^\s"'<>\\?#)]+/g)) {
        const parts = candidate.split('/');
        if (parts.some(part => part === '.' || part === '..' || /%2e|%2f|%5c/i.test(part))) continue;
        paths.add(candidate);
      }
    } else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  };
  visit(classroom);
  return paths;
}
