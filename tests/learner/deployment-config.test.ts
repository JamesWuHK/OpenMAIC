import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

describe('learner container configuration', () => {
  it('compiles the public deployment mode into the browser bundle', async () => {
    const dockerfile = await readFile(`${root}/Dockerfile`, 'utf8');
    expect(dockerfile).toContain('ARG NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE');
    expect(dockerfile).not.toContain('OPENMAIC_SKIP_BUILD_TYPECHECK');
    expect(dockerfile).toContain('ARG NEXT_PUBLIC_PRO_WORKBENCH_ENABLED');
    // edge-tts 7.2.8 uses the retired read-aloud handshake and returns 403.
    expect(dockerfile).toContain('edge-tts==7.3.1');
    expect(dockerfile).toContain(
      'ENV NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE=$NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE',
    );
    expect(dockerfile).toContain(
      'ENV NEXT_PUBLIC_PRO_WORKBENCH_ENABLED=$NEXT_PUBLIC_PRO_WORKBENCH_ENABLED',
    );
  });

  it('provides a learner compose overlay with matching client and server modes', async () => {
    const compose = await readFile(`${root}/docker-compose.learner.yml`, 'utf8');
    expect(compose).toContain('NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE=learner');
    expect(compose).toContain('OPENMAIC_DEPLOYMENT_MODE=learner');
    expect(compose).toContain('OPENMAIC_LEARNER_ENV_FILE:-learner.env');
    expect(compose).toContain('NEXT_PUBLIC_PI_CHAT_ENABLED=true');
    expect(compose).not.toContain('render-service');
  });

  it('provides a learner deployment with PostgreSQL and read-only classroom media', async () => {
    const compose = await readFile(`${root}/docker-compose.learner-static.yml`, 'utf8');
    const caddyfile = await readFile(`${root}/deploy/Caddyfile`, 'utf8');
    expect(compose).toContain('NEXT_PUBLIC_OPENMAIC_DEPLOYMENT_MODE: learner');
    expect(compose).toContain("NEXT_PUBLIC_PI_CHAT_ENABLED: 'true'");
    expect(compose).not.toContain('OPENMAIC_SKIP_BUILD_TYPECHECK');
    expect(compose).toContain("OPENMAIC_BUILD_CPUS: '1'");
    expect(compose).toContain('OPENMAIC_DEPLOYMENT_MODE: learner');
    expect(compose).toContain("TRUST_PROXY_HEADERS: 'true'");
    expect(compose).toContain('OPENMAIC_LEARNER_ENV_FILE:-learner.env');
    expect(compose).toContain('./data/classrooms:/app/data/classrooms:ro');
    expect(compose).toContain('LEARNER_SITE_CONTENT_PATH: /app/content/learner/site-content.json');
    expect(compose).toContain('./content/learner:/app/content/learner:ro');
    expect(compose).toContain('./content/learner/media:/app/public/learner/runtime:ro');
    expect(compose).toContain('caddy:');
    expect(compose).toContain("'80:80'");
    expect(compose).toContain("'443:443'");
    expect(compose).not.toContain("'80:3000'");
    expect(compose).toContain('postgres:');
    expect(compose).toContain('learner_postgres:/var/lib/postgresql/data');
    expect(compose).toContain('required: true');
    expect(compose).not.toContain('server-providers.yml');
    expect(caddyfile).toContain('class.wanli.ai');
    expect(caddyfile).toContain('reverse_proxy openmaic:3000');
  });

  it('does not require the authoring deployment env file', async () => {
    const compose = await readFile(`${root}/docker-compose.yml`, 'utf8');
    expect(compose).toContain('path: .env.local');
    expect(compose).toContain('required: false');
  });

  it('does not import every classroom into PostgreSQL on the learner host', async () => {
    const instrumentation = await readFile(`${root}/instrumentation.ts`, 'utf8');
    const browserBootstrap = await readFile(`${root}/lib/persistence/bootstrap.ts`, 'utf8');
    expect(instrumentation).toContain('const legacyClassroomImport = authoringWorkersEnabled');
    expect(browserBootstrap).toContain('if (!isLearnerDeployment()) {');
    expect(browserBootstrap).toContain('scheduleLegacyBrowserImport');
  });

  it('validates runtime course metadata before content-only publishing', async () => {
    const script = await readFile(`${root}/scripts/publish-learner-content.sh`, 'utf8');
    const packageJson = JSON.parse(await readFile(`${root}/package.json`, 'utf8'));
    expect(script).toContain('pnpm validate:learner-content');
    expect(script.indexOf('pnpm validate:learner-content')).toBeLessThan(script.indexOf('rsync'));
    expect(script).not.toMatch(/docker\s+(?:build|compose|restart)/);
    expect(script).not.toMatch(/rsync[^\n]*--delete/);
    expect(script).toContain('StrictHostKeyChecking=yes');
    expect(script.indexOf('data/classrooms/$course_id.json"')).toBeLessThan(
      script.indexOf('published-courses.json.next'),
    );
    expect(script).toContain('node scripts/qa-learner-published-content.mjs');
    expect(packageJson.scripts['validate:learner-content']).toBe(
      'tsx scripts/validate-learner-site-content.ts',
    );
    expect(packageJson.scripts['validate:learner-content:portable']).toBe(
      'node scripts/validate-learner-content-contract.mjs',
    );
  });

  it('documents the deployment mode without containing credentials', async () => {
    const example = await readFile(`${root}/learner.env.example`, 'utf8');
    expect(example).toContain('DATABASE_URL=');
    expect(example).toContain('POSTGRES_PASSWORD=');
    expect(example).not.toContain('PERSISTENCE_DEV_TOKEN=');
    expect(example).not.toMatch(/sk-[A-Za-z0-9]/);
  });
});
