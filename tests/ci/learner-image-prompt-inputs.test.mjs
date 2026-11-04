import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
const root=new URL('../../',import.meta.url);
const assets=['lib/prompts/templates','lib/prompts/snippets','packages/@openmaic/generation/templates','packages/@openmaic/generation/snippets','packages/@openmaic/generation/prompts-pbl'];
test('required runtime prompt Markdown survives Docker context and final image packaging',()=>{
 const ignore=fs.readFileSync(new URL('.dockerignore',root),'utf8');
 const dockerfile=fs.readFileSync(new URL('Dockerfile',root),'utf8');
 for(const path of assets){
  assert(fs.existsSync(new URL(path,root)),path+' must exist');
  assert(ignore.lastIndexOf('!'+path+'/**/*.md')>ignore.lastIndexOf('\n*.md'),'Docker context excludes '+path);
  assert(dockerfile.includes('COPY --from=builder --chown=nextjs:nodejs /app/'+path+' ./'+path),'Final image omits '+path);
 }
});
