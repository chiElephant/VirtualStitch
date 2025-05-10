import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Redis } from '@upstash/redis';

const {
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
  OPENAI_API_KEY,
  API_RATE_LIMIT,
  NODE_ENV,
} = process.env;

const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL!,
  token: UPSTASH_REDIS_REST_TOKEN!,
});

const MAX_REQUESTS = 1;
const WINDOW_SECONDS = 60;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { message: 'Prompt is required.' },
        { status: 500 }
      );
    }

    if (API_RATE_LIMIT === 'true' && NODE_ENV === 'production') {
      console.log('API_RATE_LIMIT', API_RATE_LIMIT);
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      const key = `rate_limit:${ip}`;

      const reqCount = await redis.incr(key);
      if (reqCount === 1) {
        await redis.expire(key, WINDOW_SECONDS);
      }

      if (reqCount > MAX_REQUESTS) {
        return NextResponse.json(
          { message: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    }

    const response = await openai.images.generate({
      model: 'gpt-image-1',
      background: 'transparent',
      prompt,
      output_format: 'png',
      quality: 'medium',
      n: 1,
    });

    const image = response.data?.[0]?.b64_json;

    if (!image) {
      return NextResponse.json(
        { message: 'Image generation failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ photo: image });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
