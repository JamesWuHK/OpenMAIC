"""Allow only the existing self-hosted lane or public standard GitHub Linux CI."""
import os,json,sys
from pathlib import Path

def verify_cloud_lane():
 assert os.environ['GITHUB_REPOSITORY']=='JamesWuHK/OpenMAIC' and sys.platform=='linux' and os.getuid()!=0
 lane=os.environ.get('NOBEL07_CLOUD_LANE','existing-self-hosted')
 if lane=='existing-self-hosted':
  assert os.environ['RUNNER_NAME']=='openmaic-cloud-linux'
 elif lane=='github-hosted-public-standard':
  assert os.environ['RUNNER_ENVIRONMENT']=='github-hosted' and os.environ['RUNNER_OS']=='Linux' and os.environ['RUNNER_ARCH']=='X64'
  event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
  assert event['repository']['full_name']=='JamesWuHK/OpenMAIC' and event['repository']['private'] is False
 else:raise AssertionError('Unapproved cloud lane')
 return {'lane':lane,'runner':os.environ['RUNNER_NAME'],'os':os.environ['RUNNER_OS'],'arch':os.environ['RUNNER_ARCH']}

if __name__=='__main__':print(json.dumps(verify_cloud_lane()))
