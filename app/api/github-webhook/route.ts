// File: app/api/github-webhook/route.ts
import { NextRequest } from 'next/server';
import { verify } from '@octokit/webhooks-methods';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { Redis } from '@upstash/redis';

// Types
interface OrganizationConfig {
  app_id_env: string;
  private_key_env: string;
  webhook_secret_env: string;
  identifiers: string[];
}

interface PipelineConfigType {
  organizations: Record<string, OrganizationConfig>;
  workflows: {
    ci: {
      name: string;
    };
  };
}

// Utility functions
function sanitizeInput(input: string): string {
  return input.replace(
    /[<>'"&]/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      })[char] || char
  );
}

function generateRequestId(): string {
  return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Validation functions
function validateSHA(sha: string): boolean {
  return /^[a-f0-9]{40}$/i.test(sha);
}

function validateStatus(
  status: string
): status is 'queued' | 'in_progress' | 'completed' {
  return ['queued', 'in_progress', 'completed'].includes(status);
}

function validateConclusion(
  conclusion: string
): conclusion is
  | 'action_required'
  | 'cancelled'
  | 'failure'
  | 'neutral'
  | 'success'
  | 'skipped'
  | 'stale'
  | 'timed_out' {
  return [
    'action_required',
    'cancelled',
    'failure',
    'neutral',
    'success',
    'skipped',
    'stale',
    'timed_out',
  ].includes(conclusion);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateWebhookPayload(body: any) {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload: must be an object');
  }

  const { sha, name, status, conclusion, title, summary, details_url } = body;

  if (!sha || !validateSHA(sha)) {
    throw new Error('Invalid SHA: must be 40 character hex string');
  }

  if (
    !name ||
    typeof name !== 'string' ||
    name.length === 0 ||
    name.length > 100
  ) {
    throw new Error('Invalid name: must be 1-100 characters');
  }

  if (!status || !validateStatus(status)) {
    throw new Error(
      'Invalid status: must be queued, in_progress, or completed'
    );
  }

  if (conclusion && !validateConclusion(conclusion)) {
    throw new Error(
      'Invalid conclusion: must be one of the allowed conclusion types'
    );
  }

  if (
    !title ||
    typeof title !== 'string' ||
    title.length === 0 ||
    title.length > 200
  ) {
    throw new Error('Invalid title: must be 1-200 characters');
  }

  if (
    !summary ||
    typeof summary !== 'string' ||
    summary.length === 0 ||
    summary.length > 1000
  ) {
    throw new Error('Invalid summary: must be 1-1000 characters');
  }

  try {
    new URL(details_url);
  } catch {
    throw new Error('Invalid details_url: must be a valid URL');
  }

  return {
    sha,
    name,
    status,
    conclusion,
    title,
    summary,
    details_url,
  };
}

// Rate limiting
class RateLimiter {
  private static requests = new Map<string, number[]>();

  static isRateLimited(
    identifier: string,
    windowMs = 60000,
    maxRequests = 100
  ): boolean {
    const now = Date.now();
    const window = this.requests.get(identifier) || [];

    const validRequests = window.filter(
      (timestamp) => now - timestamp < windowMs
    );

    if (validRequests.length >= maxRequests) {
      return true;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return false;
  }
}

// Circuit breaker
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold = 5,
    private timeout = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Configuration management
class ConfigManager {
  private static config: PipelineConfigType | null = null;

  static async getConfig(): Promise<PipelineConfigType> {
    if (!this.config) {
      this.config = {
        organizations: {
          '303DEVS': {
            app_id_env: 'GITHUB_APP_ID_303DEVS',
            private_key_env: 'GITHUB_PRIVATE_KEY_303DEVS',
            webhook_secret_env: '303DEVS_GITHUB_WEBHOOK_SECRET',
            identifiers: ['303devs', '303DEVS'],
          },
          'CHIELEPHANT': {
            app_id_env: 'GITHUB_APP_ID_CHIELEPHANT',
            private_key_env: 'GITHUB_PRIVATE_KEY_CHIELEPHANT',
            webhook_secret_env: 'CHIELEPHANT_GITHUB_WEBHOOK_SECRET',
            identifiers: ['chie', 'chielephant', 'CHIELEPHANT'],
          },
        },
        workflows: {
          ci: {
            name: '✅ ci-checks',
          },
        },
      };
    }
    return this.config;
  }

  static getOrganizationByIdentifier(
    identifier: string
  ): { name: string; config: OrganizationConfig } | null {
    const config = this.config;
    if (!config) return null;

    const lowerIdentifier = identifier.toLowerCase();
    for (const [orgName, orgConfig] of Object.entries(config.organizations)) {
      if (
        orgConfig.identifiers.some((id: string) => lowerIdentifier.includes(id))
      ) {
        return { name: orgName, config: orgConfig };
      }
    }
    return null;
  }
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const circuitBreaker = new CircuitBreaker();

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    await ConfigManager.getConfig();

    const url = new URL(req.url);
    const pathname = url.pathname;
    const clientIp =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (RateLimiter.isRateLimited(clientIp)) {
      console.warn('Rate limit exceeded for IP: ' + clientIp);
      return new Response('Rate limit exceeded', { status: 429 });
    }

    console.log(
      '[' +
        requestId +
        '] Incoming webhook request from ' +
        clientIp +
        ' to ' +
        pathname
    );

    const reportMatch = pathname.match(/\/([^\/]+)\/report$/);
    if (reportMatch) {
      return await handleReportEndpoint(req, requestId, reportMatch[1]);
    }

    return await handleWebhookEndpoint(req, requestId);
  } catch (error) {
    console.error('[' + requestId + '] Unhandled error:', error);
    return new Response('Internal server error', { status: 500 });
  } finally {
    const duration = Date.now() - startTime;
    console.log('[' + requestId + '] Request completed in ' + duration + 'ms');
  }
}

async function handleReportEndpoint(
  req: NextRequest,
  requestId: string,
  routeOwner: string
) {
  try {
    const organization = ConfigManager.getOrganizationByIdentifier(routeOwner);
    if (!organization) {
      console.warn(
        '[' + requestId + '] Unsupported owner in route: ' + routeOwner
      );
      return new Response('Unsupported owner in route', { status: 400 });
    }

    const body = await req.json();
    const validatedPayload = validateWebhookPayload(body);

    const sanitizedPayload = {
      ...validatedPayload,
      title: sanitizeInput(validatedPayload.title),
      summary: sanitizeInput(validatedPayload.summary),
    };

    const appId = process.env[organization.config.app_id_env];
    const privateKey = process.env[
      organization.config.private_key_env
    ]?.replace(/\\n/g, '\n');

    if (!appId || !privateKey) {
      console.error(
        '[' +
          requestId +
          '] Missing GitHub App credentials for ' +
          organization.name
      );
      return new Response('Configuration error', { status: 500 });
    }

    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split('/');

    console.log(
      '[' +
        requestId +
        '] Processing check update for ' +
        sanitizedPayload.name +
        ' (' +
        sanitizedPayload.status +
        ')'
    );

    const result = await circuitBreaker.execute(async () => {
      const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: { appId, privateKey },
      });

      const installationResponse =
        await appOctokit.rest.apps.getRepoInstallation({ owner, repo });
      const installation = installationResponse?.data;

      if (!installation?.id) {
        throw new Error('Missing installation ID');
      }

      const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: { appId, privateKey, installationId: installation.id },
      });

      const list = await octokit.rest.checks.listForRef({
        owner,
        repo,
        ref: sanitizedPayload.sha,
      });

      const checkRun = list.data.check_runs.find(
        (c) => c.name === sanitizedPayload.name
      );

      if (!checkRun) {
        throw new Error(
          'Check run "' +
            sanitizedPayload.name +
            '" not found for sha ' +
            sanitizedPayload.sha
        );
      }

      const redisKey =
        'check:' +
        checkRun.id +
        ':' +
        sanitizedPayload.status +
        ':' +
        (sanitizedPayload.conclusion || 'none');
      const alreadyUpdated = await redis.get(redisKey);

      if (alreadyUpdated) {
        console.log(
          '[' +
            requestId +
            '] Duplicate check update skipped for ' +
            sanitizedPayload.name
        );
        return { duplicate: true };
      }

      await octokit.rest.checks.update({
        owner,
        repo,
        check_run_id: checkRun.id,
        status: sanitizedPayload.status,
        conclusion: sanitizedPayload.conclusion,
        completed_at:
          sanitizedPayload.conclusion ? new Date().toISOString() : undefined,
        output: {
          title: sanitizedPayload.title,
          summary: sanitizedPayload.summary,
        },
        details_url: sanitizedPayload.details_url,
      });

      await redis.set(redisKey, true, { ex: 600 });

      return { duplicate: false };
    });

    if (result.duplicate) {
      return new Response('⏭️ Duplicate check update skipped.', {
        status: 200,
      });
    }

    console.log('[' + requestId + '] Check run updated successfully');
    return new Response('✅ Check run updated', { status: 200 });
  } catch (error) {
    const err = error as Error;

    if (err.message.includes('Invalid')) {
      console.warn('[' + requestId + '] Validation error:', err.message);
      return new Response('Validation error: ' + err.message, { status: 400 });
    }

    if (err.message.includes('Circuit breaker is OPEN')) {
      console.warn('[' + requestId + '] Circuit breaker is open');
      return new Response('Service temporarily unavailable', { status: 503 });
    }

    console.error('[' + requestId + '] Failed to update check run:', err);
    return new Response('Internal error', { status: 500 });
  }
}

async function handleWebhookEndpoint(req: NextRequest, requestId: string) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || '';
    const event = req.headers.get('x-github-event') || '';

    console.log('[' + requestId + '] Processing webhook event: ' + event);

    const config = await ConfigManager.getConfig();
    const webhookSecrets = Object.values(config.organizations)
      .map((org) => process.env[org.webhook_secret_env])
      .filter(Boolean) as string[];

    let isValid = false;

    try {
      isValid = await Promise.any(
        webhookSecrets.map(async (secret) => {
          const result = await verify(secret, rawBody, signature);
          return result;
        })
      );
    } catch (error) {
      console.warn('[' + requestId + '] Signature verification failed:', error);
    }

    if (!isValid) {
      console.warn('[' + requestId + '] Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (event !== 'check_suite' || payload.action !== 'requested') {
      console.log(
        '[' + requestId + '] Event ignored: ' + event + '/' + payload.action
      );
      return new Response('Event ignored', { status: 200 });
    }

    const sha = payload.check_suite?.head_sha;
    const owner = payload.repository?.owner?.login;
    const repo = payload.repository?.name;
    const installationId = payload.installation?.id;

    if (!sha || !owner || !repo || !installationId) {
      console.warn('[' + requestId + '] Missing required payload data');
      return new Response('Missing required payload data', { status: 400 });
    }

    const organization = ConfigManager.getOrganizationByIdentifier(owner);
    if (!organization) {
      console.warn(
        '[' + requestId + '] Unsupported repository owner: ' + owner
      );
      return new Response('Unsupported repository owner', { status: 400 });
    }

    const checksCreatedKey = 'checks_created:' + sha;
    const alreadyCreated = await redis.get(checksCreatedKey);
    if (alreadyCreated) {
      console.log('[' + requestId + '] Checks already created for SHA: ' + sha);
      return new Response('⏭️ Checks already created for this SHA.', {
        status: 200,
      });
    }

    const appId = process.env[organization.config.app_id_env];
    const privateKey = process.env[
      organization.config.private_key_env
    ]?.replace(/\\n/g, '\n');

    if (!appId || !privateKey) {
      console.error(
        '[' +
          requestId +
          '] Missing GitHub App credentials for ' +
          organization.name
      );
      return new Response('Configuration error', { status: 500 });
    }

    const checkNames = [
      config.workflows.ci.name,
      'playwright-tests (chromium)',
      'playwright-tests (firefox)',
      'playwright-tests (webkit)',
      'playwright-tests (mobile-chrome)',
      'playwright-tests (mobile-safari)',
    ];

    console.log(
      '[' +
        requestId +
        '] Creating ' +
        checkNames.length +
        ' check runs for SHA: ' +
        sha
    );

    await circuitBreaker.execute(async () => {
      const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: { appId, privateKey, installationId },
      });

      const checkPromises = checkNames.map((checkName) =>
        octokit.rest.checks.create({
          owner,
          repo,
          name: checkName,
          head_sha: sha,
          status: 'queued',
          output: {
            title: checkName + ' - Queued',
            summary: checkName + ' has been queued and will start shortly.',
          },
        })
      );

      await Promise.all(checkPromises);
    });

    await redis.set(checksCreatedKey, true, { ex: 3600 });

    console.log('[' + requestId + '] All check runs created successfully');
    return new Response('✅ All check runs created', { status: 200 });
  } catch (error) {
    const err = error as Error;

    if (err.message.includes('Circuit breaker is OPEN')) {
      console.warn('[' + requestId + '] Circuit breaker is open');
      return new Response('Service temporarily unavailable', { status: 503 });
    }

    console.error('[' + requestId + '] Failed to process webhook:', err);
    return new Response('Internal error', { status: 500 });
  }
}
