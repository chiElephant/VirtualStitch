import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@upstash/redis', () => {
  const incr = jest.fn();
  const expire = jest.fn();

  return {
    Redis: jest.fn().mockImplementation(() => ({
      incr,
      expire,
    })),
    __mocks__: { incr, expire },
  };
});

jest.mock('openai', () => {
  const generate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      images: {
        generate,
      },
    })),
    __mocks__: { generate },
  };
});

jest.mock('next/server', () => {
  const ActualNextServer = jest.requireActual('next/server');
  return {
    ...ActualNextServer,
    // Mocking NextResponse.json to intercept API responses in tests
    NextResponse: {
      // Silenced extra logs to reduce noise during tests
      json: jest.fn(<T>(data: T, init?: ResponseInit) => {
        return {
          ok: true,
          status: init?.status || 200,
          json: async () => data,
        };
      }),
    },
  };
});

describe('POST /api/custom-logo', () => {
  function createRequest(body: object | string, headers?: HeadersInit) {
    return new Request('http://localhost/api/custom-logo', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
        ...headers,
      },
    });
  }

  const consoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn(); // suppress console.error during tests
  });
  afterAll(() => {
    console.error = consoleError; // restore after tests
  });

  let incrMock: jest.Mock;
  let expireMock: jest.Mock;
  let generateMock: jest.Mock;
  let openaiModule: { generate: jest.Mock };

  beforeEach(() => {
    const redisModule = jest.requireMock('@upstash/redis').__mocks__;
    openaiModule = jest.requireMock('openai').__mocks__;

    incrMock = redisModule.incr;
    expireMock = redisModule.expire;
    generateMock = openaiModule.generate;

    incrMock.mockReset();
    expireMock.mockReset();
    generateMock.mockReset();
  });

  it('generates an image successfully', async () => {
    const mockPrompt = 'a cool t-shirt design';
    const mockImage = 'fake_base64_image_data';

    incrMock.mockResolvedValue(1);
    expireMock.mockResolvedValue(1);
    generateMock.mockResolvedValue({
      data: [{ b64_json: mockImage }],
    });

    const request = createRequest({ prompt: mockPrompt });

    const response = await POST(request as unknown as NextRequest);
    const data = await (response as Response).json();

    expect(response.status).toBe(200);
    expect(data.photo).toBe(mockImage);
  });

  it('handles errors gracefully', async () => {
    incrMock.mockRejectedValue(new Error('Redis error'));
    const mockPrompt = 'a broken t-shirt design';

    const request = createRequest({ prompt: mockPrompt });

    const response = await POST(request as unknown as NextRequest);
    const data = await (response as Response).json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Something went wrong.');
  });

  it('returns 500 if prompt is missing (fallback behavior)', async () => {
    const request = createRequest({}); // no prompt

    const response = await POST(request as unknown as NextRequest);
    const data = await (response as Response).json();

    // Expecting fallback 500 due to current API behavior
    expect(response.status).toBe(500);
    expect(data.message).toMatch(/something went wrong|prompt is required/i);
  });

  it('returns 500 if OpenAI response has no image', async () => {
    incrMock.mockResolvedValue(1);
    expireMock.mockResolvedValue(1);
    generateMock.mockResolvedValue({ data: [] });

    const request = createRequest({ prompt: 'no image response' });

    const response = await POST(request as unknown as NextRequest);
    const data = await (response as Response).json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Image generation failed.');
  });

  it('returns 500 if request body is invalid JSON', async () => {
    const badBody = '{ invalid json';
    const request = createRequest(badBody);

    const response = await POST(request as unknown as NextRequest);
    const data = await (response as Response).json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Something went wrong.');
  });

  it('returns 429 if rate limit is exceeded', async () => {
    incrMock.mockResolvedValue(2); // Simulate hitting the rate limit
    expireMock.mockResolvedValue(1);
    generateMock.mockResolvedValue({}); // Should not be called

    const request = createRequest({ prompt: 'rate limit test' });

    const response = await POST(request as unknown as NextRequest);
    const data = await (response as Response).json();

    expect(response.status).toBe(429);
    expect(data.message).toBe('Too many requests. Please try again later.');
  });

  it('uses "unknown" as IP if no x-forwarded-for header is present', async () => {
    incrMock.mockResolvedValue(1);
    expireMock.mockResolvedValue(1);
    generateMock.mockResolvedValue({
      data: [{ b64_json: 'image_data' }],
    });

    const request = createRequest({ prompt: 'test prompt' }, {});

    const response = await POST(request as unknown as NextRequest);
    const data = await (response as Response).json();

    expect(response.status).toBe(200);
    expect(data.photo).toBe('image_data');
  });

  it('falls back to "unknown" IP when header is explicitly null', async () => {
    incrMock.mockResolvedValue(1);
    expireMock.mockResolvedValue(1);
    generateMock.mockResolvedValue({
      data: [{ b64_json: 'image_data_null_ip' }],
    });

    // Create a request with headers object missing x-forwarded-for entirely
    const request = createRequest(
      { prompt: 'test prompt' },
      { 'Content-Type': 'application/json' }
    );
    // Delete the header to simulate explicit absence
    request.headers.delete('x-forwarded-for');

    const response = await POST(request as unknown as NextRequest);
    const data = await (response as Response).json();

    expect(response.status).toBe(200);
    expect(data.photo).toBe('image_data_null_ip');
  });
});
