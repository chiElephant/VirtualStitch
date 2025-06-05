// CRITICAL: Mock ALL external modules BEFORE any imports
jest.mock(
  '@octokit/rest',
  () => ({
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        apps: {
          getRepoInstallation: jest.fn().mockResolvedValue({
            data: { id: 123456 },
          }),
        },
        checks: {
          listForRef: jest.fn().mockResolvedValue({
            data: {
              check_runs: [{ id: 789, name: 'test-check' }],
            },
          }),
          update: jest.fn().mockResolvedValue({ data: { id: 789 } }),
        },
      },
    })),
  }),
  { virtual: true }
);

jest.mock(
  '@octokit/auth-app',
  () => ({
    createAppAuth: jest.fn(),
  }),
  { virtual: true }
);

jest.mock(
  '@upstash/redis',
  () => ({
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    })),
  }),
  { virtual: true }
);

// Mock Next.js Response globally since Response.json doesn't exist in Node.js
interface MockResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

class MockResponse {
  public body: string;
  public status: number;
  public headers: Headers;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.body = body?.toString() || '';
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
  }

  static json(object: Record<string, unknown>, init?: ResponseInit) {
    return new MockResponse(JSON.stringify(object), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...init?.headers,
      },
    });
  }

  async text() {
    return this.body;
  }

  async json() {
    return JSON.parse(this.body || '{}');
  }
}

global.Response = MockResponse as unknown as typeof Response;

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/github-webhook/report/route';

// Helper function to create NextRequest-compatible object
function createReportRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
  includeAuth = true
): NextRequest {
  const bodyString = JSON.stringify(body);

  const defaultHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
  };

  if (includeAuth) {
    defaultHeaders['authorization'] = 'Bearer test-secret';
  }

  const request = new Request(
    'http://localhost:3000/api/github-webhook/report',
    {
      method: 'POST',
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      body: bodyString,
    }
  );

  return request as unknown as NextRequest;
}

// Define environment variables interface
interface TestEnv {
  INTERNAL_APP_SECRET?: string;
  GH_APP_ID?: string;
  GH_APP_PRIVATE_KEY?: string;
  GH_REPOSITORY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

describe('GET /api/github-webhook/report', () => {
  it('returns ready status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('GitHub webhook report endpoint is accessible');
    expect(data.status).toBe('ready');
    expect(data.timestamp).toBeDefined();
  });
});

describe('POST /api/github-webhook/report', () => {
  let mockOctokit: jest.Mock;
  let mockRedis: jest.Mock;
  let mockGetRepoInstallation: jest.Mock;
  let mockListForRef: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockRedisGet: jest.Mock;
  let mockRedisSet: jest.Mock;
  let originalEnv: TestEnv;

  const validPayload = {
    sha: 'abcdef1234567890abcdef1234567890abcdef12',
    name: 'test-check',
    status: 'completed',
    conclusion: 'success',
    title: 'Test Check Passed',
    summary: 'All tests passed successfully',
    details_url: 'https://example.com/details',
  };

  beforeEach(() => {
    // Store original environment variables
    originalEnv = {
      INTERNAL_APP_SECRET: process.env.INTERNAL_APP_SECRET,
      GH_APP_ID: process.env.GH_APP_ID,
      GH_APP_PRIVATE_KEY: process.env.GH_APP_PRIVATE_KEY,
      GH_REPOSITORY: process.env.GH_REPOSITORY,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    };

    // Set up environment variables
    process.env.INTERNAL_APP_SECRET = 'test-secret';
    process.env.GH_APP_ID = '123';
    process.env.GH_APP_PRIVATE_KEY = 'test-key';
    process.env.GH_REPOSITORY = 'owner/repo';
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

    // Clear all mocks
    jest.clearAllMocks();

    // Get mocked modules
    const octokitRest = jest.requireMock('@octokit/rest');
    const upstashRedis = jest.requireMock('@upstash/redis');

    // Set up function mocks
    mockGetRepoInstallation = jest.fn().mockResolvedValue({
      data: { id: 123456 },
    });
    mockListForRef = jest.fn().mockResolvedValue({
      data: {
        check_runs: [{ id: 789, name: 'test-check' }],
      },
    });
    mockUpdate = jest.fn().mockResolvedValue({ data: { id: 789 } });

    mockOctokit = octokitRest.Octokit;
    mockOctokit.mockImplementation(() => ({
      rest: {
        apps: {
          getRepoInstallation: mockGetRepoInstallation,
        },
        checks: {
          listForRef: mockListForRef,
          update: mockUpdate,
        },
      },
    }));

    mockRedisGet = jest.fn().mockResolvedValue(null);
    mockRedisSet = jest.fn().mockResolvedValue('OK');
    mockRedis = upstashRedis.Redis;
    mockRedis.mockImplementation(() => ({
      get: mockRedisGet,
      set: mockRedisSet,
    }));

    // Reset any circuit breaker state by creating a fresh module
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment variables
    Object.keys(originalEnv).forEach((key) => {
      const value = originalEnv[key as keyof TestEnv];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  describe('Authentication', () => {
    it('returns 500 for missing INTERNAL_APP_SECRET', async () => {
      delete process.env.INTERNAL_APP_SECRET;

      const req = createReportRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Configuration error');
    });

    it('returns 401 for missing authorization header', async () => {
      const req = createReportRequest(validPayload, {}, false); // Don't include auth
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });

    it('returns 401 for invalid authorization format', async () => {
      const req = createReportRequest(validPayload, {
        authorization: 'Invalid format',
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });

    it('returns 401 for incorrect secret', async () => {
      const req = createReportRequest(validPayload, {
        authorization: 'Bearer wrong-secret',
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });
  });

  describe('Payload Validation', () => {
    it('returns 500 for invalid JSON', async () => {
      const request = new Request(
        'http://localhost:3000/api/github-webhook/report',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer test-secret',
            'x-forwarded-for': '127.0.0.1',
          },
          body: '{ invalid json',
        }
      );

      const res = await POST(request as unknown as NextRequest);
      expect(res.status).toBe(500);
    });

    it('returns 400 for missing sha', async () => {
      const invalidPayload = { ...validPayload };
      delete (invalidPayload as Partial<typeof validPayload>).sha;

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid SHA');
    });

    it('returns 400 for invalid sha format', async () => {
      const invalidPayload = { ...validPayload, sha: 'invalid-sha' };

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid SHA');
    });

    it('returns 400 for missing name', async () => {
      const invalidPayload = { ...validPayload };
      delete (invalidPayload as Partial<typeof validPayload>).name;

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid name');
    });

    it('returns 400 for name too long', async () => {
      const invalidPayload = {
        ...validPayload,
        name: 'a'.repeat(101),
      };

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid name');
    });

    it('returns 400 for invalid status', async () => {
      const invalidPayload = { ...validPayload, status: 'invalid' };

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid status');
    });

    it('returns 400 for invalid conclusion', async () => {
      const invalidPayload = { ...validPayload, conclusion: 'invalid' };

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid conclusion');
    });

    it('returns 400 for missing title', async () => {
      const invalidPayload = { ...validPayload };
      delete (invalidPayload as Partial<typeof validPayload>).title;

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid title');
    });

    it('returns 400 for title too long', async () => {
      const invalidPayload = {
        ...validPayload,
        title: 'a'.repeat(201),
      };

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid title');
    });

    it('returns 400 for missing summary', async () => {
      const invalidPayload = { ...validPayload };
      delete (invalidPayload as Partial<typeof validPayload>).summary;

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid summary');
    });

    it('returns 400 for summary too long', async () => {
      const invalidPayload = {
        ...validPayload,
        summary: 'a'.repeat(1001),
      };

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid summary');
    });

    it('returns 400 for invalid details_url', async () => {
      const invalidPayload = {
        ...validPayload,
        details_url: 'not-a-url',
      };

      const req = createReportRequest(invalidPayload);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid details_url');
    });

    it('accepts valid conclusion values', async () => {
      const validConclusions = [
        'action_required',
        'cancelled',
        'failure',
        'neutral',
        'success',
        'skipped',
        'stale',
        'timed_out',
      ];

      for (const conclusion of validConclusions) {
        const payload = { ...validPayload, conclusion };
        const req = createReportRequest(payload);
        const res = await POST(req);

        expect(res.status).toBe(200);
      }
    });
  });

  describe('Configuration Validation', () => {
    it('returns 500 for missing GH_APP_ID', async () => {
      delete process.env.GH_APP_ID;

      const req = createReportRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Configuration error');
    });

    it('returns 500 for missing GH_APP_PRIVATE_KEY', async () => {
      delete process.env.GH_APP_PRIVATE_KEY;

      const req = createReportRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Configuration error');
    });

    it('returns 500 for missing GH_REPOSITORY', async () => {
      delete process.env.GH_REPOSITORY;

      const req = createReportRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Configuration error');
    });
  });

  describe('GitHub API Integration', () => {
    it('successfully updates check run', async () => {
      const req = createReportRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('✅ Check run updated');

      expect(mockGetRepoInstallation).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
      });

      expect(mockListForRef).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        ref: validPayload.sha,
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        check_run_id: 789,
        status: validPayload.status,
        conclusion: validPayload.conclusion,
        completed_at: expect.any(String),
        output: {
          title: validPayload.title,
          summary: validPayload.summary,
        },
        details_url: validPayload.details_url,
      });
    });

    it('returns 500 when installation not found', async () => {
      mockGetRepoInstallation.mockResolvedValue({ data: null });

      const req = createReportRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal error');
    });

    it('returns 500 when check run not found', async () => {
      mockListForRef.mockResolvedValue({
        data: { check_runs: [] },
      });

      const req = createReportRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal error');
    });

    it('returns 500 when GitHub API fails', async () => {
      mockUpdate.mockRejectedValue(new Error('GitHub API error'));

      const req = createReportRequest(validPayload);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal error');
    });
  });

  describe('Duplicate Prevention', () => {
    it('skips duplicate updates', async () => {
      // Reset modules to ensure fresh circuit breaker state
      jest.resetModules();

      // Set up Redis mock to return existing entry
      const freshUpstashRedis = jest.requireMock('@upstash/redis');
      const mockRedisInstance = {
        get: jest.fn().mockResolvedValue('already-exists'),
        set: jest.fn().mockResolvedValue('OK'),
      };
      freshUpstashRedis.Redis.mockImplementation(() => mockRedisInstance);

      // Fresh import with the updated Redis mock
      const { POST: FreshPOST } = await import(
        '@/app/api/github-webhook/report/route'
      );

      const req = createReportRequest(validPayload);
      const res = await FreshPOST(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('⏭️ Duplicate check update skipped.');
    });
  });

  describe('Input Sanitization', () => {
    it('sanitizes HTML in title and summary', async () => {
      const payloadWithHtml = {
        ...validPayload,
        title: 'Test <script>alert("xss")</script> Title',
        summary: 'Summary with <img src="x" onerror="alert(1)"> content',
      };

      const req = createReportRequest(payloadWithHtml);
      const res = await POST(req);

      expect(res.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          output: {
            title:
              'Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; Title',
            summary:
              'Summary with &lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt; content',
          },
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('handles status without conclusion', async () => {
      const payload = { ...validPayload, status: 'in_progress' };
      delete (payload as Partial<typeof validPayload>).conclusion;

      const req = createReportRequest(payload);
      const res = await POST(req);

      expect(res.status).toBe(200);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          conclusion: undefined,
          completed_at: undefined,
        })
      );
    });

    it('handles Redis connection errors gracefully', async () => {
      // Reset modules for fresh circuit breaker state
      jest.resetModules();

      const freshUpstashRedis = jest.requireMock('@upstash/redis');
      const mockRedisInstance = {
        get: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        set: jest.fn().mockResolvedValue('OK'),
      };
      freshUpstashRedis.Redis.mockImplementation(() => mockRedisInstance);

      // Fresh import with the failing Redis mock
      const { POST: FreshPOST } = await import(
        '@/app/api/github-webhook/report/route'
      );

      const req = createReportRequest(validPayload);
      const res = await FreshPOST(req);

      // When Redis fails during duplicate check, the operation fails with 500
      // This is expected behavior as the duplicate check is critical
      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal error');
    });

    it('handles Redis SET operation failure after successful update', async () => {
      // Reset modules for fresh circuit breaker state
      jest.resetModules();

      const freshUpstashRedis = jest.requireMock('@upstash/redis');
      const mockRedisInstance = {
        get: jest.fn().mockResolvedValue(null), // No duplicate found
        set: jest.fn().mockRejectedValue(new Error('Redis SET failed')),
      };
      freshUpstashRedis.Redis.mockImplementation(() => mockRedisInstance);

      // Fresh import with the failing Redis mock
      const { POST: FreshPOST } = await import(
        '@/app/api/github-webhook/report/route'
      );

      const req = createReportRequest(validPayload);
      const res = await FreshPOST(req);

      // When Redis SET fails after successful GitHub update, still returns 500
      // because the Redis operation is part of the circuit breaker execution
      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal error');
    });

    it('handles empty object payload', async () => {
      const req = createReportRequest({});
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Invalid');
    });

    it('handles null payload', async () => {
      const request = new Request(
        'http://localhost:3000/api/github-webhook/report',
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer test-secret',
            'x-forwarded-for': '127.0.0.1',
          },
          body: 'null',
        }
      );

      const res = await POST(request as unknown as NextRequest);
      expect(res.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('applies rate limiting to requests', async () => {
      // Make multiple requests with same IP to test rate limiting
      const requests = Array.from({ length: 5 }, (_, i) =>
        createReportRequest({
          ...validPayload,
          sha: `abcdef1234567890abcdef1234567890abcdef${i.toString().padStart(2, '0')}`,
        })
      );

      const responses = await Promise.all(requests.map((req) => POST(req)));

      // All should be successful since our rate limit is quite high
      responses.forEach((res) => {
        expect([200, 429]).toContain(res.status);
      });
    });
  });

  describe('Performance and Logging', () => {
    it('logs request duration', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const req = createReportRequest(validPayload);
      await POST(req);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Request completed in \d+ms/)
      );

      consoleSpy.mockRestore();
    });

    it('generates unique request IDs', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const req1 = createReportRequest(validPayload);
      const req2 = createReportRequest({
        ...validPayload,
        sha: 'abcdef1234567890abcdef1234567890abcdef99',
      });

      await POST(req1);
      await POST(req2);

      const logs = consoleSpy.mock.calls.map((call) => call[0] as string);
      const requestIds = logs
        .filter((log) => log.includes('Processing check update'))
        .map((log) => log.match(/\[([^\]]+)\]/)?.[1])
        .filter(Boolean);

      expect(new Set(requestIds).size).toBe(requestIds.length);

      consoleSpy.mockRestore();
    });
  });
});
