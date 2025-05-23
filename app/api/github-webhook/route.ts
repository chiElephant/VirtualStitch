import { NextRequest } from 'next/server';
import { verify } from '@octokit/webhooks-methods';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { Redis } from '@upstash/redis';
import { createCheckRun, updateCheckRun } from '@/lib/github';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Match route like /api/github-webhook/303DEVS/report
  const match = pathname.match(/\/([^\/]+)\/report$/);
  if (match) {
    const routeOwner = match[1];
    const ownerPrefix =
      routeOwner.toLowerCase().includes('303devs') ? '303DEVS'
      : routeOwner.toLowerCase().includes('chie') ? 'CHIELEPHANT'
      : undefined;

    if (!ownerPrefix) {
      return new Response('Unsupported owner in route', { status: 400 });
    }

    const appId = process.env[`${ownerPrefix}_GITHUB_APP_ID`]!;
    const privateKey = process.env[
      `${ownerPrefix}_GITHUB_PRIVATE_KEY`
    ]!.replace(/\\n/g, '\n');
    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/');

    const body = await req.json();
    const { sha, name, status, conclusion, title, summary, details_url } = body;

    try {
      const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: { appId, privateKey },
      });

      const { data: installation } =
        await appOctokit.rest.apps.getRepoInstallation({ owner, repo });

      const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: { appId, privateKey, installationId: installation.id },
      });

      const checkName = name || 'ci-checks';
      const list = await octokit.rest.checks.listForRef({
        owner,
        repo,
        ref: sha,
      });
      const checkRun = list.data.check_runs.find((c) => c.name === checkName);

      if (!checkRun) {
        return new Response(
          `Check run '${checkName}' not found for sha ${sha}`,
          { status: 404 }
        );
      }

      const redisKey = `check:${checkRun.id}:${status}:${conclusion}`;
      const alreadyUpdated = await redis.get(redisKey);
      if (alreadyUpdated) {
        return new Response('⏭️ Duplicate check update skipped.', {
          status: 200,
        });
      }

      await updateCheckRun(octokit, {
        owner,
        repo,
        check_run_id: checkRun.id,
        status,
        conclusion,
        completed_at: conclusion ? new Date().toISOString() : undefined,
        output: { title, summary },
        details_url,
      });

      await redis.set(redisKey, true, { ex: 600 });
      return new Response('✅ Check run updated', { status: 200 });
    } catch (err) {
      console.error('❌ Failed to update check run:', err);
      return new Response('Internal error', { status: 500 });
    }
  }

  // === Webhook handler for check_suite ===
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256') || '';
  const event = req.headers.get('x-github-event') || '';

  const webhookSecrets = ['303DEVS', 'CHIELEPHANT'].map(
    (prefix) => process.env[`${prefix}_GITHUB_WEBHOOK_SECRET`]
  );

  const isValid = await Promise.any(
    webhookSecrets.map((secret) => verify(secret!, rawBody, signature))
  ).catch(() => false);

  if (!isValid) return new Response('Invalid signature', { status: 401 });

  const payload = JSON.parse(rawBody);
  console.log('🔔 Webhook received:', event);

  if (event !== 'check_suite' || payload.action !== 'requested') {
    return new Response('Event ignored', { status: 200 });
  }

  const sha = payload.check_suite?.head_sha;
  const owner = payload.repository?.owner?.login;
  const repo = payload.repository?.name;
  const installationId = payload.installation?.id;

  if (!sha || !owner || !repo || !installationId) {
    return new Response('Missing required payload data', { status: 400 });
  }

  const prefix =
    owner.toLowerCase().includes('303devs') ? '303DEVS'
    : owner.toLowerCase().includes('chie') ? 'CHIELEPHANT'
    : undefined;

  if (!prefix) {
    return new Response('Unsupported repository owner.', { status: 400 });
  }

  const appId = process.env[`${prefix}_GITHUB_APP_ID`]!;
  const privateKey = process.env[`${prefix}_GITHUB_PRIVATE_KEY`]!.replace(
    /\\n/g,
    '\n'
  );

  const alreadyCreated = await redis.get(`checks_created:${sha}`);
  if (alreadyCreated) {
    return new Response('⏭️ Checks already created for this SHA.', {
      status: 200,
    });
  }

  const checkNames = [
    'ci-checks',
    'playwright-tests (chromium)',
    'playwright-tests (webkit)',
    'playwright-tests (firefox)',
  ];

  try {
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: { appId, privateKey, installationId },
    });

    for (const checkName of checkNames) {
      await createCheckRun(octokit, {
        owner,
        repo,
        name: checkName,
        head_sha: sha,
        status: 'queued',
        output: {
          title: checkName,
          summary: 'Check initialized.',
        },
      });
    }

    await redis.set(`checks_created:${sha}`, true, { ex: 3600 });
    return new Response('✅ All check runs created', { status: 200 });
  } catch (err) {
    console.error('❌ Failed to create check runs:', err);
    return new Response('Internal error', { status: 500 });
  }
}
