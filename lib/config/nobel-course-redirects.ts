/** Keep saved lecture links on the current learner edition. */
export function nobelCourseRedirects() {
  const editions = [
    ['hk-nobel-01-kagan-lecture', 5],
    ['hk-nobel-02-soai-lecture', 5],
    ['hk-nobel-03-halzen-lecture', 4],
    ['hk-nobel-04-deisseroth-lecture', 3],
    ['hk-nobel-05-hegemann-lecture', 2],
    ['hk-nobel-06-nagel-lecture', 2],
  ] as const;
  return editions.flatMap(([base, version]) =>
    [base, ...Array.from({ length: version - 1 }, (_, i) => `${base}-v${i + 1}`)].map(
      (oldId) => ({
        source: `/classroom/${oldId}`,
        destination: `/classroom/${base}-v${version}`,
        permanent: false,
      }),
    ),
  );
}
