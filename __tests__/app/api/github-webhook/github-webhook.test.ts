// This is an arbitrary testing comment to be removed upon completion
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

jest.mock('@/lib/github', () => ({
  createCheckRun: jest.fn(),
  updateCheckRun: jest.fn(),
}));

jest.mock('@octokit/webhooks-methods', () => ({
  verify: jest.fn().mockResolvedValue(true),
}));

describe('POST /api/github-webhook', () => {
  const originalEnv = process.env;
  let getMock: jest.Mock;
  let setMock: jest.Mock;
  let createCheckRunMock: jest.Mock;
  let updateCheckRunMock: jest.Mock;
  let verifyMock: jest.Mock;

  const defaultEnv = {
    'GITHUB_REPOSITORY': '303Devs/VirtualStitch',
    'GITHUB_REPOSITORY_303DEVS': '303Devs/VirtualStitch',
    'GITHUB_APP_ID_303DEVS': '123',
    'GITHUB_PRIVATE_KEY_303DEVS':
      '-----BEGIN PRIVATE KEY-----\nfake\nkey\n-----END PRIVATE KEY-----',
    '303DEVS_GITHUB_WEBHOOK_SECRET': 'fake_secret',
    'GITHUB_REPOSITORY_CHIELEPHANT': 'chiElephant/VirtualStitch',
    'GITHUB_APP_ID_CHIELEPHANT': '123',
    'GITHUB_PRIVATE_KEY_CHIELEPHANT':
      '-----BEGIN PRIVATE KEY-----\nfake\nkey\n-----END PRIVATE KEY-----',
    'CHIELEPHANT_GITHUB_WEBHOOK_SECRET': 'fake_secret',
    'UPSTASH_REDIS_REST_URL': 'http://localhost:8080',
    'UPSTASH_REDIS_REST_TOKEN': 'token',
    'OPENAI_API_KEY': 'fake_key',
  };

  beforeEach(async () => {
    jest.resetModules();

    jest.doMock('@/lib/github', () => ({
      createCheckRun: jest.fn(),
      updateCheckRun: jest.fn(),
    }));

    const githubLib = await import('@/lib/github');
    createCheckRunMock = githubLib.createCheckRun as jest.Mock;
    updateCheckRunMock = githubLib.updateCheckRun as jest.Mock;

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
      createCheckRunMock,
      updateCheckRunMock,
      verifyMock,
      createMock,
      updateMock,
    ].forEach((mock) => mock.mockReset());

    // Set default return values
    getRepoInstallationMock.mockResolvedValue({ data: { id: 123 } });
    listForRefMock.mockResolvedValue({
      data: { check_runs: [{ id: 456, name: 'ci-checks' }] },
    });
    getMock.mockResolvedValue(null);
    setMock.mockResolvedValue(undefined);
    updateCheckRunMock.mockResolvedValue({ status: 200 });
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

    // Mock the params that Next.js would provide
    return { req, params: { slug: [routeOwner, 'report'] } };
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

    // Mock the params that Next.js would provide for base webhook
    return { req, params: { slug: [] } };
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

    return { req, params: { slug: ['unknown', 'path'] } };
  }

  // Fixed: Use a valid 40-character SHA
  const defaultReportPayload = {
    sha: '1234567890abcdef1234567890abcdef12345678',
    name: 'ci-checks',
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

    it('accepts valid route owner in mixed case', async () => {
      // Set the correct repository for CHIELEPHANT
      process.env.GITHUB_REPOSITORY = 'chiElephant/VirtualStitch';

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
    });

    it('uses default check name when name is not provided', async () => {
      const payload = {
        ...defaultReportPayload,
        name: 'ci-checks',
      };

      const { req, params } = makeReportRequest(payload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
    });

    it('updates check run without conclusion (skips completed_at)', async () => {
      const payload = {
        sha: '1234567890abcdef1234567890abcdef12345678',
        name: 'ci-checks',
        status: 'in_progress',
        title: 'Running',
        summary: 'Still checking...',
        details_url: 'https://example.com/details',
      };

      const { req, params } = makeReportRequest(payload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
    });

    describe('Error handling', () => {
      it('returns 500 if installation ID is missing', async () => {
        getRepoInstallationMock.mockResolvedValue({ data: {} });

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('returns 500 if updateCheckRun throws an error', async () => {
        updateMock.mockRejectedValue(new Error('Update failed'));

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('returns 500 when updateCheckRun throws synchronously', async () => {
        updateMock.mockImplementation(() => {
          throw new Error('sync throw');
        });

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('handles Redis set failure after successful update', async () => {
        setMock.mockRejectedValue(new Error('Redis failure'));

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });

      it('handles Redis set synchronous failure', async () => {
        setMock.mockImplementation(() => {
          throw new Error('Redis explosion');
        });

        const { req, params } = makeReportRequest(defaultReportPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
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

      const res = await POST(req, { params: { slug: [] } });
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

    it('creates check runs for check_suite event (303devs)', async () => {
      const { req, params } = makeWebhookRequest(defaultWebhookPayload);
      const res = await POST(req, { params });

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('✅ All check runs created');
    });

    it('creates check runs for CHIELEPHANT org', async () => {
      // Set the correct repository for CHIELEPHANT
      process.env.GITHUB_REPOSITORY = 'chiElephant/VirtualStitch';

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
      expect(createCheckRunMock).not.toHaveBeenCalled();
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
      it('returns 500 if createCheckRun fails', async () => {
        getMock.mockResolvedValue(false);
        createMock.mockRejectedValue(new Error('Failed to create'));

        const { req, params } = makeWebhookRequest(defaultWebhookPayload);
        const res = await POST(req, { params });

        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Internal error');
      });
    });
  });
});
