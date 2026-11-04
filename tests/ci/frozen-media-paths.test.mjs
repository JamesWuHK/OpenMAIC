import test from 'node:test';
import assert from 'node:assert/strict';
import { frozenClassroomMediaPaths } from '../../scripts/qa/frozen-media-paths.mjs';

test('only exact classroom media references are collected from audio and HTML', () => {
  const audio='/api/classroom-media/hk-nobel-01-kagan-lecture-v4/media/narration.mp3';
  const image='/api/classroom-media/hk-nobel-01-kagan-lecture-v4/media/mint.jpg';
  const paths=frozenClassroomMediaPaths({actions:[{audioUrl:audio}],html:`<img src="${image}">`,other:'/api/classroom?id=private'});
  assert.deepEqual([...paths],[audio,image]);
  assert.equal(paths.has('/api/classroom-media/hk-nobel-02-soai-lecture-v4/media/narration.mp3'),false);
  assert.equal(paths.has('/api/classroom?id=private'),false);
});

test('traversal and encoded path separators cannot expand the frozen media boundary', () => {
  const paths=frozenClassroomMediaPaths({urls:[
    '/api/classroom-media/approved/media/../private.json',
    '/api/classroom-media/approved/media/%2e%2e/private.json',
    '/api/classroom-media/approved/media/a%2fb.mp3',
    '/api/classroom-media/approved/not-media/file.mp3']});
  assert.equal(paths.size,0);
});
