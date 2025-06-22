// config/promptValidation.ts

export interface PromptValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedPrompt?: string;
}

// Maximum prompt length (OpenAI has limits)
export const MAX_PROMPT_LENGTH = 1000;

// Patterns to detect malicious content
const MALICIOUS_PATTERNS = [
  // XSS patterns
  /<script[^>]*>.*?<\/script>/gi,
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>/gi,
  /<object[^>]*>/gi,
  /<embed[^>]*>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  
  // HTML injection
  /<[^>]*>/g,
  
  // Template injection
  /\$\{.*?\}/g,
  /\{\{.*?\}\}/g,
  /%\{.*?\}/g,
  
  // Command injection
  /;\s*(rm|del|format|drop|delete|truncate)/gi,
  /\|\s*(curl|wget|nc|netcat)/gi,
  
  // SQL injection patterns
  /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
  /'\s*(or|and)\s*'.*?'/gi,
];

// Suspicious keywords that shouldn't be in image prompts
const SUSPICIOUS_KEYWORDS = [
  'eval', 'exec', 'system', 'shell', 'cmd', 'powershell',
  'document.cookie', 'localStorage', 'sessionStorage',
  'window.location', 'redirect', 'fetch', 'xmlhttprequest',
  'base64', 'atob', 'btoa', 'unescape', 'decodeuri'
];

/**
 * Validates and sanitizes AI prompts for security
 */
export const validatePrompt = (prompt: string): PromptValidationResult => {
  // Check if prompt exists
  if (!prompt || typeof prompt !== 'string') {
    return {
      isValid: false,
      error: 'Prompt is required and must be a string.'
    };
  }

  // Trim whitespace
  const trimmedPrompt = prompt.trim();

  // Check length
  if (trimmedPrompt.length === 0) {
    return {
      isValid: false,
      error: 'Prompt cannot be empty.'
    };
  }

  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    return {
      isValid: false,
      error: `Prompt is too long. Maximum length is ${MAX_PROMPT_LENGTH} characters.`
    };
  }

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(trimmedPrompt)) {
      return {
        isValid: false,
        error: 'Prompt contains potentially harmful content. Please use a different description.'
      };
    }
  }

  // Check for suspicious keywords
  const lowerPrompt = trimmedPrompt.toLowerCase();
  for (const keyword of SUSPICIOUS_KEYWORDS) {
    if (lowerPrompt.includes(keyword.toLowerCase())) {
      return {
        isValid: false,
        error: 'Prompt contains restricted content. Please use a different description.'
      };
    }
  }

  // Basic sanitization - remove any remaining HTML-like content
  let sanitizedPrompt = trimmedPrompt
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/[{}]/g, '')
    .replace(/[\$%]/g, '');

  // Limit to alphanumeric, spaces, and basic punctuation
  sanitizedPrompt = sanitizedPrompt.replace(/[^\w\s.,!?()-]/g, ' ');

  // Clean up multiple spaces
  sanitizedPrompt = sanitizedPrompt.replace(/\s+/g, ' ').trim();

  return {
    isValid: true,
    sanitizedPrompt
  };
};

/**
 * Quick check if a prompt looks suspicious (for logging/monitoring)
 */
export const isSuspiciousPrompt = (prompt: string): boolean => {
  const validation = validatePrompt(prompt);
  return !validation.isValid;
};

/**
 * Safe prompt sanitization that always returns a string
 */
export const sanitizePrompt = (prompt: string): string => {
  const validation = validatePrompt(prompt);
  return validation.sanitizedPrompt || 'Invalid prompt';
};