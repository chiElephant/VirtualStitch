# 🧵 VirtualStitch

## ✨ Overview

VirtualStitch is a modern product customization platform built for e-commerce brands and design enthusiasts. It enables users to preview and personalize 3D-rendered t-shirts in real time using uploaded images or AI-generated art. The result is a seamless, interactive experience that drives engagement and conversion.

Whether you're launching a digital fashion storefront or showcasing generative design tools, VirtualStitch offers a powerful, customizable foundation.

## 📊 Badges

![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)
![Next.js](https://img.shields.io/badge/Built%20With-Next.js-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.159-black?logo=three.js&logoColor=white)
![CI](https://github.com/ChiElephant/VirtualStitch/actions/workflows/ci.yml/badge.svg)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🚀 Features

- 🖼 **Image Upload**: Upload custom images to apply as logos or full-shirt textures.
- 🤖 **AI-Generated Designs**: Uses OpenAI’s image generation endpoints to create personalized logos or patterns from user prompts.
- 🎨 **Real-Time Customization**: Apply colors, switch between logo/full modes, and preview instantly.
- 💾 **Download Options**: Download the full 3D canvas or just the applied logo/texture.
- 🔒 **Request Limiting**: Prevents excessive API calls using Upstash Redis.
- 🛠 **Fully Responsive**: Works across devices and screen sizes.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **3D Engine**: [Three.js](https://threejs.org)
- **State Management**: [Valtio](https://valtio.pmnd.rs)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **AI Integration**: [OpenAI API](https://platform.openai.com/)
- **Database & Rate Limiting**: [Upstash Redis](https://upstash.com/)
- **Hosting**: [Vercel](https://vercel.com)
- **Testing**: [Jest](https://jestjs.io), [Playwright](https://playwright.dev)

## 🖥 Setup & Development

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/chiElephant/VirtualStitch.git
cd VirtualStitch
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Configure Environment Variables

Create a `.env.local` file at the root with the following keys:

| Key                        | Description                     | Required |
| -------------------------- | ------------------------------- | -------- |
| `OPENAI_API_KEY`           | Your OpenAI API key             | ✅ Yes   |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST API URL      | ✅ Yes   |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis API token         | ✅ Yes   |
| `CI`                       | Set to true for CI environments | ❌ No    |
| `BASE_URL`                 | Base URL override for tests     | ❌ No    |

### 4️⃣ Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## ✅ Testing

We use [Jest](https://jestjs.io) for unit/integration tests and [Playwright](https://playwright.dev) for end-to-end tests.

All components and API routes are covered by unit and integration tests. We aim for 100% coverage across components, API routes, and logic. Run tests with:

```bash
npm run test
# or with coverage
npm run test:coverage
# or E3E
npm run test:e2e
```

Example coverage report:

![Coverage Report](/images/coverage_report.png)

## ⚙️ CI/CD

This repo includes a custom CI/CD pipeline that:

- Runs all Jest and Playwright tests on every push and PR
- Deploys only after tests pass
- Automatically triggers post-deploy Playwright smoke tests against the production Vercel deployment

## 🚀 Deployment

The app is designed for seamless deployment to [Vercel](https://vercel.com). Push your main branch and connect your repository to Vercel for continuous deployment.

This repository includes a CI/CD pipeline via GitHub Actions that runs tests automatically before deployment. Vercel handles continuous deployment from the `main` branch.

## 🖼 Screenshots

### 🏠 Home Page

![Home Screenshot](/images/screenshot_1.png)

_Home page with main call-to-action and 3D canvas._

### 🎨 Customizer - Color Picker

![Customizer Color Picker](/images/screenshot_2.png)

_Color picker interface for customizing t-shirt colors._

### 🤖 Customizer - AI Picker

![Customizer AI Picker](/images/screenshot_3.png)

_AI design generation interface for creating unique logos and patterns._

### 📂 Customizer - File Upload

![Customizer File Upload](/images/screenshot_4.png)

_Upload custom images to apply as decals or full-shirt textures._

### 📥 Download Functionality

![Download Feature](/images/screenshot_5.png)

_Options to download the full 3D canvas or applied designs._

### 🧪 Test Coverage Report

![Coverage Report](/images/coverage_report.png)

_Test coverage report showing 100% coverage._

## 🗺 Roadmap

- [x] Full AI + file-based customization
- [x] Post-deploy smoke tests
- [ ] Mobile-first optimization
- [ ] Add animation to loading and interaction states
- [ ] Internationalization (i18n)

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
