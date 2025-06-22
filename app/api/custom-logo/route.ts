import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Redis } from '@upstash/redis';

const { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL, OPENAI_API_KEY } =
  process.env;

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
  // GUARANTEED LOGGING - THIS MUST APPEAR IF ROUTE IS HIT
  console.error('🚨 API ROUTE HIT - TIMESTAMP:', new Date().toISOString());
  
  try {
    const { prompt } = await req.json();
    console.error('🚨 RECEIVED PROMPT:', prompt);
    
    // COMPREHENSIVE VALIDATION
    
    // 1. Basic type and existence check
    if (!prompt || typeof prompt !== 'string') {
      console.error('🚨 REJECTED: Invalid prompt type');
      return NextResponse.json({ message: 'Invalid prompt' }, { status: 400 });
    }
    
    // 2. Length validation 
    const trimmed = prompt.trim();
    if (trimmed.length === 0) {
      console.error('🚨 REJECTED: Empty prompt');
      return NextResponse.json({ message: 'Prompt cannot be empty' }, { status: 400 });
    }
    
    if (trimmed.length > 1000) {
      console.error('🚨 REJECTED: Prompt too long ->', trimmed.length, 'chars');
      return NextResponse.json({ message: 'Prompt is too long. Maximum 1000 characters.' }, { status: 400 });
    }
    
    // 3. XSS and HTML injection protection
    const xssPatterns = [
      /<script[^>]*>/i,
      /<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i,
      /<link[^>]*>/i,
      /<meta[^>]*>/i,
      /<form[^>]*>/i,
      /<input[^>]*>/i,
      /<img[^>]*onerror/i,
      /<svg[^>]*onload/i,
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(trimmed)) {
        console.error('🚨 REJECTED: XSS pattern detected ->', pattern.toString());
        return NextResponse.json({ message: 'Malicious content detected. Please use a safe description.' }, { status: 400 });
      }
    }
    
    // 4. Template injection protection
    const templatePatterns = [
      /\$\{[^}]*\}/,     // ${...}
      /\{\{[^}]*\}\}/,   // {{...}}
      /%\{[^}]*\}/,      // %{...}
      /#\{[^}]*\}/,      // #{...}
    ];
    
    for (const pattern of templatePatterns) {
      if (pattern.test(trimmed)) {
        console.error('🚨 REJECTED: Template injection detected ->', pattern.toString());
        return NextResponse.json({ message: 'Template injection detected. Please use a safe description.' }, { status: 400 });
      }
    }
    
    // 5. SQL injection protection
    const sqlPatterns = [
      /';\s*(drop|delete|insert|update|create|alter|truncate)/i,
      /'\s*(or|and)\s*'.*?'/i,
      /union\s+(all\s+)?select/i,
      /--\s/,
      /\/\*.*?\*\//,
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(trimmed)) {
        console.error('🚨 REJECTED: SQL injection detected ->', pattern.toString());
        return NextResponse.json({ message: 'SQL injection detected. Please use a safe description.' }, { status: 400 });
      }
    }
    
    // 6. Path traversal protection
    if (trimmed.includes('../') || trimmed.includes('..\\') || 
        trimmed.includes('/etc/') || trimmed.includes('\\windows\\') ||
        trimmed.includes('system32') || trimmed.includes('/root/')) {
      console.error('🚨 REJECTED: Path traversal detected');
      return NextResponse.json({ message: 'Path traversal detected. Please use a safe description.' }, { status: 400 });
    }
    
    // 7. Command injection protection
    const commandPatterns = [
      /;\s*(rm|del|format|sudo|chmod|chown)/i,
      /\|\s*(curl|wget|nc|netcat|cat|ls|ps)/i,
      /`[^`]*`/,           // Backticks
      /\$\([^)]*\)/,       // $(...)
    ];
    
    for (const pattern of commandPatterns) {
      if (pattern.test(trimmed)) {
        console.error('🚨 REJECTED: Command injection detected ->', pattern.toString());
        return NextResponse.json({ message: 'Command injection detected. Please use a safe description.' }, { status: 400 });
      }
    }
    
    // 8. Suspicious keywords
    const suspiciousKeywords = [
      'eval', 'exec', 'system', 'shell', 'cmd', 'powershell',
      'document.cookie', 'localstorage', 'sessionstorage',
      'window.location', 'xmlhttprequest', 'fetch',
      'base64', 'atob', 'btoa', 'unescape', 'decodeuri'
    ];
    
    const lowerPrompt = trimmed.toLowerCase();
    for (const keyword of suspiciousKeywords) {
      if (lowerPrompt.includes(keyword)) {
        console.error('🚨 REJECTED: Suspicious keyword detected ->', keyword);
        return NextResponse.json({ message: 'Suspicious content detected. Please use a safe description.' }, { status: 400 });
      }
    }
    
    console.error('🚨 VALIDATION PASSED, PROCEEDING TO RATE LIMITING');

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const key = `rate_limit:${ip}`;

    const reqCount = await redis.incr(key);
    if (reqCount === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (reqCount > MAX_REQUESTS) {
      console.error('🚨 RATE LIMIT EXCEEDED');
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    console.error('🚨 CALLING OPENAI WITH CLEAN PROMPT:', trimmed);

    // Use the trimmed prompt (passed all validation)
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      background: 'transparent',
      prompt: trimmed,
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
    console.error('🚨 API ERROR:', error);
    return NextResponse.json(
      { message: 'Something went wrong.' },
      { status: 500 }
    );
  }
}
