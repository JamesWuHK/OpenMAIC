from pathlib import Path
import os,sys,json,hashlib,subprocess,time,zipfile,shutil,signal
SRC=Path(__file__).resolve().parent;IMAGE='mcr.microsoft.com/playwright@sha256:65cefd09a5e943921ecd3a6e5414c603db2eb161e9eb48f2e2ccc63486dc7dc0'
assert os.environ['GITHUB_REPOSITORY']=='JamesWuHK/OpenMAIC' and os.environ['RUNNER_NAME']=='openmaic-cloud-linux' and os.getuid()!=0
run_id=os.environ['GITHUB_RUN_ID'];attempt=os.environ['GITHUB_RUN_ATTEMPT'];assert run_id.isdecimal() and attempt.isdecimal()
ROOT=Path(os.environ['RUNNER_TEMP'])/f'nobel07-native-{run_id}-{attempt}';ROOT.mkdir(mode=0o700);REPORTS=ROOT/'reports';REPORTS.mkdir()
NAME=f'nobel07-native-qa-{run_id}-{attempt}';OWNER='nobel07-native-20261104';LABEL=f'{run_id}-{attempt}';container_id=None;planned=False;success=False;failure=None
class TaskCancelled(BaseException):pass
def cancelled(signum,frame):raise TaskCancelled('Host cancellation signal '+str(signum))
signal.signal(signal.SIGTERM,cancelled);signal.signal(signal.SIGINT,cancelled)
proof={'githubSHA':os.environ['GITHUB_SHA'],'runner':os.environ['RUNNER_NAME'],'imageReference':IMAGE,'runId':run_id,'attempt':attempt,'startedAtUnix':time.time(),'pass':False,'productionTouched':False,'newMachineCreated':False}
def save(name,obj):
 p=REPORTS/name;t=p.with_suffix('.new');t.write_text(json.dumps(obj,indent=2)+'\n');t.replace(p)
def call(args,timeout=30):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=timeout)
def inspect(name):
 p=subprocess.run(['docker','container','inspect',name],capture_output=True,text=True,timeout=10)
 if p.returncode:
  assert 'no such' in p.stderr.lower();return None
 return json.loads(p.stdout)[0]
def owned(c):
 assert c['Config']['Labels'].get('wanli.qa.owner')==OWNER and c['Config']['Labels'].get('wanli.qa.run')==LABEL and c['Image']==proof['imageId']
 return c

def resources(memory=2097152):
 m={s.split(':')[0]:int(s.split()[1]) for s in Path('/proc/meminfo').read_text().splitlines() if s.startswith(('MemAvailable:','SwapFree:'))}
 disk=shutil.disk_usage(proof['dockerRoot']).free;tempdisk=shutil.disk_usage(ROOT).free
 sample={'at':time.time(),'monotonic':time.monotonic(),'bootTime':time.clock_gettime(time.CLOCK_BOOTTIME),'loadAverage':list(os.getloadavg()),'availableKiB':m['MemAvailable'],'swapFreeKiB':m['SwapFree'],'dockerFreeBytes':disk,'workspaceFreeBytes':tempdisk}
 with (REPORTS/'resources.jsonl').open('a') as f:f.write(json.dumps(sample)+'\n')
 assert m['MemAvailable']>=memory,'Insufficient host memory reserve';assert disk>=10*1024**3 and tempdisk>=5*1024**3,'Insufficient disk reserve'
 return sample
try:
 assert call(['git','rev-parse','HEAD']).stdout.strip()==proof['githubSHA']
 inputs=json.loads((SRC/'input-manifest.json').read_text());proof['inputManifestSHA256']=hashlib.sha256((SRC/'input-manifest.json').read_bytes()).hexdigest()
 for name,want in inputs.items():assert hashlib.sha256((SRC/name).read_bytes()).hexdigest()==want,name
 assert hashlib.sha256((SRC/'seccomp_profile.json').read_bytes()).hexdigest()=='0c4b9e74b24ed79572cf0b1aaa9c92afc8a13019d8f794c13c73aa4174e9db5a'
 expected=json.loads((SRC/'expected.json').read_text());assert hashlib.sha256((SRC/'course-package.zip').read_bytes()).hexdigest()==expected['zipSHA256']
 proof['dockerRoot']=call(['docker','info','--format','{{.DockerRootDir}}']).stdout.strip();assert Path(proof['dockerRoot']).is_absolute();proof['initialResources']=resources(4194304)
 assert inspect(NAME) is None
 package=json.loads((SRC/'package.json').read_text());assert package['dependencies']=={'playwright':'1.58.2','esbuild':'0.25.12','react':'19.2.3','zustand':'5.0.10'} and not package.get('scripts')
 env=os.environ.copy();env['PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD']='1';env['npm_config_cache']=str(ROOT/'npm-cache')
 p=subprocess.run(['npm','ci','--ignore-scripts','--no-audit','--no-fund'],cwd=SRC,env=env,capture_output=True,text=True,timeout=180);(REPORTS/'npm.log').write_text(p.stdout+p.stderr);assert p.returncode==0
 p=call(['docker','pull',IMAGE],600);(REPORTS/'image-pull.log').write_text(p.stdout+p.stderr)
 image=json.loads(call(['docker','image','inspect',IMAGE]).stdout)[0];assert image['Architecture']=='amd64' and IMAGE in image['RepoDigests'];proof['imageId']=image['Id'];save('image-proof.json',{'id':image['Id'],'architecture':image['Architecture'],'repoDigests':image['RepoDigests']})
 course=ROOT/'course';course.mkdir();
 with zipfile.ZipFile(SRC/'course-package.zip') as z:
  assert len(z.namelist())==53 and set(z.namelist())==set(expected['files']) and sum(i.file_size for i in z.infolist())<32*1024**2
  for i in z.infolist():
   path=Path(i.filename);assert not path.is_absolute() and '..' not in path.parts and (i.external_attr>>16)&0o170000!=0o120000
   raw=z.read(i);assert hashlib.sha256(raw).hexdigest()==expected['files'][i.filename];target=course/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(raw)
 resources(3145728);planned=True;save('planned-container.json',{'name':NAME,'imageId':proof['imageId'],'owner':OWNER,'run':LABEL})
 args=['docker','create','--name',NAME,'--label','wanli.qa.owner='+OWNER,'--label','wanli.qa.run='+LABEL,'--memory','768m','--memory-swap','1024m','--cpus','1','--pids-limit','256','--shm-size','256m','--user',f'{os.getuid()}:{os.getgid()}','--cap-drop','ALL','--security-opt','no-new-privileges','--security-opt','seccomp='+str(SRC/'seccomp_profile.json'),'--network','none','--init','--read-only','--tmpfs','/tmp:rw,nosuid,nodev,size=256m,mode=1777','-e','HOME=/tmp','-e','NOBEL07_CLOUD_QA=existing-linux-runner','-v',str(SRC)+':/qa:ro','-v',str(course)+':/course:ro','-v',str(REPORTS)+':/reports:rw','-w','/qa',proof['imageId'],'timeout','-k','10s','1500s','node','/qa/qa.mjs']
 container_id=call(args).stdout.strip();c=owned(inspect(container_id));assert c['Config']['User']==f'{os.getuid()}:{os.getgid()}' and c['HostConfig']['Memory']==768*1024**2 and c['HostConfig']['NetworkMode']=='none'
 resources();call(['docker','start',container_id]);start=time.monotonic()
 while True:
  resources();c=owned(inspect(container_id));assert not c['State']['OOMKilled'],'Browser OOM';assert time.monotonic()-start<1500,'Browser deadline exceeded'
  if not c['State']['Running']:break
  time.sleep(5)
 save('browser-container.json',{'id':c['Id'],'image':c['Image'],'state':c['State'],'user':c['Config']['User'],'limits':{k:c['HostConfig'][k] for k in ['Memory','MemorySwap','NanoCpus','PidsLimit','ShmSize','NetworkMode','CapDrop']}})
 logs=call(['docker','logs',container_id]);(REPORTS/'browser.log').write_text(logs.stdout+logs.stderr)
 assert c['State']['ExitCode']==0 and not c['State']['OOMKilled'],'Browser process failed'
 report=json.loads((REPORTS/'report.json').read_text());assert report['pass'] and report['uniqueAudioFilesObserved']==50 and sum(x.get('fullCompletionRequired',False) for x in report['audio'])==6
 assert len([x for x in report['cases'] if x['kind']=='page-language-voice'])==96
 proof['reportSHA256']=hashlib.sha256((REPORTS/'report.json').read_bytes()).hexdigest();success=True
except BaseException as error:
 failure={'type':type(error).__name__,'message':str(error)[:1000]};proof['error']=failure
finally:
 errors=[]
 if planned:
  try:
   for _ in range(3):
    c=inspect(container_id or NAME)
    if c:break
    time.sleep(2)
   if c:
    owned(c)
    if c['State']['Running']:call(['docker','stop','--time','5',c['Id']],15)
    stopped=owned(inspect(c['Id']));assert not stopped['State']['Running']
    if not (REPORTS/'browser-container.json').exists():save('browser-container.json',{'id':stopped['Id'],'image':stopped['Image'],'state':stopped['State']})
    logs=call(['docker','logs',c['Id']]);(REPORTS/'browser.log').write_text(logs.stdout+logs.stderr);call(['docker','rm',c['Id']]);assert inspect(c['Id']) is None
  except BaseException as error:errors.append({'stage':'exact-owned-container-cleanup','type':type(error).__name__})
 if not errors:
  for p in [ROOT/'course',ROOT/'npm-cache',SRC/'node_modules']:
   try:
    if p.exists():shutil.rmtree(p)
   except BaseException as error:errors.append({'stage':'own-temporary-files','type':type(error).__name__})
 proof.update(pass_=bool(success and not errors),cleanupErrors=errors,finishedAtUnix=time.time());proof['pass']=proof.pop('pass_');save('runner-result.json',proof)
 print(json.dumps(proof));sys.exit(0 if proof['pass'] else 1)
