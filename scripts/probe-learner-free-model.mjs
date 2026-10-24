#!/usr/bin/env node
// Read-only, synthetic OpenRouter probe through the learner server. Never prints credentials.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const run = promisify(execFile);
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'learner-model-probe-'));
const keyPath = path.join(temporaryDirectory, 'ssh-key');

const quote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;

try {
  const { stdout } = await run('aws', [
    'lightsail', 'get-instance-access-details', '--profile', 'wanli-lightsail-ops',
    '--region', 'ap-east-1', '--instance-name', 'openmaic-learner-hk',
    '--protocol', 'ssh', '--output', 'json',
  ], { timeout: 30_000, maxBuffer: 1_000_000 });
  const details = JSON.parse(stdout).accessDetails;
  await writeFile(keyPath, details.privateKey, { mode: 0o600 });
  await writeFile(`${keyPath}-cert.pub`, details.certKey, { mode: 0o600 });

  const containerScript = `(async()=>{const key=process.env.OPENROUTER_API_KEY;if(!key){console.log(JSON.stringify({configured:false}));return}const start=Date.now();const res=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','HTTP-Referer':'https://class.wanli.ai','X-Title':'Wanli AI Classroom'},body:JSON.stringify({model:'openrouter/free',messages:[{role:'user',content:'請用繁體中文、香港常用字詞，簡短回答：如何改善一個圖片分類器？'}],max_tokens:100})});const data=await res.json();console.log(JSON.stringify({configured:true,status:res.status,latencyMs:Date.now()-start,model:data.model||null,answer:typeof data.choices?.[0]?.message?.content==='string'?data.choices[0].message.content.slice(0,250):null,error:typeof data.error?.message==='string'?data.error.message.slice(0,250):null}))})().catch(e=>{console.log(JSON.stringify({probeError:e.message.slice(0,200)}));process.exitCode=1})`;
  const remoteCode = `import subprocess\ncontainers=subprocess.check_output(['sudo','-n','docker','ps','--filter','label=com.docker.compose.service=openmaic','--format','{{.ID}}'],text=True).strip().splitlines()\nassert len(containers)==1,'Expected exactly one learner container'\nsubprocess.run(['sudo','-n','docker','exec',containers[0],'node','-e',${JSON.stringify(containerScript)}],check=True,timeout=45)`;
  const remoteCommand = `python3 -c ${quote(remoteCode)}`;
  const result = await run('/usr/bin/ssh', [
    '-i', keyPath, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
    '-o', 'StrictHostKeyChecking=accept-new',
    `${details.username}@${details.ipAddress}`, remoteCommand,
  ], { timeout: 60_000, maxBuffer: 1_000_000 });
  process.stdout.write(result.stdout);
} catch (error) {
  console.error(`Synthetic model probe failed (${error?.code ?? error?.name ?? 'unknown'}); no credentials logged.`);
  process.exitCode = 1;
} finally {
  await unlink(keyPath).catch(() => {});
  await unlink(`${keyPath}-cert.pub`).catch(() => {});
  await rmdir(temporaryDirectory).catch(() => {});
}
