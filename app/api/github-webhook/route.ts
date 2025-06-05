import { NextRequest } from 'next/server';
import { verify } from '@octokit/webhooks-methods';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { Redis } from '@upstash/redis';

// Utility functions
function generateRequestId(): string {
  return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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
    const clientIp =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (RateLimiter.isRateLimited(clientIp)) {
      console.error(
        '[' + requestId + '] Rate limit exceeded for IP: ' + clientIp
      );
      return new Response('Rate limit exceeded', { status: 429 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || '';
    const event = req.headers.get('x-github-event') || '';

    // Verify webhook signature
    const webhookSecret = process.env.GITHUB_APP_SECRET;
    if (!webhookSecret) {
      console.error(
        '[' + requestId + '] Missing GITHUB_APP_SECRET environment variable'
      );
      return new Response('Configuration error', { status: 500 });
    }

    let isValid = false;
    try {
      isValid = await verify(webhookSecret, rawBody, signature);
    } catch (error) {
      console.error(
        '[' + requestId + '] Signature verification failed:',
        error
      );
      return new Response('Unauthorized', { status: 401 });
    }

    if (!isValid) {
      console.error('[' + requestId + '] Invalid webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // Only handle check_suite requested events
    if (event !== 'check_suite' || payload.action !== 'requested') {
      return new Response('Event ignored', { status: 200 });
    }

    const sha = payload.check_suite?.head_sha;
    const owner = payload.repository?.owner?.login;
    const repo = payload.repository?.name;
    const installationId = payload.installation?.id;

    if (!sha || !owner || !repo || !installationId) {
      console.error('[' + requestId + '] Missing required payload data');
      return new Response('Missing required payload data', { status: 400 });
    }

    // Verify this webhook is for the correct repository
    const expectedRepo = process.env.GITHUB_REPOSITORY;
    if (!expectedRepo) {
      console.error(
        '[' + requestId + '] Missing GITHUB_REPOSITORY environment variable'
      );
      return new Response('Configuration error', { status: 500 });
    }

    const [expectedOwner, expectedRepoName] = expectedRepo.split('/');
    if (owner !== expectedOwner || repo !== expectedRepoName) {
      console.error(
        '[' +
          requestId +
          '] Webhook for unexpected repository: ' +
          owner +
          '/' +
          repo +
          ' (expected: ' +
          expectedOwner +
          '/' +
          expectedRepoName +
          ')'
      );
      return new Response('Repository mismatch', { status: 400 });
    }

    // Check if checks have already been created for this SHA
    const checksCreatedKey = 'checks_created:' + sha;
    const alreadyCreated = await redis.get(checksCreatedKey);
    if (alreadyCreated) {
      return new Response('⏭️ Checks already created for this SHA.', {
        status: 200,
      });
    }

    // Get GitHub App credentials
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(
      /\\n/g,
      '\n'
    );

    if (!appId || !privateKey) {
      console.error('[' + requestId + '] Missing GitHub App credentials');
      return new Response('Configuration error', { status: 500 });
    }

    // Define check names to create
    const checkNames = [
      '✅ ci-checks',
      'playwright-tests (chromium)',
      'playwright-tests (firefox)',
      'playwright-tests (webkit)',
      'playwright-tests (mobile-chrome)',
      'playwright-tests (mobile-safari)',
    ];

    // Create check runs
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

    // Mark checks as created in Redis
    await redis.set(checksCreatedKey, true, { ex: 3600 });

    return new Response('✅ All check runs created', { status: 200 });
  } catch (error) {
    const err = error as Error;

    if (err.message.includes('Circuit breaker is OPEN')) {
      console.error('[' + requestId + '] Circuit breaker is open');
      return new Response('Service temporarily unavailable', { status: 503 });
    }

    console.error('[' + requestId + '] Failed to process webhook:', err);
    return new Response('Internal error', { status: 500 });
  } finally {
    const duration = Date.now() - startTime;
    console.log('[' + requestId + '] Request completed in ' + duration + 'ms');
  }
}
