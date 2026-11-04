from pathlib import Path
import subprocess,os,json,sys,re
from verify_cloud_lane import verify_cloud_lane
verify_cloud_lane()
q=Path('artifacts/learner-image-qa');q.mkdir(parents=True,exist_ok=True);p=q/'owned-images.json';mode=sys.argv[1];assert mode in ['app','browser']
if mode=='app':
 ref='wanli-learner-ci:'+os.environ['GITHUB_SHA'];im=json.loads(subprocess.check_output(['docker','image','inspect',ref],text=True))[0]
 assert im['Config']['Labels'].get('org.opencontainers.image.revision')==os.environ['GITHUB_SHA'];assert re.fullmatch('sha256:[0-9a-f]{64}',im['Id'])
 d={'source':os.environ['GITHUB_SHA'],'appId':im['Id'],'appReference':ref,'browserId':None};p.write_text(json.dumps(d,indent=2)+'\n')
 with open(os.environ['GITHUB_ENV'],'a') as f:f.write('NOBEL07_APP_IMAGE_ID='+im['Id']+'\n')
 print(im['Id'])
else:
 d=json.loads(p.read_text());assert d['source']==os.environ['GITHUB_SHA'];name='learner-candidate-'+os.environ['GITHUB_RUN_ID'];c=json.loads(subprocess.check_output(['docker','inspect',name],text=True))[0]
 assert c['Image']==d['appId'] and c['Config']['Image']==d['appId'] and c['Config']['Labels'].get('wanli.qa.owner')=='nobel07-native-app-20261104' and c['Config']['Labels'].get('wanli.qa.run')==os.environ['GITHUB_RUN_ID']
 ref='mcr.microsoft.com/playwright@sha256:65cefd09a5e943921ecd3a6e5414c603db2eb161e9eb48f2e2ccc63486dc7dc0';im=json.loads(subprocess.check_output(['docker','image','inspect',ref],text=True))[0]
 assert im['Architecture']=='amd64' and ref in im['RepoDigests'] and re.fullmatch('sha256:[0-9a-f]{64}',im['Id']);d.update(browserId=im['Id'],browserReference=ref,candidateContainerId=c['Id']);p.write_text(json.dumps(d,indent=2)+'\n');print(im['Id'])
