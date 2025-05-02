import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

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
