import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { createOctokitApp, createCheckRun, updateCheckRun } from '@/lib/github';

// Mock createAppAuth because Octokit uses it internally
jest.mock('@octokit/auth-app', () => ({
  createAppAuth: jest.fn(),
}));

// Mock methods inside Octokit
const createMock = jest.fn();
const updateMock = jest.fn();

jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      rest: {
        checks: {
          create: createMock,
          update: updateMock,
        },
      },
    })),
  };
});

describe('github.ts utilities', () => {
  const fakeAppId = '123';
  const fakePrivateKey = 'fake-key';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOctokitApp', () => {
    it('calls Octokit constructor without installationId', () => {
      const octokit = createOctokitApp(fakeAppId, fakePrivateKey);
      expect(Octokit).toHaveBeenCalledWith({
        authStrategy: expect.any(Function),
        auth: {
          appId: fakeAppId,
          privateKey: fakePrivateKey,
        },
      });
      expect(typeof octokit.rest.checks.create).toBe('function');
    });

    it('calls Octokit constructor with installationId', () => {
      const octokit = createOctokitApp(fakeAppId, fakePrivateKey, 456);
      expect(Octokit).toHaveBeenCalledWith({
        authStrategy: expect.any(Function),
        auth: {
          appId: fakeAppId,
          privateKey: fakePrivateKey,
          installationId: 456,
        },
      });
      expect(typeof octokit.rest.checks.update).toBe('function');
    });
  });

  describe('createCheckRun', () => {
    it('calls octokit.rest.checks.create with options', async () => {
      const octokit = createOctokitApp(fakeAppId, fakePrivateKey);
      const options = {
        owner: 'org',
        repo: 'repo',
        name: 'check',
        head_sha: 'sha',
      };

      await createCheckRun(octokit, options);
      expect(createMock).toHaveBeenCalledWith(options);
    });
  });

  describe('updateCheckRun', () => {
    it('calls octokit.rest.checks.update with options', async () => {
      const octokit = createOctokitApp(fakeAppId, fakePrivateKey);
      const options = {
        owner: 'org',
        repo: 'repo',
        check_run_id: 123,
        status: 'completed',
      };

      await updateCheckRun(octokit, options);
      expect(updateMock).toHaveBeenCalledWith(options);
    });
  });
});
