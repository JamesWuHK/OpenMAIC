from pathlib import Path
import os,json,hashlib,zipfile,subprocess,shutil
assert os.environ['GITHUB_REPOSITORY']=='JamesWuHK/OpenMAIC' and os.environ['RUNNER_NAME']=='openmaic-cloud-linux' and os.getuid()!=0
w=Path.cwd();assert w==Path(os.environ['TASK_WORKSPACE']) and w.name==f"nobel07-app-{os.environ['GITHUB_RUN_ID']}-{os.environ['GITHUB_RUN_ATTEMPT']}"
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==os.environ['GITHUB_SHA']
q=w/'ci/nobel07-native'
for name,want in json.loads((q/'app-input-manifest.json').read_text()).items():assert hashlib.sha256((q/name).read_bytes()).hexdigest()==want,name
for name,proof in json.loads((q/'app-source-manifest.json').read_text())['files'].items():assert hashlib.sha256((w/name).read_bytes()).hexdigest()==proof['SHA256'],name
memory=int(next(s.split()[1] for s in Path('/proc/meminfo').read_text().splitlines() if s.startswith('MemAvailable:')));disk=shutil.disk_usage(w).free
assert memory>=8*1024**2 and disk>=20*1024**3,'Cloud reserve insufficient; do not build'
a=w/'artifacts';a.mkdir(exist_ok=True);(a/'nobel07-build-resource.json').write_text(json.dumps({'availableKiB':memory,'freeDiskBytes':disk,'newMachineCreated':False,'productionTouched':False})+'\n')
expected=json.loads((q/'expected.json').read_text());raw=(q/'course-package.zip').read_bytes();assert hashlib.sha256(raw).hexdigest()==expected['zipSHA256'];cid=expected['courseId'];assert cid=='hk-nobel-07-sakaguchi-lecture-v1'
folder=w/'data/classrooms'/cid;folder.mkdir(parents=True,exist_ok=False)
with zipfile.ZipFile(q/'course-package.zip') as z:
 assert set(z.namelist())==set(expected['files']) and len(z.namelist())==53 and sum(i.file_size for i in z.infolist())<32*1024**2
 for i in z.infolist():
  name=Path(i.filename);assert not name.is_absolute() and '..' not in name.parts and (i.external_attr>>16)&0o170000!=0o120000
  b=z.read(i);assert hashlib.sha256(b).hexdigest()==expected['files'][i.filename];p=folder/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
(folder.parent/(cid+'.json')).write_bytes((folder/'classroom.json').read_bytes())
print('Exact four-file runtime and 53-file classroom fixture verified; isolated cloud build only')
