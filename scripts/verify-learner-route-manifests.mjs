import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(process.argv[2] || '.next');
const read = p => JSON.parse(readFileSync(resolve(root,p),'utf8'));
const paths=read('server/app-paths-manifest.json');
const urls=read('app-path-routes-manifest.json');
const routes=read('routes-manifest.json');
const required = [
 ['/api/learner/speech','route'], ['/api/chat','route'], ['/api/classroom','route'],
 ['/teach','page'], ['/api/teacher-submissions','route'],
 ['/review/submissions','page'], ['/api/teacher-submissions/[id]','route'],
 ['/teach/status/[id]','page'], ['/series/[slug]/lessons/[number]','page'],
 ['/api/teacher-submissions/[id]/files/[fileId]','route'],
];
for(const [url,type] of required){
 const key=`${url}/${type}`;
 assert.ok(paths[key],`Missing compiled route mapping: ${key}`);
 assert.ok(existsSync(resolve(root,'server',paths[key])),`Missing compiled module: ${key}`);
 assert.equal(urls[key],url,`Missing URL mapping: ${key}`);
 assert.ok([...routes.staticRoutes,...routes.dynamicRoutes].some(r=>r.page===url),`Missing route matcher: ${url}`);
}
console.log(`PASS: ${required.length} learner routes exist in all build manifests`);
