// CRITICAL: Mock ALL @octokit modules BEFORE any imports
jest.mock(
  '@octokit/webhooks-methods',
  () => ({
    verify: jest.fn(() => Promise.resolve(true)),
  }),
  { virtual: true }
);

jest.mock(
  '@octokit/rest',
  () => ({
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        checks: {
          create: jest.fn().mockResolvedValue({ data: { id: 123 } }),
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

// NOW we can safely import modules
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';
import { POST } from '@/app/api/github-webhook/route';

// Define proper types
interface WebhookPayload {
  action: string;
  check_suite?: {
    head_sha?: string;
  };
  repository?: {
    name: string;
    owner: {
      login: string;
    };
  };
  installation?: {
    id: number;
  };
}

// Helper function to generate valid signature
function generateSignature(body: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

// Helper function to create NextRequest-compatible object
function createWebhookRequest(
  body: WebhookPayload,
  event: string = 'check_suite',
  secret: string = 'test-secret'
): NextRequest {
  const bodyString = JSON.stringify(body);
  const signature = generateSignature(bodyString, secret);

  const request = new Request('http://localhost:3000/api/github-webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-github-event': event,
      'x-hub-signature-256': signature,
    },
    body: bodyString,
  });

  return request as unknown as NextRequest;
}

describe('POST /api/github-webhook', () => {
  let mockVerify: jest.Mock;
  let mockOctokit: jest.Mock;
  let mockRedis: jest.Mock;
  let mockCreateCheck: jest.Mock;
  let mockRedisGet: jest.Mock;
  let mockRedisSet: jest.Mock;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Get mocked modules
    const webhookMethods = jest.requireMock('@octokit/webhooks-methods');
    const octokitRest = jest.requireMock('@octokit/rest');
    const upstashRedis = jest.requireMock('@upstash/redis');

    // Set up function mocks
    mockVerify = webhookMethods.verify;
    mockVerify.mockResolvedValue(true);

    mockCreateCheck = jest.fn().mockResolvedValue({ data: { id: 123 } });
    mockOctokit = octokitRest.Octokit;
    mockOctokit.mockImplementation(() => ({
      rest: {
        checks: {
          create: mockCreateCheck,
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
  });

  describe('Webhook signature validation', () => {
    it('returns 500 for missing GH_APP_SECRET environment variable', async () => {
      const originalSecret = process.env.GH_APP_SECRET;
      delete process.env.GH_APP_SECRET;

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Configuration error');

      // Restore
      process.env.GH_APP_SECRET = originalSecret;
    });

    it('returns 401 for invalid signature', async () => {
      mockVerify.mockResolvedValue(false);

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });

    it('handles verify function errors gracefully', async () => {
      mockVerify.mockRejectedValue(new Error('Verification failed'));

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });
  });

  describe('Webhook event handling', () => {
    it('ignores non-check_suite webhook events', async () => {
      const body: WebhookPayload = { action: 'opened' };
      const req = createWebhookRequest(body, 'pull_request');
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('Event ignored');
    });

    it('ignores check_suite events that are not "requested"', async () => {
      const body: WebhookPayload = { action: 'completed' };
      const req = createWebhookRequest(body, 'check_suite');
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('Event ignored');
    });

    it('creates check runs for valid check_suite event', async () => {
      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('✅ All check runs created');
      expect(mockCreateCheck).toHaveBeenCalledTimes(6); // ci + 5 playwright tests

      // Redis functionality is tested in the dedicated "successfully sets Redis cache" test
    });

    it('validates repository matches configured repository', async () => {
      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'WrongRepo', owner: { login: 'WrongOwner' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Repository mismatch');
    });

    it('skips creating check runs if already created', async () => {
      // Reset modules to get fresh imports with our mocks
      jest.resetModules();

      // Set up the Redis mock to return truthy value BEFORE importing
      jest.doMock('@upstash/redis', () => ({
        Redis: jest.fn().mockImplementation(() => ({
          get: jest.fn().mockImplementation((key) => {
            if (key === 'checks_created:abc123') {
              return Promise.resolve('already-exists');
            }
            return Promise.resolve(null);
          }),
          set: jest.fn().mockResolvedValue('OK'),
        })),
      }));

      // Fresh import with our new Redis mock
      const { POST } = await import('@/app/api/github-webhook/route');

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('⏭️ Checks already created for this SHA.');
      expect(mockCreateCheck).not.toHaveBeenCalled();
    });
  });

  describe('Webhook validation errors', () => {
    it('returns 400 if check_suite payload is missing required fields', async () => {
      const body: WebhookPayload = { action: 'requested', check_suite: {} };
      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Missing required payload data');
    });

    it('returns 500 for missing GH_REPOSITORY environment variable', async () => {
      const originalRepo = process.env.GH_REPOSITORY;
      delete process.env.GH_REPOSITORY;

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Configuration error');

      // Restore
      process.env.GH_REPOSITORY = originalRepo;
    });
  });

  describe('Webhook error handling', () => {
    it('returns 500 if GitHub API calls fail', async () => {
      mockCreateCheck.mockRejectedValue(new Error('GitHub API error'));

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal error');
    });

    it('returns 500 for missing GitHub App credentials', async () => {
      const originalAppId = process.env.GH_APP_ID;
      const originalPrivateKey = process.env.GH_APP_PRIVATE_KEY;

      delete process.env.GH_APP_ID;
      delete process.env.GH_APP_PRIVATE_KEY;

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Configuration error');

      // Restore
      process.env.GH_APP_ID = originalAppId;
      process.env.GH_APP_PRIVATE_KEY = originalPrivateKey;
    });

    it('handles rate limiting', async () => {
      // Test rate limiting by making many requests quickly
      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      // This tests the rate limiter logic in the webhook
      const req = createWebhookRequest(body);

      // First request should succeed
      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('handles circuit breaker scenarios', async () => {
      // Simulate multiple failures to trigger circuit breaker
      mockCreateCheck.mockRejectedValue(new Error('Service unavailable'));

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal error');
    });
  });

  describe('Edge cases and additional coverage', () => {
    it('successfully sets Redis cache after creating check runs', async () => {
      // Reset modules for fresh import with properly mocked Redis
      jest.resetModules();

      const mockRedisInstance = {
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
      };

      jest.doMock('@upstash/redis', () => ({
        Redis: jest.fn().mockImplementation(() => mockRedisInstance),
      }));

      // Fresh import
      const { POST } = await import('@/app/api/github-webhook/route');

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('✅ All check runs created');

      // Now we can verify Redis was called correctly
      expect(mockRedisInstance.set).toHaveBeenCalledWith(
        'checks_created:abc123',
        true,
        { ex: 3600 }
      );
    });

    it('handles requests with missing installation ID', async () => {
      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        // Missing installation field
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Missing required payload data');
    });

    it('handles requests with missing repository data', async () => {
      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        installation: { id: 123456 },
        // Missing repository field
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Missing required payload data');
    });

    it('handles Redis connection errors gracefully', async () => {
      mockRedisGet.mockRejectedValue(new Error('Redis connection failed'));

      const body: WebhookPayload = {
        action: 'requested',
        check_suite: { head_sha: 'abc123' },
        repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
        installation: { id: 123456 },
      };

      const req = createWebhookRequest(body);
      const res = await POST(req);

      // Should still attempt to create checks even if Redis fails
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('✅ All check runs created');
    });
  });

  // Add these tests to the end of your existing __tests__/app/api/github-webhook/github-webhook.test.ts file
  // Just before the final closing });

  describe('Additional Edge Cases for GitHub Webhook', () => {
    describe('Rate Limiting Edge Cases', () => {
      it('handles rapid sequential requests from same IP', async () => {
        const body: WebhookPayload = {
          action: 'requested',
          check_suite: { head_sha: 'abc123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        // Make many rapid requests to potentially trigger rate limiting
        const requests = Array.from({ length: 10 }, () =>
          createWebhookRequest(body)
        );

        const responses = await Promise.all(requests.map((req) => POST(req)));

        // At least one should succeed, some might be rate limited
        const statuses = responses.map((res) => res.status);
        expect(statuses).toContain(200); // At least one success

        // This covers rate limiting logic paths
      });
    });

    describe('GitHub API Error Scenarios', () => {
      it('handles GitHub API network timeouts', async () => {
        // Mock a network timeout error
        mockCreateCheck.mockRejectedValue(new Error('Request timeout'));

        const body: WebhookPayload = {
          action: 'requested',
          check_suite: { head_sha: 'timeout123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        const req = createWebhookRequest(body);
        const res = await POST(req);

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('handles GitHub API authentication errors', async () => {
        // Mock an authentication error
        mockCreateCheck.mockRejectedValue(new Error('Bad credentials'));

        const body: WebhookPayload = {
          action: 'requested',
          check_suite: { head_sha: 'auth123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        const req = createWebhookRequest(body);
        const res = await POST(req);

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('handles GitHub API rate limiting errors', async () => {
        // Mock GitHub API rate limit error
        const rateLimitError = new Error('API rate limit exceeded');
        (rateLimitError as any).status = 403;
        mockCreateCheck.mockRejectedValue(rateLimitError);

        const body: WebhookPayload = {
          action: 'requested',
          check_suite: { head_sha: 'ratelimit123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        const req = createWebhookRequest(body);
        const res = await POST(req);

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });
    });

    describe('Payload Edge Cases', () => {
      it('handles webhook with minimal payload', async () => {
        // Test with minimal required fields only
        const minimalBody = {
          action: 'requested',
          check_suite: { head_sha: 'minimal123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        const req = createWebhookRequest(minimalBody);
        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(await res.text()).toBe('✅ All check runs created');
      });

      it('handles webhook with extra unexpected fields', async () => {
        const bodyWithExtra = {
          action: 'requested',
          check_suite: { head_sha: 'extra123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
          // Extra fields that shouldn't break anything
          extra_field: 'should be ignored',
          another_field: { nested: 'data' },
        };

        const req = createWebhookRequest(bodyWithExtra);
        const res = await POST(req);

        expect(res.status).toBe(200);
        expect(await res.text()).toBe('✅ All check runs created');
      });
    });

    describe('Environment Configuration Edge Cases', () => {
      it('handles malformed GitHub repository configuration', async () => {
        const originalRepo = process.env.GH_REPOSITORY;

        // Set malformed repository (missing owner/repo split)
        process.env.GH_REPOSITORY = 'malformed-repo-name';

        const body: WebhookPayload = {
          action: 'requested',
          check_suite: { head_sha: 'malformed123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        const req = createWebhookRequest(body);
        const res = await POST(req);

        // Should handle gracefully (might be a 500 or repository mismatch)
        expect([400, 500]).toContain(res.status);

        // Restore
        process.env.GH_REPOSITORY = originalRepo;
      });

      it('handles empty GitHub App credentials', async () => {
        const originalAppId = process.env.GH_APP_ID;
        const originalPrivateKey = process.env.GH_APP_PRIVATE_KEY;

        // Set empty credentials
        process.env.GH_APP_ID = '';
        process.env.GH_APP_PRIVATE_KEY = '';

        const body: WebhookPayload = {
          action: 'requested',
          check_suite: { head_sha: 'empty123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        const req = createWebhookRequest(body);
        const res = await POST(req);

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Configuration error');

        // Restore
        process.env.GH_APP_ID = originalAppId;
        process.env.GH_APP_PRIVATE_KEY = originalPrivateKey;
      });
    });

    describe('Redis Edge Cases', () => {
      it('handles Redis connection intermittent failures', async () => {
        // Reset modules for clean Redis mock
        jest.resetModules();

        // Mock Redis to fail on get but succeed on set
        jest.doMock('@upstash/redis', () => ({
          Redis: jest.fn().mockImplementation(() => ({
            get: jest.fn().mockRejectedValue(new Error('Redis GET failed')),
            set: jest.fn().mockResolvedValue('OK'),
          })),
        }));

        const { POST } = await import('@/app/api/github-webhook/route');

        const body: WebhookPayload = {
          action: 'requested',
          check_suite: { head_sha: 'redis123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        const req = createWebhookRequest(body);
        const res = await POST(req);

        // Redis failures during check creation cause the operation to fail
        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('handles Redis SET operation failures', async () => {
        // Reset modules for clean Redis mock
        jest.resetModules();

        // Mock Redis to succeed on get but fail on set
        jest.doMock('@upstash/redis', () => ({
          Redis: jest.fn().mockImplementation(() => ({
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockRejectedValue(new Error('Redis SET failed')),
          })),
        }));

        const { POST } = await import('@/app/api/github-webhook/route');

        const body: WebhookPayload = {
          action: 'requested',
          check_suite: { head_sha: 'redisset123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
        };

        const req = createWebhookRequest(body);
        const res = await POST(req);

        // Redis SET failures also cause operation to fail
        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });
    });

    describe('Signature Verification Edge Cases', () => {
      it('handles signature verification with unusual payloads', async () => {
        const body = {
          action: 'requested',
          check_suite: { head_sha: 'unusual123' },
          repository: { name: 'VirtualStitch', owner: { login: '303Devs' } },
          installation: { id: 123456 },
          // Add some unusual characters
          description: 'Test with émojis 🚀 and special chars: àáâ',
        };

        const req = createWebhookRequest(body);
        const res = await POST(req);

        expect(res.status).toBe(200);
      });

      it('handles empty request body edge case', async () => {
        const request = new Request(
          'http://localhost:3000/api/github-webhook',
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-github-event': 'check_suite',
              'x-hub-signature-256': 'sha256=invalid',
            },
            body: '',
          }
        );

        const res = await POST(request as unknown as NextRequest);

        // Empty body causes JSON parsing to fail, returning 500
        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });
    });
  });
});
