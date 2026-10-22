#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRubricPath = resolve(
  scriptDir,
  '../docs/curriculum/quality/course-quality-rubric-v1.json',
);

const floor = (value) => Math.floor(value);

export function evaluateCourseQualityReview(rubric, review) {
  const errors = [];
  const blockers = [];
  const structureBlockers = [];
  const interactionBlockers = [];
  const designBlockers = [];
  const fixes = [];

  if (rubric.schemaVersion !== 1) errors.push('unsupported rubric schemaVersion');
  if ((rubric.criteria?.length ?? 0) * rubric.scoreScale?.pass !== 100) {
    errors.push('rubric must define exactly 100 available points');
  }
  if (review.schemaVersion !== 1) errors.push('unsupported review schemaVersion');
  if (!review.courseId || review.courseId === 'REPLACE-ME') errors.push('courseId is missing');
  if (!review.reviewedAt || review.reviewedAt === 'YYYY-MM-DD') errors.push('reviewedAt is missing');
  if (!review.sourcePackage || review.sourcePackage.includes('REPLACE-ME')) {
    errors.push('sourcePackage is missing');
  }

  const phase = rubric.phases?.[review.phase];
  if (!phase) errors.push(`unsupported review phase: ${review.phase ?? 'missing'}`);

  const structureRules = rubric.structureContract ?? {};
  const structure = review.structureContract;
  if (!structure) {
    structureBlockers.push('structureContract is missing');
  } else {
    const archetype = structure.archetype;
    const archetypeRules = structureRules.archetypes?.[archetype];
    if (!archetypeRules) {
      structureBlockers.push(`unsupported structure archetype: ${archetype ?? 'missing'}`);
    }
    const minimumRationaleLength = archetype === 'custom' ? 40 : 20;
    if (
      !structure.archetypeRationale ||
      structure.archetypeRationale.trim().length < minimumRationaleLength
    ) {
      structureBlockers.push(
        `${archetype ?? 'selected'} structure needs a specific archetypeRationale`,
      );
    }
    const sceneCount = structure.sceneCount;
    const slideCount = structure.slideCount;
    if (!Number.isInteger(sceneCount)) {
      structureBlockers.push('structureContract sceneCount must be an integer');
    } else if (
      archetypeRules &&
      (sceneCount < archetypeRules.minimumSceneCount ||
        sceneCount > archetypeRules.maximumSceneCount)
    ) {
      structureBlockers.push(
        `sceneCount is ${sceneCount}; ${archetype} requires ${archetypeRules.minimumSceneCount}-${archetypeRules.maximumSceneCount}`,
      );
    }
    if (!Number.isInteger(slideCount) || slideCount < 0) {
      structureBlockers.push('structureContract slideCount must be a non-negative integer');
    } else if (
      Number.isInteger(sceneCount) &&
      archetypeRules &&
      slideCount > Math.floor(sceneCount * archetypeRules.maximumSlideFraction)
    ) {
      structureBlockers.push(`slideCount is ${slideCount}; slides may not exceed one third of scenes`);
    }

    for (const [component, minimum] of Object.entries(archetypeRules?.minimumComponents ?? {})) {
      const actual = structure.componentCounts?.[component];
      if (!Number.isInteger(actual) || actual < minimum) {
        structureBlockers.push(`${component} count is ${actual ?? 'missing'}; minimum is ${minimum}`);
      }
    }

    const functionsById = new Map();
    for (const learningFunction of structure.functions ?? []) {
      if (functionsById.has(learningFunction.id)) {
        errors.push(`duplicate learning function: ${learningFunction.id}`);
      }
      functionsById.set(learningFunction.id, learningFunction);
    }
    for (const functionId of structureRules.requiredFunctions ?? []) {
      const learningFunction = functionsById.get(functionId);
      if (!learningFunction) {
        structureBlockers.push(`required learning function is missing: ${functionId}`);
        continue;
      }
      if (!Array.isArray(learningFunction.sceneIds) || learningFunction.sceneIds.length === 0) {
        structureBlockers.push(`learning function ${functionId} has no sceneIds`);
      }
      if (!learningFunction.evidence || learningFunction.evidence.trim().length < 12) {
        structureBlockers.push(`learning function ${functionId} needs specific evidence`);
      }
    }

    const stagesById = new Map();
    for (const stage of structure.stages ?? []) {
      if (stagesById.has(stage.id)) errors.push(`duplicate structure stage: ${stage.id}`);
      stagesById.set(stage.id, stage);
    }
    let requiredStages = archetypeRules?.requiredStages ?? [];
    if (archetype === 'custom') {
      const customStages = structure.customRequiredStages ?? [];
      if (customStages.length < (archetypeRules?.minimumCustomStages ?? 0)) {
        structureBlockers.push(
          `custom structure declares ${customStages.length} stages; minimum is ${archetypeRules?.minimumCustomStages}`,
        );
      }
      requiredStages = customStages;
    }
    for (const stageId of requiredStages) {
      const stage = stagesById.get(stageId);
      if (!stage) {
        structureBlockers.push(`required structure stage is missing: ${stageId}`);
        continue;
      }
      if (!Array.isArray(stage.sceneIds) || stage.sceneIds.length === 0) {
        structureBlockers.push(`structure stage ${stageId} has no sceneIds`);
      }
      if (!stage.evidence || stage.evidence.trim().length < 12) {
        structureBlockers.push(`structure stage ${stageId} needs specific evidence`);
      }
    }
    const knownStructureSceneIds = new Set(
      (structure.stages ?? []).flatMap((stage) =>
        Array.isArray(stage.sceneIds) ? stage.sceneIds : [],
      ),
    );
    for (const functionId of structureRules.requiredFunctions ?? []) {
      const learningFunction = functionsById.get(functionId);
      if (
        learningFunction?.sceneIds?.length > 0 &&
        !learningFunction.sceneIds.some((sceneId) => knownStructureSceneIds.has(sceneId))
      ) {
        structureBlockers.push(`learning function ${functionId} is not mapped to a structure scene`);
      }
    }
  }
  blockers.push(...structureBlockers);

  const interactionRules = rubric.interactionContract ?? {};
  const interactionContract = review.interactionContract;
  if (!interactionContract) {
    interactionBlockers.push('interactionContract is missing');
  } else {
    if (interactionContract.lectureOnly !== false) {
      interactionBlockers.push('lectureOnly must be false; the course needs meaningful learner interaction');
    }
    const interactions = interactionContract.interactions ?? [];
    if (interactions.length < interactionRules.minimumInteractions) {
      interactionBlockers.push(
        `interaction count is ${interactions.length}; minimum is ${interactionRules.minimumInteractions}`,
      );
    }
    const interactionIds = new Set();
    const interactionSignatures = new Set();
    const knownSceneIds = new Set(
      (structure?.stages ?? []).flatMap((stage) => (Array.isArray(stage.sceneIds) ? stage.sceneIds : [])),
    );
    for (const interaction of interactions) {
      if (!interaction.id || interactionIds.has(interaction.id)) {
        interactionBlockers.push(`interaction id is missing or duplicated: ${interaction.id ?? 'missing'}`);
      }
      interactionIds.add(interaction.id);
      const interactionSignature = `${interaction.learningPurpose ?? ''}::${interaction.stateVariable ?? ''}`;
      if (interactionSignatures.has(interactionSignature)) {
        interactionBlockers.push(
          `interaction ${interaction.id ?? 'unknown'} duplicates another learning purpose and state variable`,
        );
      }
      interactionSignatures.add(interactionSignature);
      if (!Array.isArray(interaction.sceneIds) || interaction.sceneIds.length === 0) {
        interactionBlockers.push(`interaction ${interaction.id ?? 'unknown'} has no sceneIds`);
      } else if (!interaction.sceneIds.some((sceneId) => knownSceneIds.has(sceneId))) {
        interactionBlockers.push(`interaction ${interaction.id ?? 'unknown'} is not mapped to a structure scene`);
      }
      for (const field of interactionRules.requiredFields ?? []) {
        if (!interaction[field] || interaction[field].trim().length < 12) {
          interactionBlockers.push(`interaction ${interaction.id ?? 'unknown'} needs specific ${field}`);
        }
      }
    }
  }
  blockers.push(...interactionBlockers);

  const signatureRules = rubric.designSignature ?? {};
  const signature = review.designSignature;
  if (!signature) {
    designBlockers.push('designSignature is missing');
  } else {
    for (const field of signatureRules.requiredTextFields ?? []) {
      if (!signature[field] || signature[field].trim().length < 12) {
        designBlockers.push(`designSignature needs specific ${field}`);
      }
    }
    const mechanics = signature.signatureMechanics ?? [];
    if (mechanics.length < signatureRules.minimumSignatureMechanics) {
      designBlockers.push(
        `signature mechanic count is ${mechanics.length}; minimum is ${signatureRules.minimumSignatureMechanics}`,
      );
    }
    const mechanicIds = new Set();
    for (const mechanic of mechanics) {
      if (mechanicIds.has(mechanic.id)) {
        designBlockers.push(`signature mechanic id is duplicated: ${mechanic.id}`);
      }
      mechanicIds.add(mechanic.id);
      for (const field of ['id', 'purpose', 'contentLink']) {
        if (!mechanic[field] || mechanic[field].trim().length < (field === 'id' ? 3 : 12)) {
          designBlockers.push(`signature mechanic needs specific ${field}`);
        }
      }
    }

    const allowedDimensions = new Set(signatureRules.differenceDimensions ?? []);
    const differenceDimensions = new Set();
    for (const difference of signature.differences ?? []) {
      if (!allowedDimensions.has(difference.dimension)) {
        designBlockers.push(`unsupported design difference dimension: ${difference.dimension ?? 'missing'}`);
        continue;
      }
      differenceDimensions.add(difference.dimension);
      if (!difference.description || difference.description.trim().length < 12) {
        designBlockers.push(`design difference ${difference.dimension} needs a specific description`);
      }
      if (!difference.evidence || difference.evidence.trim().length < 12) {
        designBlockers.push(`design difference ${difference.dimension} needs specific evidence`);
      }
    }
    if (differenceDimensions.size < signatureRules.minimumDifferences) {
      designBlockers.push(
        `distinct design differences are ${differenceDimensions.size}; minimum is ${signatureRules.minimumDifferences}`,
      );
    }

    const avoidPatterns = signature.avoidPatterns ?? [];
    if (
      avoidPatterns.length < signatureRules.minimumAvoidPatterns ||
      avoidPatterns.some((pattern) => typeof pattern !== 'string' || pattern.trim().length < 12)
    ) {
      designBlockers.push(`designSignature needs at least ${signatureRules.minimumAvoidPatterns} specific avoidPatterns`);
    }

    for (const feature of signatureRules.requiredFeatureChoices ?? []) {
      const choice = signature.featureChoices?.[feature];
      if (!choice || typeof choice.enabled !== 'boolean') {
        designBlockers.push(`OpenMAIC feature choice is missing: ${feature}`);
      } else if (!choice.reason || choice.reason.trim().length < 12) {
        designBlockers.push(`OpenMAIC feature ${feature} needs a learning-mechanism reason`);
      }
    }
  }
  blockers.push(...designBlockers);

  const reviewerRoles = new Set((review.reviewers ?? []).map((reviewer) => reviewer.role));
  for (const role of phase?.requiredRoles ?? []) {
    if (!reviewerRoles.has(role)) errors.push(`missing required reviewer role: ${role}`);
  }
  for (const reviewer of review.reviewers ?? []) {
    if (!reviewer.name || reviewer.name === 'REPLACE-ME') {
      errors.push(`reviewer ${reviewer.role ?? 'unknown'} is missing a name`);
    }
  }

  const allowedStatuses = new Set(['pass', 'partial', 'fail', 'not_applicable']);
  const reviewById = new Map();
  for (const item of review.criteria ?? []) {
    if (reviewById.has(item.id)) errors.push(`duplicate criterion: ${item.id}`);
    reviewById.set(item.id, item);
  }

  const applicable = (rubric.criteria ?? []).filter((criterion) =>
    criterion.phases.includes(review.phase),
  );
  const dimensionScores = new Map();
  let earned = 0;
  let possible = 0;

  for (const criterion of applicable) {
    const item = reviewById.get(criterion.id);
    if (!item) {
      errors.push(`missing criterion: ${criterion.id}`);
      continue;
    }
    if (!allowedStatuses.has(item.status)) {
      errors.push(`criterion ${criterion.id} has invalid status: ${item.status}`);
      continue;
    }
    if (!item.evidence || item.evidence.trim().length < 12) {
      errors.push(`criterion ${criterion.id} needs specific evidence`);
    }
    if (criterion.critical && item.status !== 'pass') {
      blockers.push(`${criterion.id} ${criterion.title}: ${item.status}`);
    }
    if (item.status === 'not_applicable') {
      if (criterion.critical) errors.push(`critical criterion ${criterion.id} cannot be not_applicable`);
      continue;
    }

    const points = rubric.scoreScale[item.status];
    earned += points;
    possible += rubric.scoreScale.pass;
    const current = dimensionScores.get(criterion.dimension) ?? { earned: 0, possible: 0 };
    current.earned += points;
    current.possible += rubric.scoreScale.pass;
    dimensionScores.set(criterion.dimension, current);
  }

  for (const id of reviewById.keys()) {
    if (!(rubric.criteria ?? []).some((criterion) => criterion.id === id)) {
      errors.push(`unknown criterion: ${id}`);
    }
  }

  const hardContractBlocked = blockers.length > 0;
  const score = hardContractBlocked ? null : possible > 0 ? floor((earned / possible) * 100) : 0;
  const dimensions = {};
  if (!hardContractBlocked) {
    for (const [name, values] of dimensionScores.entries()) {
      const percent = values.possible > 0 ? floor((values.earned / values.possible) * 100) : 0;
      dimensions[name] = percent;
      if (phase && percent < phase.minimumDimensionPercent) {
        fixes.push(`${name} is ${percent}, below ${phase.minimumDimensionPercent}`);
      }
    }
    if (phase && score < phase.minimumScore) {
      fixes.push(`overall score is ${score}, below ${phase.minimumScore}`);
    }
  }

  let verdict = 'SHIP';
  if (errors.length || blockers.length) verdict = 'BLOCK';
  else if (fixes.length) verdict = 'FIX';

  const expectedDecision = verdict === 'SHIP' ? 'approved' : verdict === 'FIX' ? 'fix' : 'blocked';
  if (review.decision !== expectedDecision) {
    errors.push(`decision is ${review.decision ?? 'missing'}; expected ${expectedDecision}`);
    verdict = 'BLOCK';
  }

  return {
    courseId: review.courseId ?? null,
    phase: review.phase ?? null,
    structureArchetype: structure?.archetype ?? null,
    verdict,
    structureComplete: structureBlockers.length === 0 && reviewById.get('Q03')?.status === 'pass',
    interactionComplete:
      interactionBlockers.length === 0 &&
      reviewById.get('Q08')?.status === 'pass' &&
      reviewById.get('Q09')?.status === 'pass',
    designDistinctive: designBlockers.length === 0 && reviewById.get('Q21')?.status === 'pass',
    score,
    minimumScore: phase?.minimumScore ?? null,
    minimumDimensionPercent: phase?.minimumDimensionPercent ?? null,
    dimensions,
    blockers,
    fixes,
    errors,
  };
}

export async function loadAndEvaluateReview(reviewPath, rubricPath = defaultRubricPath) {
  const absoluteReviewPath = resolve(reviewPath);
  const loadReview = async (path, visited = new Set()) => {
    const absolutePath = resolve(path);
    if (visited.has(absolutePath)) throw new Error(`cyclic review inheritance: ${absolutePath}`);
    visited.add(absolutePath);
    const review = JSON.parse(await readFile(absolutePath, 'utf8'));
    if (!review.extends) return review;
    const base = await loadReview(resolve(dirname(absolutePath), review.extends), visited);
    const criteria = new Map((base.criteria ?? []).map((item) => [item.id, item]));
    for (const item of review.criteria ?? []) criteria.set(item.id, item);
    return {
      ...base,
      ...review,
      criteria: [...criteria.values()],
    };
  };
  const [rubric, review] = await Promise.all([
    readFile(resolve(rubricPath), 'utf8').then(JSON.parse),
    loadReview(absoluteReviewPath),
  ]);
  const report = evaluateCourseQualityReview(rubric, review);
  if (review.sourcePackage && !review.sourcePackage.includes('REPLACE-ME')) {
    try {
      await access(resolve(process.cwd(), review.sourcePackage));
    } catch {
      report.errors.push(`sourcePackage does not exist: ${review.sourcePackage}`);
      report.verdict = 'BLOCK';
    }
  }
  return report;
}

const invokedAsCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedAsCli) {
  const reviewPath = process.argv[2];
  if (!reviewPath) {
    console.error('Usage: node scripts/validate-course-quality-review.mjs <review-record.json> [rubric.json]');
    process.exitCode = 2;
  } else {
    const report = await loadAndEvaluateReview(reviewPath, process.argv[3] ?? defaultRubricPath);
    console.log(JSON.stringify(report, null, 2));
    if (report.verdict !== 'SHIP') process.exitCode = 1;
  }
}
