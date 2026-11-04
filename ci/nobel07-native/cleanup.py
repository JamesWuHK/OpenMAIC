"""Independent cancellation fallback: only exact current-run owned resources."""
from pathlib import Path
import json,os,subprocess,time
assert os.environ['GITHUB_REPOSITORY']=='JamesWuHK/OpenMAIC' and os.environ['RUNNER_NAME']=='openmaic-cloud-linux'
run=os.environ['GITHUB_RUN_ID'];attempt=os.environ['GITHUB_RUN_ATTEMPT'];assert run.isdecimal() and attempt.isdecimal()
r=Path(os.environ['RUNNER_TEMP'])/f'nobel07-native-{run}-{attempt}';report=r/'reports';record={'at':time.time(),'run':run,'attempt':attempt,'removed':None}
if not report.exists():print(json.dumps({'noTaskReportDirectory':True}));raise SystemExit(0)
assert not r.is_symlink() and not report.is_symlink()
plan=report/'planned-container.json'
try:
 if plan.exists():
  d=json.loads(plan.read_text());assert d['name']==f'nobel07-native-qa-{run}-{attempt}' and d['owner']=='nobel07-native-20261104' and d['run']==f'{run}-{attempt}'
  for _ in range(3):
   p=subprocess.run(['docker','container','inspect',d['name']],capture_output=True,text=True,timeout=10)
   if p.returncode:
    assert 'no such' in p.stderr.lower();time.sleep(2);continue
   c=json.loads(p.stdout)[0];assert c['Image']==d['imageId'] and c['Config']['Labels'].get('wanli.qa.owner')==d['owner'] and c['Config']['Labels'].get('wanli.qa.run')==d['run']
   if c['State']['Running']:subprocess.run(['docker','stop','--time','5',c['Id']],check=True,capture_output=True,timeout=15)
   actual=json.loads(subprocess.check_output(['docker','container','inspect',c['Id']],timeout=10))[0];assert not actual['State']['Running'] and actual['Image']==d['imageId'] and actual['Config']['Labels']==c['Config']['Labels']
   logs=subprocess.run(['docker','logs',c['Id']],capture_output=True,text=True,timeout=10);(report/'fallback-browser.log').write_text(logs.stdout+logs.stderr)
   subprocess.run(['docker','rm',c['Id']],check=True,capture_output=True,timeout=10);record['removed']=c['Id'];break
 record['success']=True
finally:
 (report/'always-cleanup.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
