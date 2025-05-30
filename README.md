# 🧵 VirtualStitch

## Technical Overview

VirtualStitch is a production-grade 3D apparel customization platform built with modern web technologies. It enables real-time t-shirt personalization through AI-generated designs, custom image uploads, and interactive 3D rendering. The application features enterprise-level CI/CD infrastructure with automated testing, deployment pipelines, and GitHub App integration for comprehensive quality assurance.

## 📊 Badges

![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)
![Next.js](https://img.shields.io/badge/Built%20With-Next.js-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.159-black?logo=three.js&logoColor=white)
![CI](https://github.com/ChiElephant/VirtualStitch/actions/workflows/ci.yml/badge.svg)

## Architecture & Technology Stack

### **Frontend Architecture**

- **Framework**: Next.js 15.3.1 with React 19 (App Router)
- **3D Engine**: Three.js 0.172 with React Three Fiber 9.0.0-rc.3
- **3D Components**: React Three Drei 10.0.7 for advanced 3D utilities
- **State Management**: Valtio 2.1.2 (proxy-based reactive state)
- **Animation**: Framer Motion 11.18.0 for smooth UI transitions
- **Styling**: Tailwind CSS 3.4.1 with custom glassmorphism effects
- **Math Utilities**: Maath 0.10.8 for 3D mathematical operations

### **Backend & APIs**

- **Runtime**: Node.js with Next.js API Routes
- **AI Integration**: OpenAI GPT-Image-1 model for design generation
- **Database/Cache**: Upstash Redis for rate limiting and state management
- **Authentication**: GitHub App authentication with Octokit integration
- **File Handling**: Native File API with base64 encoding for image processing

### **Development & Testing Stack**

- **Language**: TypeScript 5 with strict type checking
- **Testing Framework**: Jest 29.7.0 with 100% coverage requirement
- **E2E Testing**: Playwright 1.52.0 with multi-browser support
- **Linting**: ESLint 9 with Next.js configuration
- **Code Formatting**: Prettier 3.4.2 with custom configuration
- **Build System**: Next.js native bundler with Three.js transpilation

### **Infrastructure & DevOps**

- **Hosting**: Vercel with edge deployment
- **CI/CD**: Custom GitHub Actions workflows
- **Monitoring**: Self-hosted ARM64 Linux runners
- **Webhook Integration**: GitHub App with automated check reporting
- **Environment Management**: Secure environment variable handling

## Core Features & Implementation

### **3D Rendering Engine**

```typescript
// Real-time 3D t-shirt with physics-based materials
- PBR (Physically Based Rendering) materials
- Real-time shadow mapping with AccumulativeShadows
- Camera rig with responsive positioning
- Automatic model scaling and centering
- Canvas export capabilities for downloads
```

### **AI Design Generation**

```typescript
// Integration with OpenAI's image generation API
- Custom prompt processing with context optimization
- Rate limiting (1 request/60 seconds per IP)
- Base64 image encoding for seamless texture application
- Error handling with user-friendly feedback
- Redis-based request tracking
```

### **State Management Architecture**

```typescript
// Valtio proxy-based state with TypeScript interfaces
interface State {
  intro: boolean;
  color: string;
  isLogoTexture: boolean;
  isFullTexture: boolean;
  logoDecal: string;
  fullDecal: string;
}
```

### **Advanced CI/CD Pipeline**

#### **Multi-Stage Testing**

1. **Unit/Integration Tests**: Jest with 100% coverage requirement
2. **End-to-End Tests**: Playwright across Chromium, Firefox, WebKit
3. **Post-Deploy Smoke Tests**: Production environment validation
4. **Performance Monitoring**: Automated performance regression detection

#### **GitHub App Integration**

- Custom check run creation and updates
- Real-time CI status reporting
- Multi-organization support (303DEVS, CHIELEPHANT)
- Webhook signature verification with multiple secrets
- Redis-based deduplication for idempotent operations

## Installation & Setup

### **Prerequisites**

- Node.js 18.x or later (LTS recommended)
- npm 9.x or later
- Redis instance (Upstash recommended)
- OpenAI API access
- GitHub App credentials (for CI/CD features)

### **Environment Configuration**

```bash
# Core API Keys
OPENAI_API_KEY=your_openai_api_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# GitHub App Integration (Optional)
GITHUB_APP_ID_303DEVS=your_app_id
GITHUB_PRIVATE_KEY_303DEVS=your_private_key
303DEVS_GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Testing Environment
CI=false
BASE_URL=http://localhost:3000
VERCEL_AUTOMATION_BYPASS_SECRET=your_bypass_secret
```

### **Development Setup**

```bash
# Clone and install dependencies
git clone https://github.com/your-org/VirtualStitch.git
cd VirtualStitch
npm install --legacy-peer-deps

# Start development server
npm run dev

# Run test suites
npm run test              # Unit/Integration tests
npm run test:coverage     # Coverage report
npm run test:e2e         # Playwright E2E tests
```

## API Architecture

### **Custom Logo Generation (`/api/custom-logo`)**

```typescript
POST /api/custom-logo
Content-Type: application/json

Request:
{
  "prompt": "string (required)"
}

Response:
{
  "photo": "base64_encoded_image_string"
}

Rate Limits: 1 request per 60 seconds per IP
Error Codes: 429 (Rate Limited), 500 (Generation Failed)
```

### **GitHub Webhook Handler (`/api/github-webhook`)**

```typescript
POST /api/github-webhook/{ORG}/report
Authorization: Bearer {INTERNAL_APP_SECRET}

Features:
- Check run status updates
- Multi-organization support
- Webhook signature verification
- Redis-based deduplication
- Automatic check run creation
```

## Performance Specifications

### **Rendering Performance**

- **Target FPS**: 60fps on desktop, 30fps on mobile
- **Initial Load**: < 3 seconds (including 3D model)
- **Texture Application**: Real-time with < 100ms latency
- **Memory Usage**: < 150MB typical, < 300MB peak

### **Network Optimization**

- **Model Compression**: GLTF with Draco compression
- **Texture Streaming**: Progressive loading with fallbacks
- **CDN Integration**: Static assets via Vercel Edge Network
- **Cache Strategy**: Aggressive caching with Redis backing

## Security Implementation

### **Input Validation**

- Strict TypeScript interfaces for all API endpoints
- File type validation for image uploads
- Prompt sanitization for AI generation requests
- Rate limiting with IP-based tracking

### **Authentication & Authorization**

- GitHub App authentication with JWT tokens
- Webhook signature verification using HMAC-SHA256
- Environment-based secret management
- Cross-origin request protection

### **Data Protection**

- No persistent user data storage
- Temporary file handling with automatic cleanup
- Redis TTL for automatic data expiration
- Secure cookie handling for session management

## Testing Strategy

### **Coverage Requirements**

```json
{
  "branches": 100,
  "functions": 100,
  "lines": 100,
  "statements": 100
}
```

### **Test Categories**

1. **Unit Tests**: Component logic, utility functions, API handlers
2. **Integration Tests**: API endpoints, state management, file handling
3. **E2E Tests**: Complete user workflows across browsers
4. **Visual Regression**: 3D rendering consistency checks

### **Automated Quality Gates**

- All tests must pass before deployment
- Coverage thresholds enforced
- Lint checks with zero warnings
- Type checking with strict mode
- Performance budget enforcement

## Deployment Architecture

### **Vercel Integration**

```yaml
# Automatic deployments on push to main
# Preview deployments for pull requests
# Edge function optimization
# Global CDN distribution
```

### **CI/CD Workflow**

1. **Code Push** → Trigger CI pipeline
2. **Quality Checks** → Lint, type check, test execution
3. **Build Process** → Next.js optimization, asset compilation
4. **Deployment** → Vercel edge deployment
5. **Post-Deploy Testing** → Production smoke tests
6. **Health Monitoring** → Automated status reporting

## Scalability Considerations

### **Performance Scaling**

- **Edge Deployment**: Global CDN with regional optimization
- **Client-Side Rendering**: Reduced server load with CSR strategy
- **Asset Optimization**: Automatic image optimization and compression
- **Caching Strategy**: Multi-layer caching (Redis, CDN, browser)

### **Rate Limit Management**

- **Redis-based tracking**: Distributed rate limiting
- **IP-based restrictions**: Prevents abuse while allowing legitimate use
- **Graceful degradation**: Fallback behaviors for rate-limited users
- **Monitoring & Alerting**: Real-time rate limit monitoring

## Development Guidelines

### **Code Standards**

- **TypeScript**: Strict mode with comprehensive type coverage
- **Component Architecture**: Functional components with hooks
- **State Management**: Valtio proxy patterns with immutable updates
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance**: React.memo, useMemo, useCallback for optimization

### **Git Workflow**

- **Feature Branches**: All development in feature branches
- **Pull Requests**: Required for all changes with automated checks
- **Conventional Commits**: Standardized commit message format
- **Automated Releases**: Semantic versioning with automated changelog

## Monitoring & Observability

### **Application Metrics**

- **Performance**: Core Web Vitals tracking
- **Error Rates**: Real-time error monitoring
- **User Interactions**: Feature usage analytics
- **API Performance**: Response time and success rate monitoring

### **Infrastructure Metrics**

- **Deployment Health**: Automatic deployment status reporting
- **CI/CD Performance**: Build time and success rate tracking
- **Resource Usage**: Memory, CPU, and bandwidth monitoring
- **Security Events**: Authentication and rate limiting events

## Contributing

### **Development Process**

1. Fork the repository and create a feature branch
2. Implement changes with comprehensive test coverage
3. Ensure all quality gates pass (lint, test, type check)
4. Submit pull request with detailed description
5. Address code review feedback
6. Automated deployment upon approval and merge

### **Code Review Checklist**

- [ ] TypeScript types are comprehensive and accurate
- [ ] Test coverage meets 100% requirement
- [ ] Performance implications are considered
- [ ] Security best practices are followed
- [ ] Documentation is updated as needed
- [ ] Accessibility standards are maintained

## License & Support

**License**: MIT License - see LICENSE file for details

**Technical Support**: For technical questions, please open an issue on GitHub with detailed reproduction steps and environment information.

**Performance Issues**: Include browser console logs, network timing, and device specifications when reporting performance problems.

---

_This README reflects the current state of the VirtualStitch codebase. For the latest updates and changes, please refer to the CHANGELOG.md file and recent commit history._
