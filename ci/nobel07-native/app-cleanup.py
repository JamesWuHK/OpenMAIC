from pathlib import Path
import subprocess,os,json,shutil
from verify_cloud_lane import verify_cloud_lane
verify_cloud_lane()
w=Path.cwd();assert w==Path(os.environ['TASK_WORKSPACE']) and w.name==f"nobel07-app-{os.environ['GITHUB_RUN_ID']}-{os.environ['GITHUB_RUN_ATTEMPT']}"
out=w/'artifacts/learner-image-qa';out.mkdir(parents=True,exist_ok=True);records=[]
for name in [f"nobel07-app-browser-{os.environ['GITHUB_RUN_ID']}-{os.environ['GITHUB_RUN_ATTEMPT']}",f"learner-candidate-{os.environ['GITHUB_RUN_ID']}"]:
 p=subprocess.run(['docker','inspect',name],capture_output=True,text=True,timeout=15)
 if p.returncode:
  assert 'no such' in p.stderr.lower();records.append({'name':name,'absent':True});continue
 c=json.loads(p.stdout)[0];assert c['Config']['Labels'].get('wanli.qa.owner')=='nobel07-native-app-20261104' and c['Config']['Labels'].get('wanli.qa.run')==os.environ['GITHUB_RUN_ID']
 proof=json.loads((out/'owned-images.json').read_text());assert proof['source']==os.environ['GITHUB_SHA'];expected=proof['browserId'] if name.startswith('nobel07-app-browser-') else proof['appId'];assert expected and c['Image']==expected and c['Config']['Image']==expected
 if c['State']['Running']:subprocess.run(['docker','stop','--time','10',c['Id']],check=True,timeout=20)
 logs=subprocess.run(['docker','logs',c['Id']],capture_output=True,timeout=15);(out/(name+'.log')).write_bytes(logs.stdout+logs.stderr)
 records.append({'name':name,'id':c['Id'],'image':c['Image'],'state':json.loads(subprocess.check_output(['docker','inspect',c['Id']],text=True))[0]['State']})
 subprocess.run(['docker','rm',c['Id']],check=True,timeout=15)
assert w.name.startswith('nobel07-app-') and not w.is_symlink()
for p in [w/'data/classrooms',w/'ci/nobel07-native/node_modules',Path(os.environ['RUNNER_TEMP'])/f"nobel07-app-npm-{os.environ['GITHUB_RUN_ID']}-{os.environ['GITHUB_RUN_ATTEMPT']}"]:
 if p.exists():assert not p.is_symlink();shutil.rmtree(p)
dependency_records=[]
if os.environ.get('NOBEL07_CLEAN_GENERATED_DEPENDENCIES')=='true':
 assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA']
 tracked=subprocess.check_output(['git','ls-files','packages/**/package.json'],text=True).splitlines()
 targets=[w/'node_modules']+[w/Path(name).parent/'node_modules' for name in tracked]
 for target in dict.fromkeys(targets):
  if not target.exists() and not target.is_symlink():continue
  assert target.name=='node_modules' and w in target.parents
  if target.is_symlink():dependency_records.append({'path':str(target.relative_to(w)),'skipped':'root symlink'});continue
  assert target.resolve().is_relative_to(w)
  shutil.rmtree(target);dependency_records.append({'path':str(target.relative_to(w)),'removed':True})
(out/'owned-cleanup.json').write_text(json.dumps({'records':records,'generatedDependencyDirs':dependency_records,'dependencyCleanupSkippedForCancellation':os.environ.get('NOBEL07_CLEAN_GENERATED_DEPENDENCIES')!='true','imagesRetained':True,'productionTouched':False},indent=2)+'\n')
