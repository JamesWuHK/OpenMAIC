#!/usr/bin/env node
// Scoped production repair for the retired OpenRouter MiniMax free endpoint.
// The script never prints or copies model keys outside the learner server.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const run = promisify(execFile);
const apply = process.argv.includes('--apply');
const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'learner-model-switch-'));
const keyPath = path.join(temporaryDirectory, 'ssh-key');
const quote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;

const remotePython = `
import json, os, pathlib, shutil, subprocess, tempfile, time
root=pathlib.Path('/opt/openmaic-learner')
env_path=root/'learner.env'
compose=root/'docker-compose.learner-static.yml'
old='openrouter:minimax/minimax-m3.1-flash:free'
new='openrouter:openrouter/free'
apply=${apply ? 'True' : 'False'}
assert env_path.is_file() and compose.is_file(), 'Expected learner deployment files absent'
lines=env_path.read_text().splitlines(keepends=True)
values={}
for line in lines:
 if '=' in line and not line.lstrip().startswith('#'):
  key,value=line.rstrip('\\n').split('=',1)
  values.setdefault(key,[]).append(value)
for key in ('DEFAULT_MODEL','OPENROUTER_MODELS','MODEL_ROUTES','OPENROUTER_API_KEY'):
 assert len(values.get(key,[]))==1, 'Missing or duplicate '+key
assert values['DEFAULT_MODEL'][0]==old, 'Default model drifted; no change'
assert values['OPENROUTER_MODELS'][0]=='minimax/minimax-m3.1-flash:free', 'Model list drifted; no change'
assert bool(values['OPENROUTER_API_KEY'][0].strip()), 'OpenRouter key absent'
routes=json.loads(values['MODEL_ROUTES'][0])
assert set(routes)=={'chat-adapter','pbl-v2-runtime'}, 'Route set drifted; no change'
for name in routes:
 assert isinstance(routes[name],dict) and routes[name].get('model')==old, 'Route drifted; no change'
routes={name:{**value,'model':new} for name,value in routes.items()}
changes={'DEFAULT_MODEL':new,'OPENROUTER_MODELS':'openrouter/free','MODEL_ROUTES':json.dumps(routes,separators=(',',':'),ensure_ascii=False)}
updated=[]
for line in lines:
 key=line.split('=',1)[0] if '=' in line else ''
 updated.append(key+'='+changes[key]+'\\n' if key in changes else line)
subprocess.run(['docker','compose','-f',str(compose),'config','--quiet'],cwd=root,check=True,capture_output=True)
if not apply:
 print(json.dumps({'ready':True,'apply':False,'oldModel':old,'newModel':new,'routes':sorted(routes),'keyConfigured':True}))
 raise SystemExit(0)
rollback_dir=root/'.rollback-model-config'
rollback_dir.mkdir(mode=0o700,exist_ok=True)
os.chmod(rollback_dir,0o700)
backup=rollback_dir/('learner-before-free-router-'+time.strftime('%Y%m%dT%H%M%SZ',time.gmtime())+'.env')
assert not backup.exists(), 'Rollback target exists'
shutil.copy2(env_path,backup)
os.chmod(backup,0o600)
handle=tempfile.NamedTemporaryFile(mode='w',dir=root,prefix='.learner-env-',delete=False)
try:
 os.chmod(handle.name,0o600)
 handle.write(''.join(updated))
 handle.flush(); os.fsync(handle.fileno()); handle.close()
 os.replace(handle.name,env_path)
 subprocess.run(['docker','compose','-f',str(compose),'config','--quiet'],cwd=root,check=True,capture_output=True)
 subprocess.run(['docker','compose','-f',str(compose),'up','-d','--no-build','--no-deps','--force-recreate','openmaic'],cwd=root,check=True,capture_output=True,timeout=120)
 ids=subprocess.check_output(['docker','ps','--filter','label=com.docker.compose.service=openmaic','--format','{{.ID}}'],text=True).strip().splitlines()
 assert len(ids)==1,'Expected one running learner container'
 info=json.loads(subprocess.check_output(['docker','inspect',ids[0]],text=True))[0]
 current=dict(item.split('=',1) for item in info['Config']['Env'] if '=' in item)
 assert current.get('DEFAULT_MODEL')==new,'Container did not adopt model route'
 assert json.loads(current['MODEL_ROUTES'])['chat-adapter']['model']==new,'Chat route not adopted'
 print(json.dumps({'applied':True,'oldModel':old,'newModel':new,'container':ids[0],'imageId':info['Image'],'status':info['State']['Status'],'rollbackFile':str(backup)}))
except Exception:
 try:
  if os.path.exists(handle.name): os.unlink(handle.name)
  shutil.copy2(backup,env_path); os.chmod(env_path,0o600)
  subprocess.run(['docker','compose','-f',str(compose),'up','-d','--no-build','--no-deps','--force-recreate','openmaic'],cwd=root,check=True,capture_output=True,timeout=120)
  print(json.dumps({'applied':False,'rolledBack':True,'rollbackFile':str(backup)}))
 except Exception:
  print(json.dumps({'applied':False,'rolledBack':False,'rollbackFile':str(backup)}))
 raise
`;

try {
  const { stdout } = await run('aws', [
    'lightsail', 'get-instance-access-details', '--profile', 'wanli-lightsail-ops',
    '--region', 'ap-east-1', '--instance-name', 'openmaic-learner-hk',
    '--protocol', 'ssh', '--output', 'json',
  ], { timeout: 30_000, maxBuffer: 1_000_000 });
  const details = JSON.parse(stdout).accessDetails;
  await writeFile(keyPath, details.privateKey, { mode: 0o600 });
  await writeFile(`${keyPath}-cert.pub`, details.certKey, { mode: 0o600 });
  const result = await run('/usr/bin/ssh', [
    '-i', keyPath, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
    '-o', 'StrictHostKeyChecking=accept-new',
    `${details.username}@${details.ipAddress}`,
    `sudo -n python3 -c ${quote(remotePython)}`,
  ], { timeout: apply ? 180_000 : 30_000, maxBuffer: 1_000_000 });
  process.stdout.write(result.stdout);
} catch (error) {
  console.error(`Scoped model ${apply ? 'switch' : 'preflight'} failed (${error?.code ?? error?.name ?? 'unknown'}); no credentials logged.`);
  process.exitCode = 1;
} finally {
  await unlink(keyPath).catch(() => {});
  await unlink(`${keyPath}-cert.pub`).catch(() => {});
  await rmdir(temporaryDirectory).catch(() => {});
}
