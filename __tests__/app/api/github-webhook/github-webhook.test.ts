import { NextRequest } from 'next/server';

let POST: typeof import('@/app/api/github-webhook/[...slug]/route').POST;

jest.mock('@upstash/redis', () => {
  const get = jest.fn();
  const set = jest.fn();
  return {
    Redis: jest.fn().mockImplementation(() => ({ get, set })),
    __mocks__: { get, set },
  };
});

const getRepoInstallationMock = jest.fn();
const listForRefMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      apps: {
        getRepoInstallation: getRepoInstallationMock,
      },
      checks: {
        listForRef: listForRefMock,
        create: createMock,
        update: updateMock,
      },
    },
  })),
}));

jest.mock('@octokit/auth-app', () => ({
  createAppAuth: jest.fn(),
}));

jest.mock('@octokit/webhooks-methods', () => ({
  verify: jest.fn().mockResolvedValue(true),
}));

describe('POST /api/github-webhook', () => {
  const originalEnv = process.env;
  let getMock: jest.Mock;
  let setMock: jest.Mock;
  let verifyMock: jest.Mock;

  const defaultEnv = {
    'GITHUB_REPOSITORY': '303Devs/VirtualStitch',
    'GITHUB_APP_ID_303DEVS': '123',
    'GITHUB_PRIVATE_KEY_303DEVS':
      '-----BEGIN PRIVATE KEY-----\nfake\nkey\n-----END PRIVATE KEY-----',
    '303DEVS_GITHUB_WEBHOOK_SECRET': 'fake_secret',
    'GITHUB_APP_ID_CHIELEPHANT': '456',
    'GITHUB_PRIVATE_KEY_CHIELEPHANT':
      '-----BEGIN PRIVATE KEY-----\nfake\nkey\n-----END PRIVATE KEY-----',
    'CHIELEPHANT_GITHUB_WEBHOOK_SECRET': 'fake_secret_2',
    'UPSTASH_REDIS_REST_URL': 'http://localhost:8080',
    'UPSTASH_REDIS_REST_TOKEN': 'token',
  };

  beforeEach(async () => {
    jest.resetModules();

    process.env = { ...originalEnv, ...defaultEnv };

    const redisMocks = jest.requireMock('@upstash/redis').__mocks__;
    getMock = redisMocks.get;
    setMock = redisMocks.set;
    verifyMock = jest.requireMock('@octokit/webhooks-methods').verify;

    // Reset all mocks
    [
      getRepoInstallationMock,
      listForRefMock,
      getMock,
      setMock,
      createMock,
      updateMock,
      verifyMock,
    ].forEach((mock) => mock.mockReset());

    // Set default return values
    getRepoInstallationMock.mockResolvedValue({ data: { id: 123 } });
    listForRefMock.mockResolvedValue({
      data: { check_runs: [{ id: 456, name: '✅ ci-checks' }] },
    });
    getMock.mockResolvedValue(null);
    setMock.mockResolvedValue(undefined);
    createMock.mockResolvedValue({});
    updateMock.mockResolvedValue({});
    verifyMock.mockResolvedValue(true);

    const route = await import('@/app/api/github-webhook/[...slug]/route');
    POST = route.POST;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // Helper functions
  function makeReportRequest(
    body: Record<string, unknown>,
    headers = {},
    routeOwner = '303DEVS'
  ) {
    const req = new Request(
      `http://localhost/api/github-webhook/${routeOwner}/report`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json', ...headers },
      }
    ) as unknown as NextRequest;

    // Return params as a Promise to match Next.js 15 behavior
    return {
      req,
      params: Promise.resolve({ slug: `${routeOwner}/report` }),
    };
  }

  function makeWebhookRequest(
    payload: Record<string, unknown>,
    event = 'check_suite',
    signature = 'valid'
  ) {
    const req = new Request('http://localhost/api/github-webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'x-hub-signature-256': signature,
        'x-github-event': event,
      },
    }) as unknown as NextRequest;

    // Return params as a Promise to match Next.js 15 behavior
    return {
      req,
      params: Promise.resolve({ slug: '' }),
    };
  }

  function makeUnknownPathRequest() {
    const req = new Request(
      'http://localhost/api/github-webhook/unknown/path',
      {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      }
    ) as unknown as NextRequest;

    // Return params as a Promise to match Next.js 15 behavior
    return {
      req,
      params: Promise.resolve({ slug: 'unknown/path' }),
    };
  }

  const defaultReportPayload = {
    sha: '1234567890abcdef1234567890abcdef12345678',
    name: '✅ ci-checks',
    status: 'completed',
    conclusion: 'success',
    title: 'Done',
    summary: 'All good',
    details_url: 'https://example.com/details',
  };

  const defaultWebhookPayload = {
    action: 'requested',
    check_suite: { head_sha: '1234567890abcdef1234567890abcdef12345678' },
    repository: { owner: { login: '303devs' }, name: 'VirtualStitch' },
    installation: { id: 999 },
  };

  describe('Route validation', () => {
    it('handles unsupported route owner', async () => {
      const { req, params } = makeReportRequest({}, {}, 'UNKNOWN');
      const res = await POST(req, { params });
      expect(res.status).toBe(400);
      expect(await res.text()).toBe('Unsupported owner in route');
    });

    it('accepts valid route owner for CHIELEPHANT', async () => {
      const { req, params } = makeReportRequest(
        defaultReportPayload,
        {},
        'CHIELEPHANT'
      );
      const res = await POST(req, { params });
      expect(res.status).not.toBe(400);
    });

    it('returns 404 for unknown paths', async () => {
      const { req, params } = makeUnknownPathRequest();
      const res = await POST(req, { params });
      expect(res.status).toBe(404);
      expect(await res.text()).toBe('Not found');
    });
  });

  describe('Payload validation', () => {
    it('validates SHA format', async () => {
      const invalidPayload = {
        ...defaultReportPayload,
        sha: 'invalid-sha',
      };

      const { req, params } = makeReportRequest(invalidPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Validation error: Invalid SHA');
    });

    it('validates status values', async () => {
      const invalidPayload = {
        ...defaultReportPayload,
        status: 'invalid-status',
      };

      const { req, params } = makeReportRequest(invalidPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Validation error: Invalid status');
    });

    it('validates conclusion values', async () => {
      const invalidPayload = {
        ...defaultReportPayload,
        conclusion: 'invalid-conclusion',
      };

      const { req, params } = makeReportRequest(invalidPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(400);
      expect(await res.text()).toContain(
        'Validation error: Invalid conclusion'
      );
    });

    it('validates name length', async () => {
      const invalidPayload = {
        ...defaultReportPayload,
        name: '',
      };

      const { req, params } = makeReportRequest(invalidPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Validation error: Invalid name');
    });

    it('validates title length', async () => {
      const invalidPayload = {
        ...defaultReportPayload,
        title: 'x'.repeat(201),
      };

      const { req, params } = makeReportRequest(invalidPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Validation error: Invalid title');
    });

    it('validates summary length', async () => {
      const invalidPayload = {
        ...defaultReportPayload,
        summary: 'x'.repeat(1001),
      };

      const { req, params } = makeReportRequest(invalidPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(400);
      expect(await res.text()).toContain('Validation error: Invalid summary');
    });

    it('validates details_url format', async () => {
      const invalidPayload = {
        ...defaultReportPayload,
        details_url: 'not-a-url',
      };

      const { req, params } = makeReportRequest(invalidPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(400);
      expect(await res.text()).toContain(
        'Validation error: Invalid details_url'
      );
    });
  });

  describe('Check run updates (report endpoint)', () => {
    it('skips duplicate check updates', async () => {
      getMock.mockResolvedValueOnce(true);

      const { req, params } = makeReportRequest(defaultReportPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('⏭️ Duplicate check update skipped.');
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('returns 500 if no check run is found', async () => {
      listForRefMock.mockResolvedValue({ data: { check_runs: [] } });

      const { req, params } = makeReportRequest(defaultReportPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal error');
    });

    it('updates check run successfully', async () => {
      const { req, params } = makeReportRequest(defaultReportPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('✅ Check run updated');
      expect(updateMock).toHaveBeenCalledWith({
        owner: '303Devs',
        repo: 'VirtualStitch',
        check_run_id: 456,
        status: 'completed',
        conclusion: 'success',
        completed_at: expect.any(String),
        output: {
          title: 'Done',
          summary: 'All good',
        },
        details_url: 'https://example.com/details',
      });
    });

    it('updates check run without conclusion (skips completed_at)', async () => {
      const payload = {
        sha: '1234567890abcdef1234567890abcdef12345678',
        name: '✅ ci-checks',
        status: 'in_progress',
        title: 'Running',
        summary: 'Still checking...',
        details_url: 'https://example.com/details',
      };

      const { req, params } = makeReportRequest(payload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(updateMock).toHaveBeenCalledWith({
        owner: '303Devs',
        repo: 'VirtualStitch',
        check_run_id: 456,
        status: 'in_progress',
        conclusion: undefined,
        completed_at: undefined,
        output: {
          title: 'Running',
          summary: 'Still checking...',
        },
        details_url: 'https://example.com/details',
      });
    });

    it('sanitizes HTML in title and summary', async () => {
      const payload = {
        ...defaultReportPayload,
        title: 'Test <script>alert("xss")</script>',
        summary: 'Summary with "quotes" & ampersand',
      };

      const { req, params } = makeReportRequest(payload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          output: {
            title: 'Test &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
            summary: 'Summary with &quot;quotes&quot; &amp; ampersand',
          },
        })
      );
    });

    describe('Error handling', () => {
      it('returns 500 if installation ID is missing', async () => {
        getRepoInstallationMock.mockResolvedValue({ data: {} });

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('returns 500 if update throws an error', async () => {
        updateMock.mockRejectedValue(new Error('Update failed'));

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('returns 503 when circuit breaker is open', async () => {
        // Simulate circuit breaker opening by causing multiple failures
        updateMock.mockRejectedValue(new Error('Service failure'));

        // Make 5 requests to trigger circuit breaker
        for (let i = 0; i < 5; i++) {
          const { req, params } = makeReportRequest(defaultReportPayload);
          await POST(req, { params });
        }

        // Next request should get circuit breaker response
        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(503);
        expect(await res.text()).toBe('Service temporarily unavailable');
      });

      it('handles Redis set failure after successful update', async () => {
        setMock.mockRejectedValue(new Error('Redis failure'));

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('returns 500 for missing GitHub App credentials', async () => {
        delete process.env.GITHUB_APP_ID_303DEVS;

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Configuration error');
      });
    });
  });

  describe('Webhook signature validation', () => {
    it('handles invalid webhook signature', async () => {
      verifyMock.mockResolvedValue(false);

      const { req, params } = makeWebhookRequest(
        defaultWebhookPayload,
        'check_suite',
        'invalid'
      );
      const res = await POST(req, { params });

      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });

    it('returns 401 if all webhook signature verifications throw', async () => {
      verifyMock.mockImplementation(() => {
        throw new Error('bad secret');
      });

      const { req, params } = makeWebhookRequest(defaultWebhookPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });

    it('uses fallback empty strings for missing signature and event headers', async () => {
      verifyMock.mockResolvedValue(false);

      const req = new Request('http://localhost/api/github-webhook', {
        method: 'POST',
        body: JSON.stringify({ action: 'requested', check_suite: {} }),
        headers: {},
      }) as unknown as NextRequest;

      const res = await POST(req, { params: Promise.resolve({ slug: '' }) });
      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    });
  });

  describe('Webhook event handling', () => {
    it('ignores non-check_suite webhook event', async () => {
      const { req, params } = makeWebhookRequest(
        { action: 'completed' },
        'push'
      );
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('Event ignored');
    });

    it('ignores check_suite events that are not "requested"', async () => {
      const payload = {
        ...defaultWebhookPayload,
        action: 'completed',
      };

      const { req, params } = makeWebhookRequest(payload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('Event ignored');
    });

    it('creates check runs for check_suite event (303devs)', async () => {
      const { req, params } = makeWebhookRequest(defaultWebhookPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('✅ All check runs created');
      expect(createMock).toHaveBeenCalledTimes(6); // ci + 5 playwright tests
    });

    it('creates check runs for CHIELEPHANT org', async () => {
      const payload = {
        ...defaultWebhookPayload,
        repository: { owner: { login: 'ChiElephant' }, name: 'VirtualStitch' },
      };

      const { req, params } = makeWebhookRequest(payload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('✅ All check runs created');
    });

    it('skips creating check runs if already created', async () => {
      getMock.mockResolvedValue(true);

      const { req, params } = makeWebhookRequest(defaultWebhookPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('⏭️ Checks already created for this SHA.');
      expect(createMock).not.toHaveBeenCalled();
    });

    describe('Webhook validation errors', () => {
      it('returns 400 if check_suite payload is missing required fields', async () => {
        const { req, params } = makeWebhookRequest({
          action: 'requested',
          check_suite: {},
        });
        const res = await POST(req, { params });

        expect(res.status).toBe(400);
        expect(await res.text()).toBe('Missing required payload data');
      });

      it('returns 400 for unsupported repository owner in webhook', async () => {
        const payload = {
          ...defaultWebhookPayload,
          repository: { owner: { login: 'unknown' }, name: 'repo' },
        };

        const { req, params } = makeWebhookRequest(payload);
        const res = await POST(req, { params });

        expect(res.status).toBe(400);
        expect(await res.text()).toBe('Unsupported repository owner');
      });
    });

    describe('Webhook error handling', () => {
      it('returns 500 if createMock fails', async () => {
        getMock.mockResolvedValue(false);
        createMock.mockRejectedValue(new Error('Failed to create'));

        const { req, params } = makeWebhookRequest(defaultWebhookPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('returns 503 when circuit breaker is open for webhook', async () => {
        // Simulate circuit breaker opening by causing multiple failures
        createMock.mockRejectedValue(new Error('Service failure'));

        // Make 5 requests to trigger circuit breaker
        for (let i = 0; i < 5; i++) {
          const { req, params } = makeWebhookRequest(defaultWebhookPayload);
          await POST(req, { params });
        }

        // Next request should get circuit breaker response
        const { req, params } = makeWebhookRequest(defaultWebhookPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(503);
        expect(await res.text()).toBe('Service temporarily unavailable');
      });

      it('returns 500 for missing GitHub App credentials in webhook', async () => {
        delete process.env.GITHUB_APP_ID_303DEVS;

        const { req, params } = makeWebhookRequest(defaultWebhookPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Configuration error');
      });
    });
  });

  describe('Rate limiting', () => {
    it('handles rate limiting', async () => {
      // The actual rate limiter uses a Map, but for testing we'll simulate
      // by making many requests quickly
      const requests = [];
      for (let i = 0; i < 101; i++) {
        const { req, params } = makeReportRequest(defaultReportPayload);
        requests.push(POST(req, { params }));
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429
      );
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
