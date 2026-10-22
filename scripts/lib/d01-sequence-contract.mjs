export const D01_PBL_REQUIRED_STAGES = [
  'driving-question', 'readiness-check', 'project-brief', 'investigation',
  'prototype', 'critique', 'revision', 'showcase', 'reflection-transfer',
];

export function validateD01PedagogicalSequence(scenes) {
  const failures = [];
  const types = scenes.map(({ type }) => type);
  if (scenes.length < 7 || scenes.length > 12) failures.push(`PBL studio requires 7–12 scenes; found ${scenes.length}`);

  const slideCount = scenes.filter(({ type }) => type === 'slide').length;
  const slideFraction = scenes.length ? slideCount / scenes.length : 1;
  if (slideFraction > 0.25) failures.push(`PBL studio slide fraction exceeds 25%: ${slideCount}/${scenes.length}`);

  const pblScenes = scenes.filter(({ type }) => type === 'pbl');
  const project = pblScenes[0]?.content?.projectV2;
  if (scenes[0]?.type !== 'pbl' || !project) failures.push('the student-owned project workspace must open the course, not be appended after a lecture sequence');
  if (pblScenes.length !== 1) failures.push(`the PBL spine must be one persistent project workspace; found ${pblScenes.length}`);

  const stages = project?.milestones?.map(({ curriculumStage }) => curriculumStage) ?? [];
  if (JSON.stringify(stages) !== JSON.stringify(D01_PBL_REQUIRED_STAGES)) {
    failures.push(`PBL workspace must implement the nine ordered project stages; found ${JSON.stringify(stages)}`);
  }
  for (const [index, milestone] of (project?.milestones ?? []).entries()) {
    if (!milestone.title || !milestone.briefing || !milestone.completionCriteria) failures.push(`PBL stage ${index + 1} is missing a learner-facing goal or evidence criterion`);
    if (!milestone.microtasks?.length || milestone.microtasks.some(({ description, completionCriteria }) => !description || !completionCriteria)) {
      failures.push(`PBL stage ${index + 1} lacks an executable learner action and observable completion evidence`);
    }
  }
  if (pblScenes[0]?.order > 1) failures.push('PBL workspace appears after the project launch rather than being directly available at course entry');
  if (!scenes.some(({ type }) => type === 'interactive')) failures.push('PBL studio requires at least one content-native stateful interaction');
  if (scenes.some(({ type }) => type === 'quiz')) failures.push('standalone quiz scenes cannot substitute for project critique, revision, showcase, or transfer evidence');
  if (!project?.milestones?.some(({ curriculumStage }) => curriculumStage === 'revision')) failures.push('the project must contain an explicit learner-owned revision stage');
  if (!project?.milestones?.some(({ curriculumStage }) => curriculumStage === 'showcase')) failures.push('the project must contain a showcase stage with evidence');

  return { failures, types, pblSceneOrder: pblScenes[0]?.order ?? null, slideCount, slideFraction, projectStages: stages };
}
