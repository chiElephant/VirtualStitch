import { NextRequest } from 'next/server';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { Redis } from '@upstash/redis';

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
function validatePayload(body: any) {
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

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const circuitBreaker = new CircuitBreaker();

// Test endpoint
export async function GET() {
  return Response.json({
    message: 'GitHub webhook report endpoint is accessible',
    timestamp: new Date().toISOString(),
    status: 'ready',
  });
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const { pathname } = new URL(req.url);
    const clientIp =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    if (RateLimiter.isRateLimited(clientIp)) {
      console.warn(
        '[' + requestId + '] Rate limit exceeded for IP: ' + clientIp
      );
      return new Response('Rate limit exceeded', { status: 429 });
    }

    console.log(
      '[' +
        requestId +
        '] Incoming report request from ' +
        clientIp +
        ' to ' +
        pathname
    );

    // Verify internal authentication
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.INTERNAL_APP_SECRET;

    if (!expectedSecret) {
      console.error(
        '[' + requestId + '] Missing INTERNAL_APP_SECRET environment variable'
      );
      return new Response('Configuration error', { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(
        '[' + requestId + '] Missing or invalid authorization header'
      );
      return new Response('Unauthorized', { status: 401 });
    }

    const providedSecret = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (providedSecret !== expectedSecret) {
      console.warn('[' + requestId + '] Invalid internal app secret');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse and validate payload
    const body = await req.json();
    const validatedPayload = validatePayload(body);

    const sanitizedPayload = {
      ...validatedPayload,
      title: sanitizeInput(validatedPayload.title),
      summary: sanitizeInput(validatedPayload.summary),
    };

    console.log(
      '[' +
        requestId +
        '] Processing check update for ' +
        sanitizedPayload.name +
        ' (' +
        sanitizedPayload.status +
        ')'
    );

    // Get GitHub App credentials
    const appId = process.env.GH_APP_ID;
    const privateKey = process.env.GH_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!appId || !privateKey) {
      console.error('[' + requestId + '] Missing GitHub App credentials');
      return new Response('Configuration error', { status: 500 });
    }

    if (!process.env.GH_REPOSITORY) {
      console.error(
        '[' + requestId + '] Missing GH_REPOSITORY environment variable'
      );
      return new Response('Configuration error', { status: 500 });
    }

    const [owner, repo] = process.env.GH_REPOSITORY.split('/');

    // Update check run
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

      // Check for duplicate updates
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

      // Update the check run
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

      // Mark as updated in Redis
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
  } finally {
    const duration = Date.now() - startTime;
    console.log('[' + requestId + '] Request completed in ' + duration + 'ms');
  }
}
